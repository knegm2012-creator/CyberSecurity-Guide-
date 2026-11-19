import { NextRequest, NextResponse } from 'next/server';
import { Type } from '@google/genai';
import {
  getGeminiClient,
  GEMINI_TEXT_MODEL,
  generateCustomLlmCompletion,
} from '@/lib/gemini';
import {
  apiSecurityHeaders,
  getClientIp,
  parseJsonBodySafe,
  RequestBodyError,
  tutorRateLimiter,
} from '@/lib/security';
import {
  buildLocalCompanionResponse,
  buildLocalDebugResponse,
  buildLocalEli9Response,
  buildLocalLabReviewResponse,
  buildLocalSearchGroundingResponse,
  buildLocalStudyPlanResponse,
  getFallbackQuizForStage,
  sanitizeGroundingSources,
  validateQuizItems,
} from '@/lib/local-mentor';
import {
  consumeMentorDailyQuotaServer,
  getMentorQuotaSnapshotServer,
} from '@/lib/mentor-quota-server';
import type { MentorQuotaSnapshot } from '@/lib/mentor-quota';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface TutorRequestBody {
  action?: string;
  stageId?: string;
  stageTitle?: string;
  workspace?: string;
  promptText?: string;
  codeOrError?: string;
  completedTopicsCount?: number;
  dailyGoalMinutes?: number;
  requestedDailyLimit?: number;
  preferOffline?: boolean;
  recentHistory?: Array<{ role?: string; text?: string }>;
}

const MAX_PROMPT_CHARS = 8000;
const MAX_CODE_CHARS = 16000;
const GEMINI_TIMEOUT_MS = 8500;

