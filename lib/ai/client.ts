import Anthropic from '@anthropic-ai/sdk'

/**
 * Centralized Anthropic client factory.
 *
 * All `new Anthropic()` call sites MUST import this instead of
 * instantiating the SDK directly. Reasons:
 *
 * 1. Retries — SDK default is 2. We bump to 3 so transient 429s, 5xx,
 *    and connection drops recover without surfacing a toast to the user.
 *    The SDK handles exponential backoff + respects Retry-After headers.
 *
 * 2. Timeout — SDK default is 10 minutes, way too long. Our longest
 *    Claude call (discovery synthesis, 4000 tokens) takes ~30-60s on a
 *    good day. We cap at 3 minutes so a stuck connection fails the
 *    user-visible request in reasonable time instead of spinning forever.
 *
 * 3. Single import — so the next global change (e.g. adding a custom
 *    fetch wrapper, or switching to the Bedrock/Vertex adapters) is a
 *    one-line diff here instead of 13 files.
 */

const DEFAULT_MAX_RETRIES = 3
const DEFAULT_TIMEOUT_MS = 180_000 // 3 minutes

export function createAnthropicClient(
  overrides?: ConstructorParameters<typeof Anthropic>[0],
): Anthropic {
  return new Anthropic({
    maxRetries: DEFAULT_MAX_RETRIES,
    timeout: DEFAULT_TIMEOUT_MS,
    ...overrides,
  })
}
