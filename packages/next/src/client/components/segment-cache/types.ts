/**
 * Shared types and constants for the Segment Cache.
 */

export const enum NavigationResultTag {
  MPA,
  Success,
  NoOp,
  Async,
}

/**
 * The priority of the prefetch task. Higher numbers are higher priority.
 */
export const enum PrefetchPriority {
  /**
   * Assigned to the most recently hovered/touched link. Special network
   * bandwidth is reserved for this task only. There's only ever one Intent-
   * priority task at a time; when a new Intent task is scheduled, the previous
   * one is bumped down to Default.
   */
  Intent = 2,
  /**
   * The default priority for prefetch tasks.
   */
  Default = 1,
  /**
   * Assigned to tasks when they spawn non-blocking background work, like
   * revalidating a partially cached entry to see if more data is available.
   */
  Background = 0,
}

export const enum FetchStrategy {
  // Deliberately ordered so we can easily compare two segments
  // and determine if one segment is "more specific" than another
  // (i.e. if it's likely that it contains more data)
  LoadingBoundary = 0,
  RuntimeShell = 1,
  PPR = 2,
  PPRRuntime = 3,
  // A navigation-depth runtime prefetch (<Link prefetch="navigation">). Same
  // request flow as PPRRuntime, but the server renders through
  // `unstable_navigation()` — content gated only on the navigation stage is
  // included in the response. Real dynamic APIs (`connection()`, etc.) still
  // hang, so the response may still be partial; only `Full` implies
  // completeness. Entries produced by a PPRRuntime request whose response
  // reports that nothing was deferred at the navigation gate are also
  // recorded at this level (see `getEffectiveRuntimePrefetchStrategy`).
  PPRNavigation = 4,
  Full = 5,
}

/**
 * A subset of fetch strategies used for prefetch tasks.
 * A prefetch task can't know if it should use `PPR` or `LoadingBoundary`
 * until we complete the initial tree prefetch request, so we use `PPR` to signal both cases
 * and adjust it based on the route when actually fetching.
 * */
export type PrefetchTaskFetchStrategy =
  | FetchStrategy.PPR
  | FetchStrategy.PPRRuntime
  | FetchStrategy.PPRNavigation
  | FetchStrategy.Full