async function withTimeout<T>(promise: Promise<T>, timeoutMs = GEMINI_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`AI upstream timed out after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function extractJsonArrayCandidate(rawText: string): unknown {
  const trimmed = rawText.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : trimmed;
  const start = candidate.indexOf('[');
  const end = candidate.lastIndexOf(']');
  if (start !== -1 && end > start) {
    return JSON.parse(candidate.slice(start, end + 1));
  }
  return JSON.parse(candidate);
}

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);
  const rateCheck = tutorRateLimiter.tryConsume(clientIp);
  const headers = apiSecurityHeaders({
    'X-RateLimit-Remaining': String(rateCheck.remaining),
    ...(rateCheck.allowed ? {} : { 'Retry-After': String(rateCheck.retryAfterSec) }),
  });

  if (!rateCheck.allowed) {
    const quota = await getMentorQuotaSnapshotServer(rateCheck.remaining, rateCheck.retryAfterSec).catch(
      () => undefined
    );
    return NextResponse.json(
      {
        error: `Burst rate limit reached. Cooldown: ${rateCheck.retryAfterSec}s before next request.`,
        rateLimited: true,
        retryAfterSec: rateCheck.retryAfterSec,
        ...(quota ? { quota } : {}),
      },
      { status: 429, headers }
    );
  }

  try {
    const body = await parseJsonBodySafe<TutorRequestBody>(req, 64 * 1024);

    const action = typeof body.action === 'string' ? body.action.trim() : '';
    const stageId = typeof body.stageId === 'string' ? body.stageId.trim().slice(0, 32) : 'stage-0';
    const stageTitle = typeof body.stageTitle === 'string' ? body.stageTitle.trim().slice(0, 160) : 'Computer Science';
    const workspace = typeof body.workspace === 'string' ? body.workspace.trim().slice(0, 32) : 'overview';
    const promptText = typeof body.promptText === 'string' ? body.promptText.trim().slice(0, MAX_PROMPT_CHARS) : '';
    const codeOrError = typeof body.codeOrError === 'string' ? body.codeOrError.slice(0, MAX_CODE_CHARS) : '';
    const preferOffline = body.preferOffline === true;
    const requestedDailyLimit =
      typeof body.requestedDailyLimit === 'number' && Number.isFinite(body.requestedDailyLimit)
        ? body.requestedDailyLimit
        : undefined;

    if (!action) {
      return NextResponse.json({ error: 'Action is required.' }, { status: 400, headers });
    }

    const ai = preferOffline ? null : getGeminiClient();

    let quotaSnapshot: MentorQuotaSnapshot;
    if (!preferOffline) {
      const quotaResult = await consumeMentorDailyQuotaServer({
        requestedLimit: requestedDailyLimit,
        burstRemaining: rateCheck.remaining,
        retryAfterSec: 0,
      });
      quotaSnapshot = quotaResult.snapshot;

      if (!quotaResult.allowed) {
        return NextResponse.json(
          {
            error: `Daily request limit reached (${quotaSnapshot.usedToday}/${quotaSnapshot.dailyLimit}). Adjust your daily limit in Settings or switch to free Offline Engine.`,
            dailyLimitReached: true,
            quota: quotaSnapshot,
          },
          { status: 429, headers }
        );
      }
    } else {
      quotaSnapshot = await getMentorQuotaSnapshotServer(rateCheck.remaining, 0);
    }

    if (action === 'companion') {
      if (!promptText) {
        return NextResponse.json({ error: 'Please ask a question or pick a quick prompt.' }, { status: 400, headers });
      }

      const historyTurns = Array.isArray(body.recentHistory)
        ? body.recentHistory
            .slice(-4)
            .filter(
              (item): item is { role: string; text: string } =>
                Boolean(item && typeof item.role === 'string' && typeof item.text === 'string')
            )
            .map((item) => `${item.role === 'assistant' ? 'Buddy' : 'Learner'}: ${item.text.slice(0, 600)}`)
            .join('\n')
        : '';

      const systemInstruction = `You are "Odyssey Buddy", a warm, smart, energetic live Computer Science study partner accompanying the learner across their CS Odyssey.
Keep replies punchy, friendly, accurate, and beginner-to-pro adaptable (under 180 words unless code needs more):
- Reference their current workspace (${workspace}) and stage (${stageTitle}) naturally.
- Use clear intuition first, then give one concrete next command, snippet, or mental check.`;

      const userPrompt = historyTurns
        ? `Recent context:\n${historyTurns}\n\nCurrent question in ${workspace} (${stageTitle}): "${promptText}"`
        : `Current workspace: ${workspace} · ${stageTitle}\nQuestion: "${promptText}"`;

      if (ai) {
        try {
          const response = await withTimeout(
            ai.models.generateContent({
              model: GEMINI_TEXT_MODEL,
              contents: userPrompt,
              config: { systemInstruction },
            })
          );
          if (response.text?.trim()) {
            return NextResponse.json(
              { result: response.text.trim(), source: 'gemini', quota: quotaSnapshot },
              { headers }
            );
          }
        } catch (err) {
          console.warn('Gemini companion local synthesis fallback:', err instanceof Error ? err.message : err);
        }
      }

      if (!preferOffline) {
        const customReply = await generateCustomLlmCompletion({ systemInstruction, prompt: userPrompt });
        if (customReply) {
          return NextResponse.json(
            { result: customReply, source: 'custom-llm', quota: quotaSnapshot },
            { headers }
          );
        }
      }

      return NextResponse.json(
        {
          result: buildLocalCompanionResponse(stageId, promptText, workspace),
          source: 'local',
          quota: quotaSnapshot,
        },
        { headers }
      );
    }

    if (action === 'eli9') {
      if (!promptText) {
        return NextResponse.json({ error: 'Please enter a concept or question.' }, { status: 400, headers });
      }

      const systemInstruction = `You are an exceptionally friendly, encouraging, and precise Computer Science & Systems tutor tailored for a self-taught learner mastering CS from foundations to systems engineering.
Use the "Explain Clearly First" method:
1. Start with a vivid, intuitive real-world analogy.
2. Connect that analogy directly to the real computer science mechanism (CPU, memory, packets, algorithms, or compiler).
3. Include a concise, accurate 2-6 line Python, C, or shell example.
4. End with one practical Pro Tip or common pitfall to avoid.
Keep the explanation focused, well-structured, and free of fluff.`;
      const userPrompt = `Explain this computer science concept for ${stageTitle}: "${promptText}"`;

      if (ai) {
        try {
          const response = await withTimeout(
            ai.models.generateContent({
              model: GEMINI_TEXT_MODEL,
              contents: userPrompt,
              config: { systemInstruction },
            })
          );
          if (response.text?.trim()) {
            return NextResponse.json({ result: response.text.trim(), source: 'gemini', quota: quotaSnapshot }, { headers });
          }
        } catch (err) {
          console.warn('Gemini ELI9 local synthesis fallback:', err instanceof Error ? err.message : err);
        }
      }

      if (!preferOffline) {
        const customReply = await generateCustomLlmCompletion({ systemInstruction, prompt: userPrompt });
        if (customReply) {
          return NextResponse.json({ result: customReply, source: 'custom-llm', quota: quotaSnapshot }, { headers });
        }
      }

      return NextResponse.json(
        {
          result: buildLocalEli9Response(stageId, promptText),
          source: 'local',
          quota: quotaSnapshot,
        },
        { headers }
      );
    }

    if (action === 'search') {
      if (!promptText) {
        return NextResponse.json({ error: 'Please enter a search query or topic.' }, { status: 400, headers });
      }

      const systemInstruction = `You are a Systems Engineering research mentor helping a student studying "${stageTitle}".
Answer with accurate, up-to-date engineering specifications, RFCs, language versions, CVE defenses, or documentation links.
Format clearly in Markdown with concise bullet points and practical engineering takeaways.`;

      if (ai) {
        try {
          const response = await withTimeout(
            ai.models.generateContent({
              model: GEMINI_TEXT_MODEL,
              contents: `Search the web and give an accurate, verifiable engineering explanation for: "${promptText}"`,
              config: {
                systemInstruction,
                tools: [{ googleSearch: {} }],
              },
            }),
            12000
          );

          const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
          const sources = sanitizeGroundingSources(rawChunks);
          if (response.text?.trim()) {
            return NextResponse.json(
              {
                result: response.text.trim(),
                sources,
                source: 'gemini-search',
                quota: quotaSnapshot,
              },
              { headers }
            );
          }
        } catch (err) {
          console.warn('Gemini search grounding fallback:', err instanceof Error ? err.message : err);
        }
      }

      if (!preferOffline) {
        const customReply = await generateCustomLlmCompletion({
          systemInstruction,
          prompt: `Provide a thorough, specification-accurate engineering brief on: "${promptText}"`,
        });
        if (customReply) {
          const catalog = buildLocalSearchGroundingResponse(stageId, promptText);
          return NextResponse.json(
            {
              result: customReply,
              sources: catalog.sources,
              source: 'custom-llm',
              quota: quotaSnapshot,
            },
            { headers }
          );
        }
      }

      const fallback = buildLocalSearchGroundingResponse(stageId, promptText);
      return NextResponse.json(
        {
          result: fallback.result,
          sources: fallback.sources,
          source: 'local-catalog',
          quota: quotaSnapshot,
        },
        { headers }
      );
    }

    if (action === 'quiz') {
      const quizPrompt = `Generate a 5-question multiple-choice quiz testing core concepts of: "${stageTitle}" with focus on: "${promptText || 'core concepts'}".
Make questions practical, technical, and clear.
Return a strict JSON array where each element has:
- "question": string
- "options": string[4]
- "correctIndex": integer (0, 1, 2, or 3)
- "explanation": string`;

      if (ai) {
        try {
          const response = await withTimeout(
            ai.models.generateContent({
              model: GEMINI_TEXT_MODEL,
              contents: quizPrompt,
              config: {
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING },
                      options: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      correctIndex: { type: Type.INTEGER },
                      explanation: { type: Type.STRING },
                    },
                    required: ['question', 'options', 'correctIndex', 'explanation'],
                  },
                },
              },
            })
          );

          if (response.text) {
            const parsed = JSON.parse(response.text);
            const validated = validateQuizItems(parsed);
            if (validated) {
              return NextResponse.json({ quiz: validated, source: 'gemini', quota: quotaSnapshot }, { headers });
            }
          }
        } catch (err) {
          console.warn('Gemini quiz fallback:', err instanceof Error ? err.message : err);
        }
      }

      if (!preferOffline) {
        const customQuizText = await generateCustomLlmCompletion({
          systemInstruction:
            'You are a Computer Science assessment generator. Output ONLY valid raw JSON matching the schema with zero markdown commentary.',
          prompt: quizPrompt,
        });
        if (customQuizText) {
          try {
            const parsed = extractJsonArrayCandidate(customQuizText);
            const validated = validateQuizItems(parsed);
            if (validated) {
              return NextResponse.json({ quiz: validated, source: 'custom-llm', quota: quotaSnapshot }, { headers });
            }
          } catch {
            // Fall through cleanly to verified quiz bank
          }
        }
      }

      return NextResponse.json(
        {
          quiz: getFallbackQuizForStage(stageId),
          source: 'verified-bank',
          quota: quotaSnapshot,
        },
        { headers }
      );
    }

    if (action === 'debug') {
      if (!promptText && !codeOrError.trim()) {
        return NextResponse.json(
          { error: 'Provide either an error message, code snippet, or symptom description.' },
          { status: 400, headers }
        );
      }

      const systemInstruction = `You are a patient, sharp Computer Science Debugging Mentor for learners practicing Linux, Python, C, C++, Go, Git, SQL, and networking.
Analyze their code/error cleanly:
1. "What went wrong in plain English" (1-2 sentences).
2. "Why it happened" (underlying mechanism: memory, syntax, types, permissions, or shell parsing).
3. "The exact command or code fix" (copyable snippet).
4. "How to verify it worked".`;

      const contents = `Code / Command:\n\`\`\`\n${codeOrError}\n\`\`\`\nNotes / Question: ${promptText || 'Why did this fail and how do I fix it?'}`;

      if (ai) {
        try {
          const response = await withTimeout(
            ai.models.generateContent({
              model: GEMINI_TEXT_MODEL,
              contents,
              config: { systemInstruction },
            })
          );
          if (response.text?.trim()) {
            return NextResponse.json({ result: response.text.trim(), source: 'gemini', quota: quotaSnapshot }, { headers });
          }
        } catch (err) {
          console.warn('Gemini debug fallback:', err instanceof Error ? err.message : err);
        }
      }

      if (!preferOffline) {
        const customReply = await generateCustomLlmCompletion({ systemInstruction, prompt: contents });
        if (customReply) {
          return NextResponse.json({ result: customReply, source: 'custom-llm', quota: quotaSnapshot }, { headers });
        }
      }

      return NextResponse.json(
        {
          result: buildLocalDebugResponse(codeOrError, promptText),
          source: 'local',
          quota: quotaSnapshot,
        },
        { headers }
      );
    }

    if (action === 'review' || action === 'review_lab') {
      if (!promptText) {
        return NextResponse.json(
          { error: 'Please paste your lab notes or write-up for review.' },
          { status: 400, headers }
        );
      }

      const systemInstruction = `You are a high-standards Computer Science & Systems Engineering mentor reviewing a learner's lab write-up or project reflection.
Provide structured feedback:
1. Highlight 2 concrete strengths in their technical clarity, reproducibility, or scope hygiene.
2. Give 2 actionable improvements to elevate it to production/collegiate engineering quality.
3. Verify ethical/sandbox scope safety rules are respected.`;

      const userPrompt = `Lab write-up for ${stageTitle}:\n\n${promptText}`;

      if (ai) {
        try {
          const response = await withTimeout(
            ai.models.generateContent({
              model: GEMINI_TEXT_MODEL,
              contents: userPrompt,
              config: { systemInstruction },
            })
          );
          if (response.text?.trim()) {
            return NextResponse.json({ result: response.text.trim(), source: 'gemini', quota: quotaSnapshot }, { headers });
          }
        } catch (err) {
          console.warn('Gemini lab review fallback:', err instanceof Error ? err.message : err);
        }
      }

      if (!preferOffline) {
        const customReply = await generateCustomLlmCompletion({ systemInstruction, prompt: userPrompt });
        if (customReply) {
          return NextResponse.json({ result: customReply, source: 'custom-llm', quota: quotaSnapshot }, { headers });
        }
      }

      return NextResponse.json(
        {
          result: buildLocalLabReviewResponse(stageTitle, promptText),
          source: 'local',
          quota: quotaSnapshot,
        },
        { headers }
      );
    }

    if (action === 'study_plan' || action === 'plan') {
      const completedTopicsCount =
        typeof body.completedTopicsCount === 'number' && Number.isFinite(body.completedTopicsCount)
          ? Math.max(0, Math.floor(body.completedTopicsCount))
          : 0;
      const dailyGoalMinutes =
        typeof body.dailyGoalMinutes === 'number' && Number.isFinite(body.dailyGoalMinutes)
          ? Math.max(15, Math.min(240, Math.floor(body.dailyGoalMinutes)))
          : 45;

      const planPrompt = `Create a concrete ${dailyGoalMinutes}-minute daily study plan for ${stageTitle} (${completedTopicsCount} topics already completed)${
        promptText ? ` focusing on: "${promptText}"` : ''
      }. Break it cleanly into: Intuition, Hands-On Sandbox Proof, Exit Gate Verification, and Done Criteria.`;

      if (ai) {
        try {
          const response = await withTimeout(
            ai.models.generateContent({
              model: GEMINI_TEXT_MODEL,
              contents: planPrompt,
            })
          );
          if (response.text?.trim()) {
            return NextResponse.json({ result: response.text.trim(), source: 'gemini', quota: quotaSnapshot }, { headers });
          }
        } catch (err) {
          console.warn('Gemini study plan fallback:', err instanceof Error ? err.message : err);
        }
      }

      if (!preferOffline) {
        const customReply = await generateCustomLlmCompletion({
          systemInstruction: 'You are a structured Computer Science curriculum coach.',
          prompt: planPrompt,
        });
        if (customReply) {
          return NextResponse.json({ result: customReply, source: 'custom-llm', quota: quotaSnapshot }, { headers });
        }
      }

      return NextResponse.json(
        {
          result: buildLocalStudyPlanResponse(stageId, completedTopicsCount, dailyGoalMinutes),
          source: 'local',
          quota: quotaSnapshot,
        },
        { headers }
      );
    }

    return NextResponse.json({ error: `Unsupported tutor action: "${action}"` }, { status: 400, headers });
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers });
    }
    console.error('AI Tutor API Error:', error);
    return NextResponse.json(
      { error: 'Unable to process tutor request right now. Please try again.' },
      { status: 500, headers }
    );
  }
}
