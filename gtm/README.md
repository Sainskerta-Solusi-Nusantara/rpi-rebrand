# GTM Kit — RPI (Recruitment OS)

Paket kerja go-to-market untuk wedge **perekrutan volume-tinggi** (outsourcing/staffing/agency +
end-user ritel/F&B/logistik/BPO). Lihat juga catatan strategi segmen & GTM dari sesi brainstorming.

## Isi folder

| File                    | Fungsi                                                                                                                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `target-list.csv`       | Daftar target + skoring otomatis. Kolom **Total Skor** berformula `=SUM(...)`. Berisi 4 baris **PLACEHOLDER** sebagai contoh — hapus & ganti dengan lead nyata. |
| `scoring-guide.md`      | ICP berlapis, rubrik skor 0–18, ambang prioritas, kriteria diskualifikasi, peta pembeli, sumber lead.                                                           |
| `outbound-sequences.md` | Sequence siap pakai: A (champion), B (economic buyer), C (reverse-prospecting).                                                                                 |

## Cara pakai (alur kerja mingguan)

1. **Kumpulkan lead** dari sumber di `scoring-guide.md` (mulai dari reverse-prospecting job board).
2. **Import `target-list.csv`** ke Google Sheets/Excel. Formula Total Skor langsung hitung; drag-fill
   ke baris baru.
3. **Skor tiap lead** (6 kolom). Urutkan dari Total Skor tertinggi. Tandai ≥12 = Kejar.
4. **Riset champion** (Recruitment/TA/HRD Manager) → isi kolom kontak.
5. **Jalankan sequence** sesuai konteks (C jika ketahuan posting banyak; A untuk umum).
6. **Catat tiap sentuhan** di kolom Status Outreach / Tgl Sentuh Terakhir / Next Step.
7. **Target:** 5 design partner (pilot berbayar 30 hari) untuk dapat testimoni + studi kasus.

## Prasyarat produk sebelum outbound serius

3 blocker komersial yang harus beres dulu (lihat catatan strategi):

1. Pembayaran lokal + invoice/faktur (Xendit/Midtrans).
2. WhatsApp untuk notifikasi status lamaran.
3. Smoke test + CI minimal untuk alur kritis (login/2FA/isolasi tenant).

> Catatan: baris di `target-list.csv` adalah PLACEHOLDER (PT Contoh ...), bukan perusahaan nyata —
> jangan dikirimi outreach sebelum diganti data riil.
