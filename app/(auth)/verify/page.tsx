import Link from 'next/link'

export const metadata = {
  title: 'Verifikasi Email · Rumah Pekerja Indonesia',
  description: 'Periksa email Anda untuk melanjutkan.',
}

export default function VerifyPage() {
  return (
    <div className="space-y-6 text-center">
      <div
        aria-hidden
        className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[hsl(43,74%,55%)]/15 text-3xl"
      >
        <span className="text-[hsl(220,50%,14%)]">✉</span>
      </div>

      <header className="space-y-2">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Cek email Anda
        </h2>
        <p className="text-sm text-muted-foreground">
          Kami baru saja mengirimkan tautan ke email Anda. Klik tautan tersebut
          untuk menyelesaikan proses masuk atau verifikasi akun.
        </p>
      </header>

      <div className="rounded-md border border-border bg-muted/50 p-4 text-left text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Tidak menerima email?</p>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          <li>Periksa folder spam atau promosi.</li>
          <li>Pastikan alamat email yang Anda masukkan benar.</li>
          <li>Tunggu beberapa menit — pengiriman dapat tertunda.</li>
        </ul>
      </div>

      <div className="flex flex-col gap-2 text-sm">
        <Link href="/login" className="font-medium text-primary hover:underline">
          Kembali ke halaman masuk
        </Link>
        <Link
          href="/register"
          className="text-muted-foreground hover:text-foreground hover:underline"
        >
          Daftar dengan email lain
        </Link>
      </div>
    </div>
  )
}
