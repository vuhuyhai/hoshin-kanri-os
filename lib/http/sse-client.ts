/**
 * Client-side consumer for SSE responses emitted by streamClaudeJson.
 *
 * The server sends events in this shape:
 *   data: {"type":"progress","chars":120}\n\n
 *   data: {"type":"done","data":{...}}\n\n
 *   data: {"type":"error","error":"..."}\n\n
 *
 * Usage:
 *   const result = await postSse<{ candidates: Candidate[] }>(
 *     '/api/discovery/pain-mapper',
 *     { painPoints, orgContext },
 *     (e) => { if (e.type === 'progress') setChars(e.chars as number) },
 *   )
 *
 * Resolves with the payload from the terminal 'done' event, or rejects
 * if the server sends 'error', the HTTP response isn't OK, or the stream
 * ends without a 'done' event.
 */
export interface SseEvent {
  type: string
  [key: string]: unknown
}

/**
 * Thrown by postSse on any failure. Mirrors the shape of FetchJsonError
 * so call sites can use `err.body` to read server-side detail fields
 * (e.g. a `missing` object that drives a specific UI branch).
 *
 * - HTTP error (pre-stream 4xx/5xx JSON body): status = response.status, body = parsed JSON
 * - Server-emitted 'error' event mid-stream: status = 0, body = event payload
 * - Stream ended without 'done': status = 0, body = null
 */
export class SseError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.name = 'SseError'
    this.status = status
    this.body = body
  }
}

export async function postSse<TDone>(
  url: string,
  body: unknown,
  onEvent?: (event: SseEvent) => void,
  init?: Omit<RequestInit, 'method' | 'body' | 'headers'>,
): Promise<TDone> {
  const response = await fetch(url, {
    ...init,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  // Auth/validation failures surface as regular JSON 4xx responses,
  // not streams — handle them the same way postJson would.
  if (!response.ok || !response.body) {
    let message = `HTTP ${response.status} ${response.statusText}`
    let body: unknown = null
    try {
      body = await response.json()
      if (body && typeof body === 'object' && 'error' in body) {
        message = String((body as { error: unknown }).error)
      }
    } catch {
      /* non-JSON body, keep HTTP message */
    }
    throw new SseError(message, response.status, body)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let done: TDone | null = null
  let finished = false

  while (!finished) {
    const { done: readerDone, value } = await reader.read()
    if (readerDone) break

    buffer += decoder.decode(value, { stream: true })

    // SSE messages are separated by blank lines. Split on \n\n and keep
    // the trailing partial (if any) in the buffer for the next chunk.
    const messages = buffer.split('\n\n')
    buffer = messages.pop() ?? ''

    for (const msg of messages) {
      const dataLine = msg.split('\n').find((l) => l.startsWith('data: '))
      if (!dataLine) continue

      let event: SseEvent
      try {
        event = JSON.parse(dataLine.slice(6)) as SseEvent
      } catch {
        continue
      }

      onEvent?.(event)

      if (event.type === 'done') {
        done = event.data as TDone
        finished = true
      } else if (event.type === 'error') {
        throw new SseError(
          String(event.error ?? 'Lỗi không xác định từ server'),
          0,
          event,
        )
      }
    }
  }

  if (done === null) {
    throw new SseError('Stream kết thúc mà không có kết quả', 0, null)
  }
  return done
}
