import { nextTestSetup } from 'e2e-utils'

describe('browserOnly imported by an RSC', () => {
  const { next, isNextDev, skipped } = nextTestSetup({
    files: __dirname,
    skipStart: true,
    skipDeployment: true,
  })

  if (skipped) {
    return
  }

  if (isNextDev) {
    it.skip('requires a production build', () => {})
    return
  }

  it('does not expose browserOnly', async () => {
    const result = await next.build()

    expect(result.exitCode).toBe(1)
    expect(result.cliOutput).toContain('browserOnly) is not a function')
    expect(result.cliOutput).toContain('prerendering page "/"')
  })
})
