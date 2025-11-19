function getCsrfTokenFromCookie(): string {
  if (typeof document === 'undefined') return ''
  const cookie = document.cookie.split('; ').find((row) => row.startsWith('XSRF-TOKEN='))
  if (!cookie) return ''
  return decodeURIComponent(cookie.split('=')[1] || '')
}

export interface JsonFetchOptions extends Omit<RequestInit, 'body'> {
  payload?: unknown
  parseResponse?: boolean
  includeCsrf?: boolean
}

export async function jsonFetch<T = unknown>(
  input: RequestInfo | URL,
  { payload, parseResponse = true, includeCsrf = true, headers, ...init }: JsonFetchOptions = {}
): Promise<T | void> {
  const finalHeaders = new Headers(headers)

  finalHeaders.set('Accept', 'application/json')

  const requestInit: RequestInit = {
    ...init,
    headers: finalHeaders,
  }

  if (payload !== undefined) {
    finalHeaders.set('Content-Type', 'application/json')
    requestInit.body = JSON.stringify(payload)
  }

  if (includeCsrf) {
    finalHeaders.set('X-XSRF-TOKEN', getCsrfTokenFromCookie())
  }

  if (!requestInit.credentials) {
    requestInit.credentials = 'include'
  }

  const response = await fetch(input, requestInit)

  let data: any = null

  if (parseResponse) {
    data = await response.json().catch(() => null)
  }

  if (!response.ok) {
    throw new Error(data?.message || 'Erreur inconnue')
  }

  return parseResponse ? (data as T) : undefined
}

export { getCsrfTokenFromCookie as getCsrfToken }
