import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mitra Perekrut',
  description:
    'Bergabung dengan ratusan mitra perekrut terverifikasi yang memanfaatkan platform Rumah Pekerja Indonesia.',
}

// TEMPORARY DUMMY DATA — replace with prisma query once UI is approved.
type DummyPartner = {
  id: string
  slug: string
  name: string
  primaryColor: string
  jobsCount: number
  industry: string
}

const DUMMY_PARTNERS: DummyPartner[] = [
  { id: '1',  slug: 'telkom',       name: 'Telkom Indonesia',         primaryColor: '#E60000', jobsCount: 42, industry: 'Telekomunikasi' },
  { id: '2',  slug: 'bca',          name: 'Bank Central Asia',        primaryColor: '#0060AF', jobsCount: 28, industry: 'Perbankan' },
  { id: '3',  slug: 'gojek',        name: 'Gojek',                    primaryColor: '#00AA13', jobsCount: 35, industry: 'Teknologi' },
  { id: '4',  slug: 'tokopedia',    name: 'Tokopedia',                primaryColor: '#42B549', jobsCount: 31, industry: 'E-Commerce' },
  { id: '5',  slug: 'pertamina',    name: 'Pertamina',                primaryColor: '#D32F2F', jobsCount: 19, industry: 'Energi' },
  { id: '6',  slug: 'unilever',     name: 'Unilever Indonesia',       primaryColor: '#1F36C7', jobsCount: 22, industry: 'Consumer Goods' },
  { id: '7',  slug: 'astra',        name: 'Astra International',      primaryColor: '#003DA5', jobsCount: 26, industry: 'Otomotif' },
  { id: '8',  slug: 'indofood',     name: 'Indofood Sukses Makmur',   primaryColor: '#E30613', jobsCount: 18, industry: 'Pangan' },
  { id: '9',  slug: 'mandiri',      name: 'Bank Mandiri',             primaryColor: '#003D7A', jobsCount: 24, industry: 'Perbankan' },
  { id: '10', slug: 'bri',          name: 'Bank BRI',                 primaryColor: '#00529B', jobsCount: 21, industry: 'Perbankan' },
  { id: '11', slug: 'shopee',       name: 'Shopee Indonesia',         primaryColor: '#EE4D2D', jobsCount: 33, industry: 'E-Commerce' },
  { id: '12', slug: 'traveloka',    name: 'Traveloka',                primaryColor: '#0194F3', jobsCount: 17, industry: 'Travel' },
  { id: '13', slug: 'bukalapak',    name: 'Bukalapak',                primaryColor: '#E31E52', jobsCount: 14, industry: 'E-Commerce' },
  { id: '14', slug: 'kalbe',        name: 'Kalbe Farma',              primaryColor: '#00A651', jobsCount: 16, industry: 'Farmasi' },
  { id: '15', slug: 'sinarmas',     name: 'Sinar Mas Group',          primaryColor: '#F58025', jobsCount: 20, industry: 'Konglomerat' },
  { id: '16', slug: 'pln',          name: 'PLN',                      primaryColor: '#FBB040', jobsCount: 12, industry: 'Energi' },
  { id: '17', slug: 'wijaya',       name: 'Wijaya Karya',             primaryColor: '#0E4D92', jobsCount: 11, industry: 'Konstruksi' },
  { id: '18', slug: 'garuda',       name: 'Garuda Indonesia',         primaryColor: '#005F9E', jobsCount: 9,  industry: 'Penerbangan' },
  { id: '19', slug: 'xl',           name: 'XL Axiata',                primaryColor: '#00B0EC', jobsCount: 15, industry: 'Telekomunikasi' },
  { id: '20', slug: 'indosat',      name: 'Indosat Ooredoo Hutchison', primaryColor: '#EE3124', jobsCount: 13, industry: 'Telekomunikasi' },
  { id: '21', slug: 'blibli',       name: 'Blibli',                   primaryColor: '#0095DA', jobsCount: 10, industry: 'E-Commerce' },
  { id: '22', slug: 'dana',         name: 'DANA Indonesia',           primaryColor: '#118EEA', jobsCount: 8,  industry: 'Fintech' },
  { id: '23', slug: 'ovo',          name: 'OVO',                      primaryColor: '#4C3494', jobsCount: 7,  industry: 'Fintech' },
  { id: '24', slug: 'kompas',       name: 'Kompas Gramedia',          primaryColor: '#003F88', jobsCount: 6,  industry: 'Media' },
]

const TOTAL_PARTNERS = 248
const TOTAL_JOBS = 1_356

export default function MitraPage() {
  const partners = DUMMY_PARTNERS
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost:3000'

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <header className="mb-10 text-center">
        <h1 className="font-heading text-3xl md:text-5xl">Mitra Perekrut Kami</h1>
        <p className="text-muted-foreground mx-auto mt-3 max-w-2xl">
          {TOTAL_PARTNERS.toLocaleString('id-ID')} perusahaan mempercayakan rekrutmen mereka kepada
          Rumah Pekerja Indonesia, dengan {TOTAL_JOBS.toLocaleString('id-ID')} lowongan aktif.
        </p>
      </header>

      <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {partners.map((p) => (
          <li
            key={p.id}
            className="border-border bg-card rounded-xl border p-6 text-center hover:shadow-md transition"
          >
            <a href={`https://${p.slug}.${rootDomain}`}>
              <div
                className="mx-auto mb-3 grid size-14 place-items-center rounded-lg"
                style={{ background: p.primaryColor, color: '#fff' }}
                aria-hidden
              >
                <span className="font-heading text-2xl">{p.name[0]}</span>
              </div>
              <div className="font-medium">{p.name}</div>
              <div className="text-muted-foreground mt-1 text-xs">{p.industry}</div>
              <div className="text-muted-foreground mt-1 text-xs">
                {p.jobsCount} lowongan aktif
              </div>
            </a>
          </li>
        ))}
      </ul>

      <section className="border-border bg-muted/30 mt-16 rounded-2xl border p-10 text-center">
        <h2 className="font-heading text-2xl md:text-3xl">Jadi Mitra Perekrut</h2>
        <p className="text-muted-foreground mx-auto mt-3 max-w-xl">
          Pasang lowongan, kelola talent pool, dan bangun brand karier Anda di platform yang fokus
          pada pekerja Indonesia.
        </p>
        <a
          href="/register?role=partner"
          className="bg-primary text-primary-foreground mt-6 inline-flex items-center rounded-md px-6 py-3 font-medium"
        >
          Daftar Sebagai Mitra
        </a>
      </section>
    </div>
  )
}
