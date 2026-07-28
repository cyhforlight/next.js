import { nextTestSetup } from 'e2e-utils'
import { retry, waitFor } from 'next-test-utils'
import type * as Playwright from 'playwright'
import { createRouterAct } from 'router-act'

const HANGING_PROMISE_MESSAGE =
  'During prerendering, `connection()` rejects when the prerender is complete'

describe('module-level caches keyed on the headers object', () => {
  const { next, isNextDev } = nextTestSetup({
    files: __dirname,
  })

  if (isNextDev) {
    // Runtime prefetching only happens in production builds.
    it('is skipped in dev', () => {})
    return
  }

  it('renders dynamic content on navigation even when the spawned runtime prerender populated the cache first', async () => {
    const cliOutputStart = next.cliOutput.length

    let page: Playwright.Page
    const browser = await next.browser('/', {
      beforePageLoad(p: Playwright.Page) {
        page = p
      },
    })
    const act = createRouterAct(page)

    // Reveal the link, triggering the runtime prefetch.
    await act(
      async () => {
        const linkToggle = await browser.elementByCss(
          'input[data-link-accordion="/dynamic"]'
        )
        await linkToggle.click()
      },
      { includes: 'Header:' }
    )

    // Navigate. The navigation request also spawns a runtime prerender to
    // refresh the client's prefetch cache, which reaches the module-level
    // cache before the stage-gated dynamic render of the navigation does.
    // Because each render pass resolves `headers()` to a distinct object, the
    // hanging connection() promise it memoizes is keyed to the prerender pass
    // only: the navigation's dynamic render misses the cache, creates its own
    // promise, and connection() resolves, so the dynamic content renders.
    await browser.elementByCss('a[href="/dynamic"]').click()

    await retry(async () => {
      expect(await browser.elementById('dynamic-content').text()).toBe(
        'Dynamic content: request data'
      )
    })
    expect(await browser.hasElementByCssSelector('#dynamic-error')).toBe(false)

    // The rejection of the prerender pass's hanging promise stays within the
    // pass that created it, so nothing is reported to onRequestError either.
    const cliOutput = next.cliOutput.slice(cliOutputStart)
    expect(cliOutput).not.toContain('[instrumentation] onRequestError:')
  })

  it('does not report errors when an aborted runtime prefetch rejects the cached promise', async () => {
    const cliOutputStart = next.cliOutput.length

    let page: Playwright.Page
    const browser = await next.browser('/', {
      beforePageLoad(p: Playwright.Page) {
        page = p
      },
    })
    const act = createRouterAct(page)

    // Reveal the link to trigger a runtime prefetch of /dynamic. The prefetch
    // includes the static parts of the page but must omit the dynamic content
    // gated on connection().
    await act(async () => {
      const linkToggle = await browser.elementByCss(
        'input[data-link-accordion="/dynamic"]'
      )
      await linkToggle.click()
    }, [
      { includes: 'Header:' },
      { includes: 'Dynamic content', block: 'reject' },
    ])

    // The runtime prefetch consists of a prospective prerender (to fill
    // caches) and a final prerender. Both passes resolve `headers()` to a
    // distinct object, so the module-level cache keyed on the headers object
    // is scoped to a single render pass: the hanging connection() promise
    // memoized by the aborted prospective prerender is never observed by the
    // final prerender. Its rejection stays within the pass that created it,
    // where React handles it as the expected abort signal, so nothing is
    // reported to instrumentation onRequestError or logged to the server
    // console. Allow any (incorrect) reports to flush before asserting their
    // absence.
    await waitFor(2000)
    const cliOutput = next.cliOutput.slice(cliOutputStart)
    expect(cliOutput).not.toContain('[instrumentation] onRequestError:')
    expect(cliOutput).not.toContain(`⨯ Error: ${HANGING_PROMISE_MESSAGE}`)
  })
})
