import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { AvatarUploader } from '@/components/organisms/avatar-uploader'
import { PersonalPrefsForm } from '@/components/organisms/personal-prefs-form'
import { ProfileVisibilityForm } from '@/components/organisms/profile-visibility-form'
import { LanguageSwitcherMount } from '@/components/organisms/language-switcher-mount'
import { getPersonalPrefs } from '@/lib/auth/personal-prefs'
import { getServerT } from '@/lib/i18n/server-dictionary'

function makeFallback(label: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function Fallback(_props: any) {
    return (
      <div
        role="status"
        aria-busy="true"
        className="bg-muted my-4 h-48 w-full animate-pulse rounded-xl"
        data-todo={`component:${label}`}
      />
    )
  }
}
function safeRequire<T = unknown>(path: string, exportName: string): T {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require(path)
    return (mod?.[exportName] ?? makeFallback(`${path}#${exportName}`)) as T
  } catch {
    return makeFallback(`${path}#${exportName}`) as unknown as T
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ProfileForm: any = safeRequire('@/components/organisms/profile-form', 'ProfileForm')

export const metadata = { title: 'Profil Saya' }

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login?callbackUrl=/profil')
  const userId = session.user.id

  const user = await prisma.user
    .findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        phone: true,
        bio: true,
        headline: true,
        location: true,
        globalRole: true,
        username: true,
        profilePublic: true,
      },
    })
    .catch(() => null)

  if (!user) redirect('/login')

  const prefs = await getPersonalPrefs(userId)
  const t = await getServerT()
  const langCopy = t.common.language as {
    sectionTitle?: string
    sectionDescription?: string
    label?: string
  }

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <header>
        <h1 className="font-heading text-2xl md:text-3xl">Profil Saya</h1>
        <p className="text-muted-foreground mt-1">
          Perbarui informasi profil agar lebih menarik bagi mitra perekrut.
        </p>
      </header>

      <section className="border-border bg-card rounded-2xl border p-6">
        <h2 className="font-heading mb-4 text-lg">Foto profil</h2>
        <AvatarUploader
          initialUrl={user.image}
          label={user.name ?? user.email}
        />
      </section>

      <ProfileForm initial={user} />

      <section className="border-border bg-card rounded-2xl border p-6">
        <h2 className="font-heading mb-1 text-lg">
          {langCopy.sectionTitle ?? 'Bahasa'}
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          {langCopy.sectionDescription ??
            'Pilih bahasa antarmuka. Pengaturan ini juga memengaruhi format tanggal dan angka.'}
        </p>
        <LanguageSwitcherMount variant="inline" />
      </section>

      <section className="border-border bg-card rounded-2xl border p-6">
        <h2 className="font-heading mb-1 text-lg">Bahasa & zona waktu</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          Mempengaruhi format tanggal/waktu yang ditampilkan di seluruh
          aplikasi.
        </p>
        <PersonalPrefsForm initial={prefs} />
      </section>

      <section className="border-border bg-card rounded-2xl border p-6">
        <h2 className="font-heading mb-1 text-lg">Profil publik</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          Pilih username dan atur agar profil dapat dilihat publik di{' '}
          <code className="bg-muted rounded px-1 py-0.5 text-xs">/profil</code>.
          Email dan nomor telepon tidak pernah ditampilkan di halaman publik.
        </p>
        <ProfileVisibilityForm
          initial={{
            userId: user.id,
            username: user.username,
            profilePublic: user.profilePublic,
          }}
        />
      </section>
    </div>
  )
}
