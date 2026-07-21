export const dynamic = 'force-dynamic'

async function throwError() {
  throw new Error('test unhandled rejection')
}

export default function Page() {
  void throwError()

  return <p>hello world</p>
}
