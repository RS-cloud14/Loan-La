import { GoogleGenAI } from '@google/genai';

// Retrieve all unique configured API keys from the environment
function getApiKeyPool(): string[] {
  const rawKeys: string[] = [];

  // 1. Primary key first
  if (process.env.GEMINI_API_KEY) {
    const single = process.env.GEMINI_API_KEY.trim();
    if (single) rawKeys.push(single);
  }

  // 2. Check for comma-separated list
  if (process.env.GEMINI_API_KEYS) {
    const list = process.env.GEMINI_API_KEYS.split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);
    rawKeys.push(...list);
  }

  // 3. Fallback support for numbering: GEMINI_API_KEY_1, GEMINI_API_KEY_2...
  for (let i = 1; i <= 10; i++) {
    const numberedKey = process.env[`GEMINI_API_KEY_${i}`];
    if (numberedKey) {
      const trimmed = numberedKey.trim();
      if (trimmed) rawKeys.push(trimmed);
    }
  }

  // Filter out duplicates, placeholders, and GCP project identifiers like gen-lang-client-...
  const validKeys: string[] = [];
  for (const k of rawKeys) {
    if (
      !validKeys.includes(k) &&
      !k.includes('Placeholder') &&
      !k.startsWith('gen-lang-client-') &&
      k.length >= 10
    ) {
      validKeys.push(k);
    }
  }

  return validKeys;
}

// Track the current key index to avoid hammering the same exhausted key in consecutive requests
let currentKeyIndex = 0;

export const DEFAULT_GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-flash-latest'
];

/**
 * Executes a Gemini API operation with key rotation AND model cascade.
 * If a model fails with Rate Limit / Quota (HTTP 429 / RESOURCE_EXHAUSTED),
 * it seamlessly cascades to the next candidate model (e.g. gemini-2.5-flash-lite).
 */
export async function callGeminiWithModelRotation<T>(
  operation: (ai: GoogleGenAI, model: string) => Promise<T>,
  models: string[] = DEFAULT_GEMINI_MODELS
): Promise<T> {
  const pool = getApiKeyPool();

  if (pool.length === 0) {
    throw new Error("No Gemini API keys are configured in the environment. Set GEMINI_API_KEYS or GEMINI_API_KEY.");
  }

  let lastError: any = null;
  const maxKeyAttempts = Math.max(pool.length * 2, 4);

  for (let keyAttempt = 0; keyAttempt < maxKeyAttempts; keyAttempt++) {
    const activeKeyIndex = (currentKeyIndex + keyAttempt) % pool.length;
    const activeKey = pool[activeKeyIndex];
    const ai = new GoogleGenAI({ apiKey: activeKey });

    for (const model of models) {
      try {
        console.log(`[ROTATOR] Running model "${model}" with key index ${activeKeyIndex} (...${activeKey.slice(-5)})`);
        const result = await operation(ai, model);
        currentKeyIndex = activeKeyIndex;
        return result;
      } catch (error: any) {
        lastError = error;
        const errorMsg = error?.message || "";
        const statusCode = error?.status || error?.statusCode;

        const isQuotaOrRateLimit = 
          statusCode === 429 || 
          errorMsg.includes('429') || 
          errorMsg.toLowerCase().includes('quota') || 
          errorMsg.toLowerCase().includes('resource_exhausted') || 
          errorMsg.toLowerCase().includes('resource exhausted') ||
          errorMsg.toLowerCase().includes('rate limit');

        if (isQuotaOrRateLimit) {
          console.warn(`[ROTATOR] Model "${model}" hit quota/rate-limit. Cascading to next model in pool...`);
          // Try next model with the same key
          continue;
        }

        const isKeyError = 
          statusCode === 400 || 
          errorMsg.toLowerCase().includes('api_key_invalid') || 
          errorMsg.toLowerCase().includes('invalid api key');

        if (isKeyError) {
          console.warn(`[ROTATOR] Key index ${activeKeyIndex} invalid/rejected. Moving to next key...`);
          // Break to next key
          break;
        }

        // For other recoverable errors (e.g. 503, 500, network), try next model or next key
        console.warn(`[ROTATOR] Error on model "${model}" (${errorMsg.slice(0, 70)}...). Trying next candidate...`);
      }
    }
  }

  throw new Error(`[ROTATOR] All configured Gemini models and API keys exhausted: ${lastError?.message || lastError}`);
}

