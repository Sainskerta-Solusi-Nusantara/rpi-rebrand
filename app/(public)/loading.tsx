import { getServerT } from '@/lib/i18n/server-dictionary'

export default async function PublicLoading() {
  const t = await getServerT()
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="bg-background flex min-h-screen w-full flex-col"
    >
      <div className="mx-auto w-full max-w-7xl px-6 py-12 space-y-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="bg-muted h-10 w-3/4 animate-pulse rounded-md" />
            <div className="bg-muted h-5 w-full animate-pulse rounded-md" />
            <div className="bg-muted h-5 w-11/12 animate-pulse rounded-md" />
            <div className="bg-muted h-12 w-40 animate-pulse rounded-md" />
          </div>
          <div className="bg-muted h-72 animate-pulse rounded-2xl" />
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="bg-muted h-24 animate-pulse rounded-xl" />
          <div className="bg-muted h-24 animate-pulse rounded-xl" />
          <div className="bg-muted h-24 animate-pulse rounded-xl" />
          <div className="bg-muted h-24 animate-pulse rounded-xl" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="bg-muted h-48 animate-pulse rounded-xl" />
          <div className="bg-muted h-48 animate-pulse rounded-xl" />
          <div className="bg-muted h-48 animate-pulse rounded-xl" />
        </div>
        <span className="sr-only">{t.pagesPublicMisc.loading.srOnly}</span>
      </div>
    </div>
  )
}
