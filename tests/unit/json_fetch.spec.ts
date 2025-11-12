import { test } from '@japa/runner'
import { jsonFetch } from '../../inertia/services/http.js'

test.group('jsonFetch', (group) => {
  const originalFetch = globalThis.fetch

  group.each.teardown(() => {
    globalThis.fetch = originalFetch
    delete (globalThis as any).document
  })

  test('adds JSON headers, CSRF token and default credentials', async ({ assert }) => {
    let receivedInit: RequestInit | undefined

    ;(globalThis as any).document = { cookie: 'XSRF-TOKEN=test-token' }

    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      receivedInit = init
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }) as typeof fetch

    const result = await jsonFetch<{ success: boolean }>('/api/example', {
      payload: { foo: 'bar' },
    })

    assert.isTrue(result?.success)
    assert.equal(receivedInit?.credentials, 'include')

    const headers = new Headers(receivedInit?.headers)
    assert.equal(headers.get('Accept'), 'application/json')
    assert.equal(headers.get('Content-Type'), 'application/json')
    assert.equal(headers.get('X-XSRF-TOKEN'), 'test-token')
    assert.equal(receivedInit?.body, JSON.stringify({ foo: 'bar' }))
  })

  test('throws when the response is not ok', async ({ assert }) => {
    globalThis.fetch = (async () => {
      return new Response(JSON.stringify({ message: 'Not allowed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }) as typeof fetch

    try {
      await jsonFetch('/api/forbidden')
      assert.fail('jsonFetch should throw on non-ok responses')
    } catch (error) {
      assert.instanceOf(error, Error)
      assert.equal((error as Error).message, 'Not allowed')
    }
  })

  test('skips parsing when parseResponse is false', async ({ assert }) => {
    let parsed = false

    const fakeResponse = {
      ok: true,
      json: async () => {
        parsed = true
        return { skipped: true }
      },
    }

    globalThis.fetch = (async () => fakeResponse as Response) as typeof fetch

    const result = await jsonFetch('/api/example', { parseResponse: false })

    assert.isUndefined(result)
    assert.isFalse(parsed)
  })
})
