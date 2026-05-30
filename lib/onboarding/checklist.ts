import { cache } from 'react'
import { prisma } from '@/lib/db'

export type ChecklistStep = {
  id:
    | 'verify-email'
    | 'set-password'
    | 'enable-2fa'
    | 'complete-profile'
    | 'upload-avatar'
    | 'create-tenant'
  label: string
  description: string
  done: boolean
  href: string
}

const FALLBACK_STEPS: ChecklistStep[] = [
  {
    id: 'verify-email',
    label: 'Verifikasi email',
    description: 'Konfirmasi alamat email Anda untuk mengamankan akun.',
    done: false,
    href: '/dashboard/keamanan',
  },
  {
    id: 'set-password',
    label: 'Atur password',
    description: 'Tetapkan password agar bisa masuk tanpa Google.',
    done: false,
    href: '/dashboard/keamanan/password',
  },
  {
    id: 'enable-2fa',
    label: 'Aktifkan 2FA',
    description: 'Tambahkan lapisan keamanan tambahan dengan otentikasi dua faktor.',
    done: false,
    href: '/dashboard/keamanan/2fa',
  },
  {
    id: 'complete-profile',
    label: 'Lengkapi profil',
    description: 'Tambahkan nama, headline, dan informasi singkat tentang Anda.',
    done: false,
    href: '/dashboard/profil',
  },
  {
    id: 'upload-avatar',
    label: 'Unggah foto profil',
    description: 'Tambahkan foto agar profil Anda lebih mudah dikenali.',
    done: false,
    href: '/dashboard/profil',
  },
  {
    id: 'create-tenant',
    label: 'Buat tenant',
    description: 'Bergabung atau buat tenant untuk mulai berkolaborasi.',
    done: false,
    href: '/onboarding',
  },
]

export const getOnboardingChecklist = cache(
  async (userId: string): Promise<ChecklistStep[]> => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          emailVerified: true,
          passwordHash: true,
          totpEnabledAt: true,
          name: true,
          headline: true,
          bio: true,
          location: true,
          image: true,
          tenants: { select: { id: true }, take: 1 },
        },
      })

      if (!user) return FALLBACK_STEPS

      const profileBasics = Boolean(user.name)
      const profileDetails = Boolean(user.headline || user.bio || user.location)

      return [
        {
          id: 'verify-email',
          label: 'Verifikasi email',
          description: 'Konfirmasi alamat email Anda untuk mengamankan akun.',
          done: user.emailVerified != null,
          href: '/dashboard/keamanan',
        },
        {
          id: 'set-password',
          label: 'Atur password',
          description: 'Tetapkan password agar bisa masuk tanpa Google.',
          done: user.passwordHash != null,
          href: '/dashboard/keamanan/password',
        },
        {
          id: 'enable-2fa',
          label: 'Aktifkan 2FA',
          description:
            'Tambahkan lapisan keamanan tambahan dengan otentikasi dua faktor.',
          done: user.totpEnabledAt != null,
          href: '/dashboard/keamanan/2fa',
        },
        {
          id: 'complete-profile',
          label: 'Lengkapi profil',
          description:
            'Tambahkan nama, headline, dan informasi singkat tentang Anda.',
          done: profileBasics && profileDetails,
          href: '/dashboard/profil',
        },
        {
          id: 'upload-avatar',
          label: 'Unggah foto profil',
          description: 'Tambahkan foto agar profil Anda lebih mudah dikenali.',
          done: user.image != null,
          href: '/dashboard/profil',
        },
        {
          id: 'create-tenant',
          label: 'Buat tenant',
          description: 'Bergabung atau buat tenant untuk mulai berkolaborasi.',
          done: (user.tenants?.length ?? 0) > 0,
          href: '/onboarding',
        },
      ]
    } catch {
      return FALLBACK_STEPS
    }
  },
)
