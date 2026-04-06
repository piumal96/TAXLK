const BASE = 'https://openrouter.ai/api/v1';

// Free models tried in order — first available one wins
const FREE_MODELS = [
  'qwen/qwen3.6-plus:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'stepfun/step-3.5-flash:free',
  'arcee-ai/trinity-large-preview:free',
  'minimax/minimax-m2.5:free',
  'liquid/lfm-2.5-1.2b-instruct:free',
];

export const AI_MODEL = FREE_MODELS[0];

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenRouterConfig {
  apiKey: string;
  model?: string;
}

// ─── streaming with automatic model rotation on 429 ──────────────────────────

export async function* streamChatMessage(
  messages: ChatMessage[],
  config: OpenRouterConfig,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const apiKey = config.apiKey || import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('VITE_OPENROUTER_API_KEY not set in .env');

  const modelsToTry = config.model ? [config.model] : FREE_MODELS;

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    const res = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'TaxLK AI Assistant',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 1024,
        temperature: 0.7,
        stream: true,
      }),
      signal,
    });

    // Rate-limited — silently try next model
    if (res.status === 429) {
      lastError = new Error('Rate limited');
      continue;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = (err as { error?: { message?: string } })?.error?.message;
      // Some errors (bad request, auth) are not retryable — throw immediately
      if (res.status === 401 || res.status === 403 || res.status === 400) {
        throw new Error(msg || `OpenRouter error ${res.status}`);
      }
      lastError = new Error(msg || `OpenRouter error ${res.status}`);
      continue;
    }

    // Success — stream the response
    const reader = res.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (!trimmed.startsWith('data: ')) continue;
        try {
          const json = JSON.parse(trimmed.slice(6)) as {
            choices?: { delta?: { content?: string } }[];
          };
          const token = json.choices?.[0]?.delta?.content;
          if (token) yield token;
        } catch {
          // malformed chunk — skip
        }
      }
    }

    return; // done — don't try remaining models
  }

  // All models exhausted
  throw lastError ?? new Error('No free models available. Please try again shortly.');
}

// ─── non-streaming fallback ───────────────────────────────────────────────────

export async function sendChatMessage(
  messages: ChatMessage[],
  config: OpenRouterConfig,
  signal?: AbortSignal,
): Promise<string> {
  let full = '';
  for await (const token of streamChatMessage(messages, config, signal)) {
    full += token;
  }
  return full;
}
