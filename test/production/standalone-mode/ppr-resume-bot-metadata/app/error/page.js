import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'

export async function generateMetadata() {
  await connection()

  return {
    title: 'error-metadata-title',
  }
}

export default async function Page() {
  // Suspend the prerender before triggering the not-found recovery. The
  // notFound call is reached only when the postponed route is resumed.
  await cookies()
  notFound()
}
