import { browserOnly } from 'next/navigation'

export default function Page() {
  browserOnly()
  return <p>RSC import should fail</p>
}
