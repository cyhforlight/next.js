// eslint-disable-next-line import/no-extraneous-dependencies
import 'client-only'

import { BailoutToCSRError } from '../../shared/lib/lazy-dynamic/bailout-to-csr'

type FulfilledBrowserOnlyPromise = Promise<void> & {
  status?: 'fulfilled'
  value?: undefined
}

type RejectedBrowserOnlyPromise = Promise<void> & {
  status?: 'rejected'
  reason?: BailoutToCSRError
}

const fulfilledPromise: FulfilledBrowserOnlyPromise = Promise.resolve()
fulfilledPromise.status = 'fulfilled'
fulfilledPromise.value = undefined

/**
 * Returns a promise that suspends server rendering and resolves immediately in
 * the browser.
 *
 * This is intended to be passed to React's `use()` inside a Suspense boundary.
 */
export function browserOnly(): Promise<void> {
  if (typeof window !== 'undefined') {
    return fulfilledPromise
  }

  const error = new BailoutToCSRError('browserOnly()')
  const rejectedPromise: RejectedBrowserOnlyPromise = Promise.reject(error)

  // React reads the instrumented status synchronously. Attach a handler as well
  // so the native rejected promise is never reported as unhandled.
  rejectedPromise.catch(() => {})
  rejectedPromise.status = 'rejected'
  rejectedPromise.reason = error

  return rejectedPromise
}
