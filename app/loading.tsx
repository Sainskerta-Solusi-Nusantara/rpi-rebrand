import { getServerT } from '@/lib/i18n/server-dictionary'

export default async function Loading() {
  const t = await getServerT()

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="bg-background flex min-h-screen w-full items-center justify-center px-6 py-24"
    >
      <div className="w-full max-w-2xl space-y-6">
        <div className="bg-muted h-8 w-1/3 animate-pulse rounded-md" />
        <div className="space-y-3">
          <div className="bg-muted h-4 w-full animate-pulse rounded-md" />
          <div className="bg-muted h-4 w-11/12 animate-pulse rounded-md" />
          <div className="bg-muted h-4 w-9/12 animate-pulse rounded-md" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="bg-muted h-24 animate-pulse rounded-lg" />
          <div className="bg-muted h-24 animate-pulse rounded-lg" />
          <div className="bg-muted h-24 animate-pulse rounded-lg" />
        </div>
        <span className="sr-only">{t.pagesRoot.loading.srOnly}</span>
      </div>
    </div>
  )
}
