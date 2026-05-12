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
