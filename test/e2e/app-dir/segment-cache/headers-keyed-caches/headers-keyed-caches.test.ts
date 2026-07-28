import { nextTestSetup } from 'e2e-utils'
import { retry } from 'next-test-utils'
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

  it('breaks the dynamic content of a navigation when the spawned runtime prerender populated the cache first', async () => {
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

    // Navigate. connection() resolves during navigations, so the page should
    // render its dynamic content. But the navigation request also spawns a
    // runtime prerender to refresh the client's prefetch cache, which shares
    // the request's headers object and reaches the module-level cache before
    // the stage-gated dynamic render of the navigation does. The prerender
    // memoizes a hanging connection() promise, which rejects when the
    // prerender is aborted. The navigation's dynamic render awaits the same
    // promise and fails: the user gets the error boundary instead of the
    // dynamic content.
    await browser.elementByCss('a[href="/dynamic"]').click()

    await retry(async () => {
      expect(await browser.elementById('dynamic-error').text()).toBe(
        'Failed to render dynamic content'
      )
    })
    expect(await browser.hasElementByCssSelector('#dynamic-content')).toBe(
      false
    )

    // The navigation request reports the render error as well.
    await retry(async () => {
      const cliOutput = next.cliOutput.slice(cliOutputStart)
      expect(cliOutput).toContain(
        `[instrumentation] onRequestError:${HANGING_PROMISE_MESSAGE}`
      )
    }, 5000)
  })

  it('reports the render error when an aborted runtime prefetch rejects the cached promise', async () => {
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
    // caches) and a final prerender. Aborting the prospective prerender
    // rejects its hanging connection() promise. Because the page memoizes the
    // promise in a module-level cache keyed on the identity of the headers
    // object, which both prerenders share, the final prerender awaits the
    // same, now-rejected promise and genuinely fails to render the dynamic
    // subtree, so the error is reported to instrumentation onRequestError and
    // logged to the server console.
    await retry(async () => {
      const cliOutput = next.cliOutput.slice(cliOutputStart)
      expect(cliOutput).toContain(
        `[instrumentation] onRequestError:${HANGING_PROMISE_MESSAGE}`
      )
      expect(cliOutput).toContain(`⨯ Error: ${HANGING_PROMISE_MESSAGE}`)
    }, 5000)
  })
})
