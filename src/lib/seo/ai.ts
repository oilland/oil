// ─────────────────────────────────────────────────────────────────────────────
//  AI client — OpenAI-compatible chat/completions endpoint.
//  Works with: Liara AI, AvalAI, OpenAI, OpenRouter, … (any /v1 compatible).
//  When no API key is configured, callers fall back to smart templates.
// ─────────────────────────────────────────────────────────────────────────────
import { getSettings } from '../settings';

export interface AiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export async function getAiConfig(): Promise<AiConfig> {
  const s = await getSettings();
  return {
    baseUrl: String(s.aiBaseUrl || process.env.AI_BASE_URL || '').trim().replace(/\/+$/, ''),
    apiKey: String(s.aiApiKey || process.env.AI_API_KEY || '').trim(),
    model: String(s.aiModel || process.env.AI_MODEL || 'openai/gpt-4o-mini').trim()
  };
}

export async function aiAvailable(): Promise<boolean> {
  const cfg = await getAiConfig();
  return Boolean(cfg.baseUrl && cfg.apiKey);
}

/** Single chat call. Returns null on any failure (caller falls back to template). */
export async function aiChat(system: string, user: string, maxTokens = 2000): Promise<string | null> {
  const cfg = await getAiConfig();
  if (!cfg.baseUrl || !cfg.apiKey) return null;
  try {
    const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`
      },
      body: JSON.stringify({
        model: cfg.model,
        max_tokens: maxTokens,
        temperature: 0.7,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ]
      }),
      signal: AbortSignal.timeout(90_000)
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

/** Extract a JSON object from an AI answer (tolerates ```json fences). */
export function parseAiJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}
