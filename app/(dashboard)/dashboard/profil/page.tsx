import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { AvatarUploader } from '@/components/organisms/avatar-uploader'

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
      },
    })
    .catch(() => null)

  if (!user) redirect('/login')

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
    </div>
  )
}
