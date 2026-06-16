import { nextTestSetup } from 'e2e-utils'

describe('app-dir - postponed state size too low for prerendered shell', () => {
  const { isNextDeploy, isNextDev, next } = nextTestSetup({
    files: __dirname,
  })

  it('surfaces a digest-tagged parse failure on resume', async () => {
    const { browser, response } = await next.browserWithResponse('/')

    // The static prelude was already a 200; we can't change that now.
    expect({ status: response.status() }).toEqual({ status: 200 })

    // The static parts of the prelude are still in the DOM.
    expect(await browser.elementByCss('[data-testid="name"]').text()).toBe(
      'Product'
    )

    const errorMessage =
      'Failed to parse postponed state Error: Decompressed resume data cache exceeded 250 byte limit'
    if (isNextDev) {
      // We don't transport the postponed state in dev, so the failure path
      // doesn't trigger and the dynamic part renders normally.
      expect(await browser.elementByCss('[data-testid="dynamic"]').text()).toBe(
        'dynamic part rendered at request time'
      )
      expect(next.cliOutput).not.toContain(errorMessage)
    } else {
      // Can't resume into the suspended React tree, so we should be showing the fallback.
      expect(
        await browser.elementByCss('[data-testid="fallback"]').text()
      ).toBe('loading…')
      if (!isNextDeploy) {
        // We don't have access to Vercel runtime logs.
        expect(next.cliOutput).toContain(errorMessage)
        expect(next.cliOutput).toContain(
          'Decompressed resume data cache exceeded 250 byte limit'
        )
        expect(next.cliOutput).toContain(
          "digest: 'NEXT_POSTPONED_STATE_PARSE_FAILED'"
        )
      }
      const logs = await browser.log()
      expect(logs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            source: 'log',
            // An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details. A digest property is included on this error instance which may provide additional details about the nature of the error.
            message:
              'report rejection, digest: NEXT_POSTPONED_STATE_PARSE_FAILED, message: "Minified React error #441; visit https://react.dev/errors/441 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."',
          }),
        ])
      )
    }
  })
})
