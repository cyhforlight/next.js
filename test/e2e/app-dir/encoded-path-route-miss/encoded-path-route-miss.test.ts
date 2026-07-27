import { nextTestSetup } from 'e2e-utils'

describe('encoded-path-route-miss', () => {
  const { next } = nextTestSetup({
    files: __dirname,
  })

  it('returns 404 for an encoded alias of an API route', async () => {
    const canonicalResponse = await next.fetch('/api/health')
    expect(canonicalResponse.status).toBe(200)
    expect(await canonicalResponse.json()).toEqual({ ok: true })

    const encodedResponse = await next.fetch('/api/%68ealth', {
      method: 'POST',
    })
    expect(encodedResponse.status).toBe(404)
  })
})