/**
 * Executes a Gemini API operation using keys from the pool.
 * If a key fails with a Rate Limit or Quota error (HTTP 429 / Resource Exhausted),
 * or an invalid key (HTTP 400), it rotates to the next available key and retries the operation.
 */
export async function callGeminiWithRotation<T>(
  operation: (ai: GoogleGenAI) => Promise<T>
): Promise<T> {
  const pool = getApiKeyPool();

  if (pool.length === 0) {
    throw new Error("No Gemini API keys are configured in the environment. Set GEMINI_API_KEYS or GEMINI_API_KEY.");
  }

  let attempts = 0;
  // Allow at least 4 attempts across the pool (or 2x pool length)
  const maxAttempts = Math.max(pool.length * 2, 4);
  let lastError: any = null;

  while (attempts < maxAttempts) {
    const activeKeyIndex = (currentKeyIndex + attempts) % pool.length;
    const activeKey = pool[activeKeyIndex];

    try {
      console.log(`[ROTATOR] Attempt ${attempts + 1}/${maxAttempts} with API Key index ${activeKeyIndex} (ending in ...${activeKey.slice(-5)})`);
      const ai = new GoogleGenAI({ apiKey: activeKey });
      const result = await operation(ai);
      
      // Update the global key index to the succeeding one
      currentKeyIndex = activeKeyIndex;
      return result;

    } catch (error: any) {
      lastError = error;
      const errorMsg = error?.message || "";
      const statusCode = error?.status || error?.statusCode;

      // Check if it is a recoverable issue: rate limit (429), bad/expired key (400), server overloaded (503/500), timeout, or network glitch
      const isRecoverable = 
        statusCode === 429 || 
        statusCode === 400 ||
        statusCode === 503 ||
        statusCode === 500 ||
        statusCode === 504 ||
        errorMsg.includes('429') ||
        errorMsg.includes('400') ||
        errorMsg.includes('503') ||
        errorMsg.includes('500') ||
        errorMsg.toLowerCase().includes('api_key_invalid') ||
        errorMsg.toLowerCase().includes('api key not valid') ||
        errorMsg.toLowerCase().includes('invalid api key') ||
        errorMsg.toLowerCase().includes('quota') || 
        errorMsg.toLowerCase().includes('rate limit') || 
        errorMsg.toLowerCase().includes('resource_exhausted') ||
        errorMsg.toLowerCase().includes('resource exhausted') ||
        errorMsg.toLowerCase().includes('overloaded') ||
        errorMsg.toLowerCase().includes('unavailable') ||
        errorMsg.toLowerCase().includes('timeout') ||
        errorMsg.toLowerCase().includes('fetch failed') ||
        errorMsg.toLowerCase().includes('econnreset');

      if (isRecoverable && pool.length > 1) {
        attempts++;
        const backoffDelay = Math.min(500 * Math.pow(1.5, attempts), 2000);
        console.warn(`[ROTATOR] Recoverable error encountered (${errorMsg.slice(0, 80)}...). Rotating to next key in pool (attempt ${attempts}/${maxAttempts})...`);
        await new Promise(res => setTimeout(res, backoffDelay));
      } else if (isRecoverable) {
        // Only 1 key in pool, wait slightly and retry
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise(res => setTimeout(res, 1000));
        }
      } else {
        // Unrecoverable programming or syntax error
        throw error;
      }
    }
  }

  throw new Error(`[ROTATOR] All configured Gemini API keys exhausted after ${attempts} attempts: ${lastError?.message || lastError}`);
}
