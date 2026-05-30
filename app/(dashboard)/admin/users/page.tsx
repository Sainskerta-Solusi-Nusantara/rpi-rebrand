import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'
import { AdminUsersTableSelector } from '@/components/organisms/admin-users-table-selector'

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
const Pagination: any = safeRequire('@/components/molecules/pagination', 'Pagination')

export const metadata = { title: 'Manajemen Pengguna' }

const PAGE_SIZE = 25

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const q = typeof searchParams.q === 'string' ? searchParams.q : undefined
  const role = typeof searchParams.role === 'string' ? searchParams.role : undefined
  const status = typeof searchParams.status === 'string' ? searchParams.status : undefined
  const verified = typeof searchParams.verified === 'string' ? searchParams.verified : undefined
  const pageRaw = typeof searchParams.page === 'string' ? Number(searchParams.page) : 1
  const page = Math.max(1, Number.isFinite(pageRaw) ? pageRaw : 1)

  const where: Prisma.UserWhereInput = {
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: 'insensitive' } },
            { name: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(role ? ({ globalRole: role as any } as Prisma.UserWhereInput) : {}),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(status ? ({ status: status as any } as Prisma.UserWhereInput) : {}),
    ...(verified === 'yes'
      ? { emailVerified: { not: null } }
      : verified === 'no'
        ? { emailVerified: null }
        : {}),
  }

  const [users, total] = await Promise.all([
    prisma.user
      .findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          globalRole: true,
          status: true,
          emailVerified: true,
          createdAt: true,
          lastLoginAt: true,
        },
      })
      .catch(() => []),
    prisma.user.count({ where }).catch(() => 0),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl">Manajemen Pengguna</h1>
          <p className="text-muted-foreground mt-1">
            {total.toLocaleString('id-ID')} pengguna terdaftar.
          </p>
        </div>
        <form className="flex flex-wrap gap-2" action="/admin/users">
          <input
            name="q"
            defaultValue={q ?? ''}
            placeholder="Cari email atau nama"
            className="border-border bg-background rounded-md border px-3 py-1.5 text-sm"
          />
          <select
            name="role"
            defaultValue={role ?? ''}
            className="border-border bg-background rounded-md border px-3 py-1.5 text-sm"
          >
            <option value="">Semua peran</option>
            <option value="SUPERADMIN">SUPERADMIN</option>
            <option value="ADMIN">ADMIN</option>
            <option value="PARTNER">PARTNER</option>
            <option value="USER">USER</option>
          </select>
          <select
            name="status"
            defaultValue={status ?? ''}
            className="border-border bg-background rounded-md border px-3 py-1.5 text-sm"
          >
            <option value="">Semua status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="PENDING">Menunggu</option>
            <option value="SUSPENDED">Ditangguhkan</option>
            <option value="DELETED">Dihapus</option>
          </select>
          <select
            name="verified"
            defaultValue={verified ?? ''}
            className="border-border bg-background rounded-md border px-3 py-1.5 text-sm"
          >
            <option value="">Verifikasi: semua</option>
            <option value="yes">Terverifikasi</option>
            <option value="no">Belum</option>
          </select>
          <button className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm">
            Filter
          </button>
        </form>
      </header>

      <AdminUsersTableSelector users={users} />

      <Pagination page={page} totalPages={totalPages} />
    </div>
  )
}
