import { createAnthropicClient } from './client'

/**
 * Server-side helper: streams a Claude call as Server-Sent Events so
 * the client gets TTFB in ~200ms instead of waiting 2-5s for the full
 * response. Claude outputs structured JSON, so we can't render partial
 * tokens usefully — instead we emit `progress` heartbeats (char count)
 * while streaming and the final parsed payload in a `done` event.
 *
 * Event shapes sent to the client:
 *   { type: 'progress', chars: number }   // periodic heartbeat
 *   { type: 'done', data: TFinal }         // terminal success
 *   { type: 'error', error: string }       // terminal failure
 *
 * Use `postSse` from lib/http/sse-client to consume these events.
 */
export interface StreamJsonOptions<TParsed, TFinal> {
  model: string
  maxTokens: number
  prompt: string
  /** Parse the accumulated Claude text into the structured payload. */
  parse: (text: string) => TParsed
  /**
   * Optional post-parse step — save to DB, shape the final response, etc.
   * Runs AFTER parse succeeds, BEFORE the 'done' event is sent. If it
   * throws, the client receives an 'error' event.
   */
  finalize?: (parsed: TParsed) => Promise<TFinal> | TFinal
  /** Label used in server-side error logs. */
  tag?: string
}

const SSE_HEADERS: HeadersInit = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  // Disable buffering on Vercel/Nginx so events flush immediately.
  'X-Accel-Buffering': 'no',
}

export function streamClaudeJson<TParsed, TFinal = TParsed>(
  opts: StreamJsonOptions<TParsed, TFinal>,
): Response {
  const encoder = new TextEncoder()
  const tag = opts.tag ?? 'streamClaudeJson'

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        )
      }

      try {
        const client = createAnthropicClient()
        const claudeStream = client.messages.stream({
          model: opts.model,
          max_tokens: opts.maxTokens,
          messages: [{ role: 'user', content: opts.prompt }],
        })

        let accumulated = ''
        let lastHeartbeat = 0

        for await (const event of claudeStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            accumulated += event.delta.text
            // Throttle heartbeats: send every ~50 chars instead of per-token
            // to avoid flooding the client while still feeling live.
            if (accumulated.length - lastHeartbeat >= 50) {
              lastHeartbeat = accumulated.length
              send({ type: 'progress', chars: accumulated.length })
            }
          }
        }

        const cleaned = accumulated.replace(/```json|```/g, '').trim()
        let parsed: TParsed
        try {
          parsed = opts.parse(cleaned)
        } catch (err) {
          console.error(`[${tag}] parse error:`, err)
          console.error(`[${tag}] raw text (first 500):`, cleaned.slice(0, 500))
          send({ type: 'error', error: 'Không parse được kết quả từ AI' })
          controller.close()
          return
        }

        let final: TFinal
        try {
          final = opts.finalize
            ? await opts.finalize(parsed)
            : (parsed as unknown as TFinal)
        } catch (err) {
          console.error(`[${tag}] finalize error:`, err)
          send({
            type: 'error',
            error: 'Lỗi khi lưu kết quả. Vui lòng thử lại.',
          })
          controller.close()
          return
        }

        send({ type: 'done', data: final })
        controller.close()
      } catch (err) {
        console.error(`[${tag}] stream error:`, err)
        send({ type: 'error', error: 'Lỗi khi gọi AI. Vui lòng thử lại.' })
        controller.close()
      }
    },
  })

  return new Response(stream, { headers: SSE_HEADERS })
}
