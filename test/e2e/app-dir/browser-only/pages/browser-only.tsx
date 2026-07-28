import { Suspense, use, type ReactNode } from 'react'
import { browserOnly } from 'next/navigation'

function BrowserContent({ children, id }: { children: ReactNode; id: string }) {
  use(browserOnly())
  return <p id={id}>{children}</p>
}

export default function Page() {
  return (
    <main>
      <p id="pages-server-sibling">pages server sibling</p>
      <Suspense fallback={<p id="pages-fallback">pages fallback</p>}>
        <BrowserContent id="pages-browser-content">
          pages browser content
        </BrowserContent>
      </Suspense>
      <Suspense
        fallback={<p id="pages-second-fallback">pages second fallback</p>}
      >
        <BrowserContent id="pages-second-browser-content">
          pages second browser content
        </BrowserContent>
      </Suspense>
    </main>
  )
}
