import Link from 'next/link'
import { OnboardingForm } from './onboarding-form'

export const metadata = {
  title: 'Buat Tenant · SSN Pekerja',
  description: 'Buat tenant baru untuk tim Anda.',
}

export const dynamic = 'force-dynamic'

// Auth is enforced by middleware.ts (path.startsWith('/onboarding')).
export default function OnboardingPage() {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-xl flex-col px-6 py-12">
        <header className="space-y-2">
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            ← Kembali ke dashboard
          </Link>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Buat tenant baru
          </h1>
          <p className="text-muted-foreground text-sm">
            Beri nama untuk tim atau organisasi Anda. Anda akan menjadi pemilik
            (OWNER) dan dapat mengundang anggota lain.
          </p>
        </header>

        <div className="bg-card border-border mt-8 rounded-2xl border p-6 sm:p-8">
          <OnboardingForm />
        </div>

        <p className="text-muted-foreground mt-6 text-center text-xs">
          Dengan membuat tenant, Anda menyetujui Syarat &amp; Ketentuan dan
          Kebijakan Privasi SSN.
        </p>
      </div>
    </div>
  )
}
