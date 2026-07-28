export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string }>
}) {
  const { locale = 'pure' } = await searchParams

  // Nothing is destructured out of either result, so both resolve to
  // `ExportUsage::Evaluation`. The pattern import resolves to two targets of differing purity.
  /* eslint-disable no-empty-pattern */
  const {} = await import('../simple')
  const {} = await import(`../locales/${locale}`)
  /* eslint-enable no-empty-pattern */

  return <p>hello world</p>
}
