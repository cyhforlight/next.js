import { isNextDev, nextTestSetup } from 'e2e-utils'
import { retry } from 'next-test-utils'

// An input that mirrors its value into the URL on every keystroke
// (`router.push('?q='+value)`) should stay focused so the user can keep typing.
// On a dynamic page, focus is lost after the first character; a static page is
// unaffected.
describe('app-new-scroll-handler-focus', () => {
  const { next } = nextTestSetup({
    files: __dirname,
    // run-jest.sh defaults this off; enable the feature under test.
    env: { __NEXT_EXPERIMENTAL_APP_NEW_SCROLL_HANDLER: 'true' },
  })

  // Type via the page keyboard, not element.type() (which re-focuses each call
  // and would hide the bug). If focus is lost, the second key never reaches
  // onChange and the URL stays at `q=a`.
  async function typeTwoKeysBothMustLand(path: string, testId: string) {
    const browser = await next.browser(path)
    const activeTestId = () =>
      browser.eval(() => document.activeElement?.getAttribute('data-testid'))

    await retry(async () => {
      expect(await activeTestId()).toBe(testId)
    })

    await browser.keydown('a')
    await browser.keyup('a')
    await retry(async () => {
      expect(await browser.url()).toContain('q=a')
    })

    await browser.keydown('b')
    await browser.keyup('b')
    await retry(async () => {
      expect(await browser.url()).toContain('q=ab')
    })
    await retry(async () => {
      expect(await activeTestId()).toBe(testId)
    })
  }

  it('dynamic page: keeps focus across search-param keystrokes (all modes)', async () => {
    await typeTwoKeysBothMustLand('/', 'search-input')
  })

  // A static page keeps focus. In dev everything renders dynamically, so this
  // only holds in start/deploy.
  if (!isNextDev) {
    it('static page: unaffected by the new scroll handler (start/deploy only)', async () => {
      await typeTwoKeysBothMustLand('/static', 'static-search-input')
    })
  }

  // The navigation should still scroll to top while keeping focus.
  it('dynamic page: still scrolls to top on a search-param nav, focus preserved', async () => {
    const browser = await next.browser('/')

    await retry(async () => {
      expect(
        await browser.eval(() =>
          document.activeElement?.getAttribute('data-testid')
        )
      ).toBe('search-input')
    })
    await browser.eval(() => window.scrollTo(0, 800))
    await retry(async () => {
      expect(await browser.eval(() => window.scrollY)).toBeGreaterThan(400)
    })

    await browser.keydown('a')
    await browser.keyup('a')
    await retry(async () => {
      expect(await browser.url()).toContain('q=a')
    })

    await retry(async () => {
      expect(await browser.eval(() => window.scrollY)).toBe(0)
    })
    expect(
      await browser.eval(() =>
        document.activeElement?.getAttribute('data-testid')
      )
    ).toBe('search-input')
  })
})
