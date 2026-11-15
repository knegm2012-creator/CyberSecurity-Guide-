import { GoogleGenAI } from '@google/genai';
import { isForbiddenIp } from './security';

export const DEFAULT_GEMINI_MODEL = 'gemini-4-hydrogen';
export const GEMINI_TEXT_MODEL = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;

const PLACEHOLDER_KEYS = new Set([
  '',
  'MY_GEMINI_API_KEY',
  'YOUR_GEMINI_API_KEY',
  'your_gemini_api_key',
  'sk-your-key-here',
  'changeme',
]);

export function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY?.trim() || '';
  return key.length > 10 && !PLACEHOLDER_KEYS.has(key);
}

/**
 * Validates server-side BYOK OpenAI-compatible/Ollama LLM endpoints against SSRF.
 * - Allows local Ollama/LM Studio loopback ONLY on `http://localhost`, `http://127.0.0.1`, or `http://[::1]`.
 * - Requires `https://` for any non-loopback endpoint and blocks RFC-1918, loopback, link-local,
 *   and cloud metadata hosts (e.g. 169.254.169.254, metadata.google.internal).
 */
export function validateSafeLlmBaseUrl(rawUrl: string | undefined): string | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim().replace(/\/+$/, '');
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  const hostname = parsed.hostname.toLowerCase();
  const isLoopbackHost =
    hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1';

  if (parsed.protocol === 'http:') {
    if (!isLoopbackHost) {
      return null;
    }
    return parsed.origin + parsed.pathname.replace(/\/+$/, '');
  }

  if (parsed.protocol !== 'https:') {
    return null;
  }

  if (
    isLoopbackHost ||
    hostname === 'metadata.google.internal' ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.local') ||
    isForbiddenIp(hostname)
  ) {
    return null;
  }

  return parsed.origin + parsed.pathname.replace(/\/+$/, '');
}

export function getCustomLlmConfig(): {
  baseUrl: string;
  apiKey: string;
  model: string;
} | null {
  const safeBaseUrl = validateSafeLlmBaseUrl(process.env.LLM_BASE_URL);
  if (!safeBaseUrl) {
    return null;
  }

  const rawKey = process.env.LLM_API_KEY?.trim() || '';
  const apiKey = PLACEHOLDER_KEYS.has(rawKey) ? '' : rawKey;
  const model = process.env.LLM_MODEL?.trim() || 'llama3.2';

  return {
    baseUrl: safeBaseUrl,
    apiKey,
    model,
  };
}

export function isCustomLlmConfigured(): boolean {
  return getCustomLlmConfig() !== null;
}

export interface MentorRuntimeStatus {
  provider: 'gemini' | 'custom-llm' | 'offline';
  model: string;
  geminiConfigured: boolean;
  customLlmConfigured: boolean;
  offlineReady: boolean;
}

export function getMentorRuntimeStatus(): MentorRuntimeStatus {
  const geminiConfigured = isGeminiConfigured();
  const custom = getCustomLlmConfig();

  if (geminiConfigured) {
    return {
      provider: 'gemini',
      model: process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL,
      geminiConfigured: true,
      customLlmConfigured: custom !== null,
      offlineReady: true,
    };
  }

  if (custom) {
    return {
      provider: 'custom-llm',
      model: custom.model,
      geminiConfigured: false,
      customLlmConfigured: true,
      offlineReady: true,
    };
  }

  return {
    provider: 'offline',
    model: 'cs-odyssey-local-synthesis',
    geminiConfigured: false,
    customLlmConfigured: false,
    offlineReady: true,
  };
}

let cachedClient: GoogleGenAI | null = null;
let cachedKeyUsed: string | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  if (!isGeminiConfigured()) {
    return null;
  }
  const apiKey = process.env.GEMINI_API_KEY!.trim();
  if (!cachedClient || cachedKeyUsed !== apiKey) {
    cachedClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    cachedKeyUsed = apiKey;
  }
  return cachedClient;
}

export async function generateCustomLlmCompletion(options: {
  systemInstruction: string;
  prompt: string;
  timeoutMs?: number;
}): Promise<string | null> {
  const cfg = getCustomLlmConfig();
  if (!cfg) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 9000);

  try {
    const endpoint = cfg.baseUrl.endsWith('/chat/completions')
      ? cfg.baseUrl
      : `${cfg.baseUrl}/chat/completions`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (cfg.apiKey) {
      headers['Authorization'] = `Bearer ${cfg.apiKey}`;
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: cfg.model,
        temperature: 0.3,
        messages: [
          { role: 'system', content: options.systemInstruction },
          { role: 'user', content: options.prompt },
        ],
      }),
    });

    if (!res.ok) {
      return null;
    }

    const payload = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = payload?.choices?.[0]?.message?.content;
    return typeof text === 'string' && text.trim().length > 0 ? text.trim() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
