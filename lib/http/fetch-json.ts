/**
 * Typed fetch + JSON helper used for all client→API calls.
 *
 * Problems this replaces:
 *   1. Bare `fetch(url).then(r => r.json())` skips the `r.ok` check,
 *      so a 500 error body like `{ error: '...' }` silently lands in
 *      state — see the SwotFactorInput / TowsCanvas crash we hit on
 *      production where `factors[q].filter(...)` blew up on undefined.
 *   2. Every call site re-implemented the same try/catch dance:
 *      read JSON, check `res.ok`, pull `body.error`, throw Error.
 *      Rolling it into one helper keeps error semantics consistent.
 *
 * Usage:
 *   const list = await fetchJson<Item[]>('/api/items')
 *   const created = await postJson<Item>('/api/items', { name })
 *   await fetchJson(`/api/items/${id}`, { method: 'DELETE' })
 *
 * Error handling: throws `FetchJsonError` on network failure OR on
 * non-2xx responses. `err.message` prefers the server's `error` field
 * if present, otherwise falls back to `HTTP {status} {statusText}`.
 * Call sites that use `err instanceof Error ? err.message : '...'` in
 * a catch block get the server's message for free.
 */

export class FetchJsonError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.name = 'FetchJsonError'
    this.status = status
    this.body = body
  }
}

export async function fetchJson<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  let response: Response
  try {
    response = await fetch(input, init)
  } catch (err) {
    // Network error, CORS rejection, AbortController, etc.
    const message = err instanceof Error ? err.message : 'Lỗi kết nối mạng'
    throw new FetchJsonError(message, 0, null)
  }

  // Parse body best-effort. A 204 or a non-JSON error page will leave
  // body = null, which is fine — we only use it for the error message.
  let body: unknown = null
  try {
    const text = await response.text()
    if (text.length > 0) body = JSON.parse(text)
  } catch {
    /* response wasn't JSON */
  }

  if (!response.ok) {
    const serverMessage =
      body && typeof body === 'object' && 'error' in body
        ? String((body as { error: unknown }).error)
        : null
    throw new FetchJsonError(
      serverMessage ?? `HTTP ${response.status} ${response.statusText}`,
      response.status,
      body,
    )
  }

  return body as T
}

/**
 * Convenience for `POST` with a JSON body. Equivalent to calling
 * `fetchJson(input, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })`.
 */
export function postJson<T = unknown>(
  input: RequestInfo | URL,
  body: unknown,
  init?: Omit<RequestInit, 'method' | 'body'>,
): Promise<T> {
  return fetchJson<T>(input, {
    ...init,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    body: JSON.stringify(body),
  })
}
