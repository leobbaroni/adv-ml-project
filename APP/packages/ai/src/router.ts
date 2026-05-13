// Provider-agnostic OpenAI-compatible client.
// Lazy-initialized so packages that import @app/ai don't crash without env vars.

import OpenAI from 'openai';

let client: OpenAI | null = null;

export function getAiClient(): OpenAI {
  if (client) return client;
  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL ?? 'https://opencode.ai/zen/v1';
  if (!apiKey) {
    throw new Error('[ai] OPENAI_API_KEY is not set');
  }
  client = new OpenAI({ apiKey, baseURL });
  return client;
}

export function getAiModel(): string {
  return process.env.AI_MODEL ?? 'big-pickle';
}

/**
 * Call the AI with JSON-mode preference, falling back to plain text if the
 * provider doesn't support `response_format`. Some OpenAI-compatible endpoints
 * (e.g. OpenCode Zen) reject unknown parameters. This helper retries without
 * them so the app never hard-crashes on provider quirks.
 */
export async function callAiJson(
  messages: Array<{ role: 'system' | 'user'; content: string }>,
  options?: { temperature?: number },
): Promise<{ raw: string; usedJsonMode: boolean }> {
  const client = getAiClient();
  const model = getAiModel();

  // 1. Try with JSON mode
  try {
    const completion = await client.chat.completions.create({
      model,
      messages,
      response_format: { type: 'json_object' },
      ...options,
    });
    const raw = completion.choices[0]?.message?.content ?? '';
    console.log('[callAiJson] JSON mode succeeded', { model, rawLength: raw.length });
    return { raw, usedJsonMode: true };
  } catch (jsonErr) {
    const errMsg = jsonErr instanceof Error ? jsonErr.message : String(jsonErr);
    console.warn('[callAiJson] JSON mode failed, retrying plain text:', errMsg);
  }

  // 2. Fallback: plain text
  const completion = await client.chat.completions.create({
    model,
    messages,
    ...options,
  });
  const raw = completion.choices[0]?.message?.content ?? '';
  console.log('[callAiJson] Plain text succeeded', { model, rawLength: raw.length });
  return { raw, usedJsonMode: false };
}

/**
 * Strip markdown code fences and trim whitespace.
 */
export function cleanJson(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}
