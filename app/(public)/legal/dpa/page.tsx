import type { Metadata } from 'next'
import { CTABanner } from '@/components/organisms/cta-banner'
import { LegalDocLayout } from '@/components/organisms/legal-doc-layout'

export const metadata: Metadata = {
  title: 'Adendum Pemrosesan Data',
  description:
    'Data Processing Addendum — ketentuan pemrosesan data pribadi antara SSN Pekerja dan mitra perekrut.',
}

export default function DataProcessingAddendumPage() {
  return (
    <>
      <LegalDocLayout
        eyebrow="Legal · Data Processing Addendum"
        title="Adendum Pemrosesan Data"
        intro="Adendum ini mengatur bagaimana data pribadi diproses ketika mitra perekrut menggunakan layanan kami, sejalan dengan UU Pelindungan Data Pribadi."
        lastUpdated="30 Juni 2026"
        sections={[
          {
            heading: '1. Peran Para Pihak',
            paragraphs: [
              'Mitra perekrut bertindak sebagai pengendali data, sedangkan SSN Pekerja bertindak sebagai pemroses data atas nama mitra untuk keperluan layanan.',
            ],
          },
          {
            heading: '2. Ruang Lingkup Pemrosesan',
            bullets: [
              'Jenis data: data identitas, kontak, riwayat kerja, dan dokumen lamaran kandidat.',
              'Tujuan: penyaringan, pengelolaan pipeline rekrutmen, dan komunikasi terkait lamaran.',
              'Durasi: selama hubungan layanan berlangsung atau sesuai instruksi pengendali.',
            ],
          },
          {
            heading: '3. Kewajiban Pemroses',
            bullets: [
              'Memproses data hanya berdasarkan instruksi terdokumentasi dari pengendali.',
              'Menerapkan langkah keamanan teknis dan organisasi yang memadai.',
              'Membantu pengendali memenuhi permintaan subjek data.',
            ],
          },
          {
            heading: '4. Sub-pemroses',
            paragraphs: [
              'Kami dapat menggunakan sub-pemroses tepercaya dengan kewajiban perlindungan data yang setara, dan akan memberi tahu pengendali atas perubahan yang material.',
            ],
          },
          {
            heading: '5. Pelanggaran Data',
            paragraphs: [
              'Kami akan memberi tahu pengendali tanpa penundaan yang tidak wajar setelah mengetahui adanya insiden keamanan yang memengaruhi data pribadi.',
            ],
          },
        ]}
      />
      <CTABanner />
    </>
  )
}
