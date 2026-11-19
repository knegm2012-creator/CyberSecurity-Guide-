'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Sparkles, Send, CheckCircle2, RefreshCw, Trophy, Globe, ExternalLink } from 'lucide-react';
import { SoapBubbleButton } from '@/components/soap-bubble';
import { STAGES_DATA } from '@/lib/curriculum-data';
import { LiquidGlassOrb, type LiquidGlassOrbState } from '@/components/liquid-glass-orb';

import {
  DEFAULT_MENTOR_DAILY_LIMIT,
  type MentorQuotaSnapshot,
  type MentorSavedRequestEntry,
} from '@/lib/mentor-quota';

interface AiMentorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  completedTopicsCount?: number;
  dailyGoalMinutes?: number;
  activeStageId?: string;
  quotaSnapshot?: MentorQuotaSnapshot | null;
  requestedDailyLimit?: number;
  onQuotaUpdated?: (snapshot: MentorQuotaSnapshot) => void;
  onSaveRequest?: (entry: Omit<MentorSavedRequestEntry, 'id' | 'createdAt'>) => void;
  onOpenSettings?: () => void;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface GroundedCitation {
  title: string;
  uri: string;
}

interface MentorRuntimeInfo {
  provider: 'gemini' | 'custom-llm' | 'offline';
  model: string;
}

type MentorMode = 'eli9' | 'search' | 'quiz' | 'debug' | 'review' | 'study_plan';

function resolveInitialMode(prompt?: string): MentorMode {
  if (!prompt) return 'eli9';
  const lower = prompt.toLowerCase();
  if (lower.includes('quiz')) return 'quiz';
  if (lower.includes('study plan') || lower.includes('daily plan')) return 'study_plan';
  if (lower.includes('review')) return 'review';
  if (lower.includes('search') || lower.includes('rfc') || lower.includes('latest')) return 'search';
  if (lower.includes('debug') || lower.includes('error')) return 'debug';
  return 'eli9';
}

