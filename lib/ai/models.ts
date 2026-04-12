/**
 * Centralized Claude model identifiers.
 *
 * All `anthropic.messages.create({ model, ... })` call sites MUST import
 * from this file instead of hard-coding a model ID string. When a new
 * model family ships (or an old one is deprecated), bump the value here
 * once and every route picks it up.
 *
 * Why semantic aliases instead of raw ID constants:
 *   - Call sites read as intent ("reasoning" / "fast") not version bookkeeping
 *   - Bumping models becomes a one-line diff here, not a 15-file sweep
 *   - We've already been burned once this session by a stale model ID
 *     (`claude-sonnet-4-5-20250514`) lingering in ai-generate/route.ts
 *     and 404-ing on production
 */

export const AI_MODELS = {
  /**
   * Primary model for strategic reasoning, long-form generation, and
   * structured JSON output. Use for coaching, synthesis, TOWS strategy
   * generation, context cards, X-Ray scoring, pain mapper, vision
   * drafting, conflict check, suggest-more, and the Hoshin Explorer
   * admin tool.
   */
  reasoning: 'claude-sonnet-4-6',

  /**
   * Fast, cheap model for short classification / extraction tasks where
   * deep reasoning is overkill. Currently used only by the SWOT factor
   * quality-check endpoint.
   */
  fast: 'claude-haiku-4-5-20251001',
} as const

export type AiModelId = (typeof AI_MODELS)[keyof typeof AI_MODELS]
