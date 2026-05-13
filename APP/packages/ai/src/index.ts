// Single AI router. OpenAI-compatible. Swap providers via env vars only.
//
//   OPENAI_API_KEY      — credential
//   OPENAI_BASE_URL     — provider base (defaults to OpenCode Zen)
//   AI_MODEL            — model id (default: big-pickle)
//
// All public functions validate their output with zod and fall back to
// rule-based stubs on failure. The app must never hard-crash on AI errors.

export { extractCheckInData } from './tasks/extract-checkin.js';
export { resolveOverlap } from './tasks/resolve-overlap.js';
export { parseShoppingMessage } from './tasks/parse-shopping.js';
export { parsePdfRequest } from './tasks/parse-pdf-request.js';
export { getAiClient, getAiModel, callAiJson, cleanJson } from './router.js';
export { ikeaCatalog, getIkeaSearchUrl, findIkeaProductByName } from './ikea-catalog.js';