function AiMentorContent({
  onClose,
  initialPrompt,
  completedTopicsCount = 0,
  dailyGoalMinutes = 45,
  activeStageId = 'stage-0',
  quotaSnapshot,
  requestedDailyLimit = DEFAULT_MENTOR_DAILY_LIMIT,
  onQuotaUpdated,
  onSaveRequest,
  onOpenSettings,
}: {
  onClose: () => void;
  initialPrompt?: string;
  completedTopicsCount?: number;
  dailyGoalMinutes?: number;
  activeStageId?: string;
  quotaSnapshot?: MentorQuotaSnapshot | null;
  requestedDailyLimit?: number;
  onQuotaUpdated?: (snapshot: MentorQuotaSnapshot) => void;
  onSaveRequest?: (entry: Omit<MentorSavedRequestEntry, 'id' | 'createdAt'>) => void;
  onOpenSettings?: () => void;
}) {
  const [activeMode, setActiveMode] = useState<MentorMode>(() =>
    resolveInitialMode(initialPrompt)
  );
  const [promptText, setPromptText] = useState(initialPrompt || '');
  const [codeOrError, setCodeOrError] = useState('');
  const [selectedStageId, setSelectedStageId] = useState(activeStageId || 'stage-0');
  const [planMinutes, setPlanMinutes] = useState(dailyGoalMinutes);
  const [preferOffline, setPreferOffline] = useState(false);
  const [runtimeInfo, setRuntimeInfo] = useState<MentorRuntimeInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [responseResult, setResponseResult] = useState<string | null>(null);
  const [responseSources, setResponseSources] = useState<GroundedCitation[]>([]);
  const [responseOrigin, setResponseOrigin] = useState<string | null>(null);

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const speakingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechStartedAtRef = useRef<number>(0);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/health')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled && json?.capabilities?.aiMentor?.provider) {
          setRuntimeInfo({
            provider: json.capabilities.aiMentor.provider,
            model: json.capabilities.aiMentor.model || 'offline',
          });
        }
      })
      .catch(() => {
        // Ignore silent status probe error
      });
    return () => {
      cancelled = true;
      if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
    };
  }, []);

  const currentStage = STAGES_DATA.find((s) => s.id === selectedStageId) || STAGES_DATA[0];

  const orbState: LiquidGlassOrbState = loading
    ? activeMode === 'eli9' || activeMode === 'search'
      ? 'searching'
      : 'thinking'
    : hasError
    ? 'error'
    : isSpeaking
    ? 'speaking'
    : isListening
    ? 'listening'
    : 'idle';

  const getAudioLevel = useCallback(() => {
    if (!isSpeaking && !isListening) return 0.55;
    const t = (performance.now() - speechStartedAtRef.current) / 1000;
    const syllable =
      0.42 +
      0.32 * Math.abs(Math.sin(t * 7.4)) +
      0.22 * Math.max(0, Math.sin(t * 3.1 + 1.1));
    return Math.min(1, Math.max(0.12, syllable));
  }, [isSpeaking, isListening]);

  const handleAskMentor = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptText && activeMode !== 'quiz' && activeMode !== 'study_plan') return;

    if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
    setIsSpeaking(false);
    setHasError(false);
    setLoading(true);
    setResponseResult(null);
    setResponseSources([]);
    setResponseOrigin(null);

    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: activeMode,
          stageId: currentStage.id,
          stageTitle: `Stage ${currentStage.number}: ${currentStage.title}`,
          promptText: promptText || currentStage.title,
          codeOrError,
          completedTopicsCount,
          dailyGoalMinutes: planMinutes,
          requestedDailyLimit,
          preferOffline,
        }),
      });

      const data = await res.json();
      if (data?.quota && onQuotaUpdated) {
        onQuotaUpdated(data.quota as MentorQuotaSnapshot);
      }

      if (!res.ok || data.error) {
        setHasError(true);
        setResponseResult(`Error: ${data.error || `Request failed (${res.status})`}`);
      } else if (activeMode === 'quiz') {
        const quizList: QuizQuestion[] = data.quiz || [];
        setQuizQuestions(quizList);
        setUserAnswers({});
        setQuizSubmitted(false);
        if (onSaveRequest && quizList.length > 0) {
          onSaveRequest({
            mode: 'quiz',
            stageId: currentStage.id,
            prompt: promptText || `Stage ${currentStage.number} 5-Question Quiz`,
            response: quizList.map((q, i) => `Q${i + 1}: ${q.question}`).join('\n'),
            source: typeof data.source === 'string' ? data.source : 'verified-bank',
          });
        }
        speechStartedAtRef.current = performance.now();
        setIsSpeaking(true);
        speakingTimerRef.current = setTimeout(() => setIsSpeaking(false), 3200);
      } else {
        const resultText = typeof data.result === 'string' ? data.result : '';
        const cleanSources = Array.isArray(data.sources) ? data.sources : [];
        const originSource = typeof data.source === 'string' ? data.source : 'local';
        setResponseResult(resultText);
        setResponseSources(cleanSources);
        setResponseOrigin(originSource);
        if (onSaveRequest && resultText) {
          onSaveRequest({
            mode: activeMode,
            stageId: currentStage.id,
            prompt: promptText || `${activeMode} (${currentStage.title})`,
            response: resultText,
            source: originSource,
            sources: cleanSources,
          });
        }
        speechStartedAtRef.current = performance.now();
        setIsSpeaking(true);
        speakingTimerRef.current = setTimeout(() => setIsSpeaking(false), 4500);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Server request failed';
      setHasError(true);
      setResponseResult(`Communication error: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    quizQuestions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctIndex) correct++;
    });
    return {
      correct,
      total: quizQuestions.length,
      pct: quizQuestions.length > 0 ? Math.round((correct / quizQuestions.length) * 100) : 0,
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 dark:bg-[#03050b]/88 backdrop-blur-sm">
      <div className="w-full max-w-xl h-full border-l border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#060a14]/98 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-white/[0.08] bg-slate-50/90 dark:bg-[#040710]/65 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-sky-600 dark:text-cyan-400" />
            <div>
              <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">AI Study Mentor</h3>
              <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                {preferOffline
                  ? 'Mode: Local Offline Engine'
                  : runtimeInfo?.provider === 'gemini'
                  ? `Server BYOK: Gemini (${runtimeInfo.model})`
                  : runtimeInfo?.provider === 'custom-llm'
                  ? `Server BYOK: ${runtimeInfo.model}`
                  : 'Local Synthesis & Offline Quiz Bank'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {quotaSnapshot && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="px-2 py-1 rounded-lg border border-sky-500/30 bg-sky-500/10 text-[10px] font-mono text-sky-800 dark:text-cyan-200 hover:border-sky-400 cursor-pointer tabular-nums"
                title="Daily mentor quota remaining — click to configure limit in Settings"
              >
                {quotaSnapshot.remainingToday}/{quotaSnapshot.dailyLimit} left
              </button>
            )}
            <button
              type="button"
              onClick={() => setPreferOffline((prev) => !prev)}
              className={`px-2 py-1 rounded-lg border text-[10px] font-mono transition-colors cursor-pointer whitespace-nowrap ${
                preferOffline
                  ? 'border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-200'
                  : 'border-slate-300 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
              }`}
              title="Switch between configured server AI endpoint (.env.local) and built-in offline engine"
            >
              {preferOffline ? 'Offline Only' : 'Auto Proxy'}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              aria-label="Close AI Study Mentor"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Agentic Liquid Glass Orb Presence */}
        <div className="border-b border-slate-200 dark:border-white/[0.08] bg-black py-4 flex items-center justify-center shrink-0">
          <LiquidGlassOrb
            baseColor="#ffffff"
            colorA="#000000"
            colorB="#4d4d4d"
            colorC="#a9a9a9"
            seed={145}
            startTime={18}
            speed={1.5}
            distortion={0.8}
            clusterCount={7.2}
            clusterIntensity={3}
            clusterSize={22.5}
            scale={0.23}
            spotSize={1.15}
            rotation={0}
            softness={0.31}
            relief={2.94}
            refraction={0.65}
            roughness={0}
            reflection={1.3}
            caustics={0}
            dispersion={1}
            colorDistribution={0}
            grain={0.3}
            grainSize={1}
            paused={false}
            animateDistortion={true}
            grainMode="fine"
            flowType="drift"
            state={orbState}
            thinkingAnimation="ripples"
            searchingAnimation="lens"
            preserveWhites={true}
            animateEntrance={true}
            size={250}
            audioLevel={0.55}
            getAudioLevel={getAudioLevel}
          />
        </div>

        {/* Mode Tabs */}
        <div className="border-b border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#040710]/70 px-3 py-2">
          <div className="optical-subnav flex gap-1 p-1 rounded-xl text-[11px] font-medium overflow-x-auto no-scrollbar">
            {[
              { id: 'eli9', label: 'Concept Guide' },
              { id: 'search', label: 'Web Search' },
              { id: 'quiz', label: 'Quiz' },
              { id: 'debug', label: 'Error Doctor' },
              { id: 'review', label: 'Lab Review' },
              { id: 'study_plan', label: 'Study Plan' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveMode(tab.id as MentorMode);
                  setResponseResult(null);
                  setResponseSources([]);
                  setResponseOrigin(null);
                  setHasError(false);
                }}
                className={`flex-1 py-1.5 px-2 rounded-lg whitespace-nowrap transition-colors cursor-pointer border ${
                  activeMode === tab.id
                    ? 'bg-sky-500/15 text-sky-800 dark:text-cyan-200 border-sky-500/35 font-semibold'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stage Selector */}
        <div className="border-b border-slate-200 dark:border-white/[0.08] bg-slate-50/40 dark:bg-[#040710]/50 px-4 py-2.5 flex items-center gap-3 text-xs">
          <span className="text-slate-600 dark:text-slate-500 font-mono">Context:</span>
          <select
            value={selectedStageId}
            onChange={(e) => setSelectedStageId(e.target.value)}
            className="flex-1 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#040710]/90 px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 dark:focus:border-cyan-400/50 font-mono text-[11px]"
          >
            {STAGES_DATA.map((s) => (
              <option key={s.id} value={s.id}>
                Stage {s.number}: {s.title}
              </option>
            ))}
          </select>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeMode === 'quiz' && (
            <div className="space-y-4">
              {quizQuestions.length === 0 ? (
                <div className="optical-card rounded-2xl p-6 text-center space-y-3">
                  <Trophy className="h-7 w-7 text-amber-600 dark:text-amber-400 mx-auto" />
                  <h4 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                    Stage {currentStage.number} Check
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                    Generate 5 multiple-choice questions on {currentStage.title}.
                  </p>
                  <SoapBubbleButton
                    disabled={loading}
                    onClick={() => handleAskMentor()}
                    tint="rgb(56 189 248)"
                    opacity={0.92}
                    style={{ fontSize: 12 }}
                    className="!min-h-[36px] !px-5 font-semibold text-white"
                  >
                    <span className="inline-flex items-center gap-2">
                      {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      <span>{loading ? 'Generating...' : 'Generate 5 Questions'}</span>
                    </span>
                  </SoapBubbleButton>
                </div>
              ) : (
                <div className="space-y-4">
                  {quizQuestions.map((q, qIdx) => (
                    <div key={qIdx} className="optical-card rounded-2xl p-4 space-y-3">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">
                        <span className="text-sky-700 dark:text-cyan-400 font-mono mr-1.5 tabular-nums">Q{qIdx + 1}.</span>
                        {q.question}
                      </div>

                      <div className="space-y-1.5">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = userAnswers[qIdx] === optIdx;
                          const isCorrect = q.correctIndex === optIdx;

                          let optionStyle =
                            'border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#040710]/80 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-white/[0.18]';
                          if (quizSubmitted) {
                            if (isCorrect)
                              optionStyle =
                                'border-emerald-500/50 bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 font-semibold';
                            else if (isSelected && !isCorrect)
                              optionStyle =
                                'border-rose-500/50 bg-rose-500/15 text-rose-800 dark:text-rose-200 line-through';
                          } else if (isSelected) {
                            optionStyle =
                              'border-sky-500/60 bg-sky-500/15 text-sky-900 dark:text-cyan-100 font-semibold';
                          }

                          return (
                            <button
                              key={optIdx}
                              disabled={quizSubmitted}
                              onClick={() => setUserAnswers((prev) => ({ ...prev, [qIdx]: optIdx }))}
                              className={`w-full text-left p-2.5 rounded-xl border text-xs transition-colors flex items-center justify-between cursor-pointer ${optionStyle}`}
                            >
                              <span>{opt}</span>
                              {quizSubmitted && isCorrect && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {quizSubmitted && (
                        <div className="optical-inset rounded-xl p-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          <span className="font-mono text-sky-700 dark:text-cyan-400 font-semibold">Explanation: </span>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}

                  {!quizSubmitted ? (
                    <SoapBubbleButton
                      onClick={() => setQuizSubmitted(true)}
                      tint="rgb(56 189 248)"
                      opacity={0.92}
                      style={{ fontSize: 12 }}
                      className="w-full !min-h-[38px] font-semibold text-white"
                    >
                      Submit Answers
                    </SoapBubbleButton>
                  ) : (
                    <div className="optical-inset rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">Score</div>
                        <div className="text-lg font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                          {calculateScore().correct} / {calculateScore().total} ({calculateScore().pct}%)
                        </div>
                      </div>
                      <button
                        onClick={() => handleAskMentor()}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.08] cursor-pointer"
                      >
                        New Set
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeMode !== 'quiz' && responseResult && (
            <div className="optical-card rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08] pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-sky-700 dark:text-cyan-400 font-semibold uppercase tracking-wider">
                    Mentor Response
                  </span>
                  {responseOrigin && (
                    <span className="rounded border border-slate-200 dark:border-white/[0.1] bg-slate-100 dark:bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-mono text-slate-700 dark:text-slate-300">
                      {responseOrigin === 'gemini-search'
                        ? 'Google Search Grounded'
                        : responseOrigin === 'custom-llm'
                        ? 'Custom BYOK Endpoint'
                        : responseOrigin === 'local-catalog'
                        ? 'Curated CS Index'
                        : responseOrigin === 'gemini'
                        ? 'Gemini Live'
                        : 'Offline Engine'}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setResponseResult(null);
                    setResponseSources([]);
                    setResponseOrigin(null);
                    setHasError(false);
                  }}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer"
                >
                  Clear
                </button>
              </div>
              <div className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {responseResult}
              </div>

              {responseSources.length > 0 && (
                <div className="border-t border-slate-200 dark:border-white/[0.08] pt-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-sky-700 dark:text-sky-400 uppercase tracking-wider">
                    <Globe className="h-3 w-3" />
                    <span>Grounded References</span>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {responseSources.map((src) => (
                      <a
                        key={src.uri}
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="optical-inset rounded-lg px-3 py-2 flex items-center justify-between gap-2 text-[11px] text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:border-sky-500/40 transition-colors"
                      >
                        <span className="truncate font-medium">{src.title}</span>
                        <ExternalLink className="h-3 w-3 text-sky-600 dark:text-sky-400 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeMode === 'study_plan' && !responseResult && (
            <div className="optical-card rounded-2xl p-5 space-y-4">
              <div className="space-y-1">
                <h4 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                  Daily Session Plan · Stage {currentStage.number}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Synthesize a structured Intuition -&gt; Sandbox Proof -&gt; Exit Gate session block tailored to your daily time budget.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                <span className="text-slate-600 dark:text-slate-400 mr-1">Session budget:</span>
                {[30, 45, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setPlanMinutes(mins)}
                    className={`px-2.5 py-1 rounded-lg border cursor-pointer tabular-nums ${
                      planMinutes === mins
                        ? 'border-sky-500/50 bg-sky-500/15 text-sky-800 dark:text-cyan-200 font-semibold'
                        : 'border-slate-300 dark:border-white/[0.1] bg-slate-50 dark:bg-[#040710]/80 text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>

              <SoapBubbleButton
                disabled={loading}
                onClick={() => handleAskMentor()}
                tint="rgb(56 189 248)"
                opacity={0.92}
                style={{ fontSize: 12 }}
                className="w-full !min-h-[36px] font-semibold text-white"
              >
                <span className="inline-flex items-center gap-2">
                  {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  <span>{loading ? 'Synthesizing Plan...' : `Build ${planMinutes}m Stage ${currentStage.number} Study Plan`}</span>
                </span>
              </SoapBubbleButton>
            </div>
          )}

          {(activeMode === 'eli9' || activeMode === 'search') && !responseResult && (
            <div className="space-y-2.5">
              <span className="text-[11px] text-slate-600 dark:text-slate-500 font-mono uppercase tracking-wider">
                {activeMode === 'search' ? 'Live Spec & Engineering Search Prompts' : 'Suggested Prompts'}
              </span>
              <div className="flex flex-col gap-1.5">
                {(activeMode === 'search'
                  ? [
                      'RFC 9110 HTTP/1.1 & HTTP/2 semantics summary',
                      'Latest GCC C23 compiler standard features and security flags',
                      'How TLS 1.3 reduces handshake round trips vs TLS 1.2',
                      'Raft consensus leader election and split-vote safety guarantees',
                    ]
                  : [
                      'What is a pointer in C and how does dereferencing work?',
                      'How does subnetting work in IPv4?',
                      'Explain the TCP 3-way handshake with a concrete analogy',
                      'What is the difference between cryptographic hashing and encryption?',
                      'Why do systems languages use stack vs heap allocation?',
                    ]
                ).map((q) => (
                  <button
                    key={q}
                    onClick={() => setPromptText(q)}
                    className="optical-card text-left text-xs rounded-xl px-3.5 py-2.5 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        {activeMode !== 'quiz' && (
          <form onSubmit={handleAskMentor} className="border-t border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#040710]/70 p-4 space-y-2.5">
            {activeMode === 'debug' && (
              <textarea
                rows={2}
                value={codeOrError}
                onChange={(e) => setCodeOrError(e.target.value)}
                placeholder="Paste the failing command, compiler warning, or code..."
                className="w-full rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#040710]/90 p-2.5 text-xs text-slate-900 dark:text-slate-200 font-mono focus:border-sky-500 dark:focus:border-cyan-400/50 focus:outline-none"
              />
            )}

            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={promptText}
                onFocus={() => setIsListening(true)}
                onBlur={() => setIsListening(false)}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder={
                  activeMode === 'search'
                    ? 'Search live docs, RFC specs, CS standards...'
                    : activeMode === 'study_plan'
                    ? 'Optional topic focus for your daily study plan...'
                    : activeMode === 'eli9'
                    ? 'Ask about any concept or command...'
                    : activeMode === 'debug'
                    ? 'Describe what you expected vs what happened...'
                    : 'Paste your lab write-up or notes for feedback...'
                }
                className="flex-1 rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#040710]/90 px-3.5 py-2 text-xs text-slate-900 dark:text-slate-200 focus:border-sky-500 dark:focus:border-cyan-400/50 focus:outline-none"
              />

              <SoapBubbleButton
                type="submit"
                disabled={loading || (!promptText && activeMode !== 'study_plan')}
                tint="rgb(56 189 248)"
                opacity={0.92}
                style={{ fontSize: 12 }}
                className="!min-h-[34px] !px-4 font-semibold text-white shrink-0"
              >
                <span className="inline-flex items-center gap-1.5">
                  {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  <span>{activeMode === 'study_plan' ? 'Plan' : 'Ask'}</span>
                </span>
              </SoapBubbleButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function AiMentorPanel({
  isOpen,
  onClose,
  initialPrompt,
  completedTopicsCount,
  dailyGoalMinutes,
  activeStageId,
  quotaSnapshot,
  requestedDailyLimit,
  onQuotaUpdated,
  onSaveRequest,
  onOpenSettings,
}: AiMentorPanelProps) {
  if (!isOpen) return null;
  return (
    <AiMentorContent
      key={initialPrompt || 'default'}
      onClose={onClose}
      initialPrompt={initialPrompt}
      completedTopicsCount={completedTopicsCount}
      dailyGoalMinutes={dailyGoalMinutes}
      activeStageId={activeStageId}
      quotaSnapshot={quotaSnapshot}
      requestedDailyLimit={requestedDailyLimit}
      onQuotaUpdated={onQuotaUpdated}
      onSaveRequest={onSaveRequest}
      onOpenSettings={onOpenSettings}
    />
  );
}
