/**
 * Pure SVG certificate builder.
 *
 * Returns an A4-landscape-ish SVG (viewBox 0 0 1280 800) with elegant
 * typography, gold accents, and an RPI-style navy header. The certificate
 * id is embedded both visibly (for offline verification) and as a data
 * attribute. Indonesian copy throughout.
 *
 * Output format note:
 *   This is the only certificate format we currently emit. We chose SVG
 *   over PDF because (a) it ships as plain text — no PDF library / native
 *   font subsetting needed, (b) Next can serve it directly out of
 *   /public/uploads as a static asset, (c) browsers render it crisply at
 *   any zoom for screen viewing AND inline embedding in our /sertifikat/[id]
 *   verification page. A PDF variant (server-rendered from this same SVG
 *   via something like sharp or playwright) is a follow-up — we'd add a
 *   second `fileUrlPdf` column on Certificate at that time.
 */

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function formatIssuedAt(date: Date): string {
  // dd MMMM yyyy in Indonesian locale, no time component.
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date)
  } catch {
    return date.toISOString().slice(0, 10)
  }
}

export type BuildCertificateSvgOpts = {
  recipientName: string
  courseTitle: string
  issuerName: string
  issuedAt: Date
  certificateId: string
}

export function buildCertificateSvg(opts: BuildCertificateSvgOpts): string {
  const recipient = escapeXml(opts.recipientName || 'Penerima Sertifikat')
  const course = escapeXml(opts.courseTitle || 'Kursus RPI')
  const issuer = escapeXml(opts.issuerName || 'Rumah Pekerja Indonesia')
  const date = escapeXml(formatIssuedAt(opts.issuedAt))
  const certId = escapeXml(opts.certificateId)

  // Sized for A4 landscape proportions (≈1.6:1). 1280x800 keeps clean math.
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800" width="1280" height="800" role="img" aria-label="Sertifikat ${course}" data-certificate-id="${certId}">
  <defs>
    <linearGradient id="rpi-navy" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0A2540"/>
      <stop offset="100%" stop-color="#13315A"/>
    </linearGradient>
    <linearGradient id="rpi-gold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#C9A961"/>
      <stop offset="50%" stop-color="#E6CD86"/>
      <stop offset="100%" stop-color="#C9A961"/>
    </linearGradient>
  </defs>

  <!-- Page background -->
  <rect x="0" y="0" width="1280" height="800" fill="#FBFAF6"/>

  <!-- Outer gold border -->
  <rect x="32" y="32" width="1216" height="736" fill="none" stroke="url(#rpi-gold)" stroke-width="3"/>
  <rect x="44" y="44" width="1192" height="712" fill="none" stroke="#C9A961" stroke-width="1" opacity="0.55"/>

  <!-- Navy header band -->
  <rect x="32" y="32" width="1216" height="120" fill="url(#rpi-navy)"/>
  <text x="640" y="92" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="22" letter-spacing="8" fill="#FFFFFF">RUMAH PEKERJA INDONESIA</text>
  <text x="640" y="124" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="13" letter-spacing="6" fill="#C9A961">RPI ACADEMY</text>

  <!-- Headline -->
  <text x="640" y="240" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="56" font-weight="bold" letter-spacing="14" fill="#0A2540">SERTIFIKAT</text>
  <line x1="540" y1="266" x2="740" y2="266" stroke="url(#rpi-gold)" stroke-width="2"/>

  <!-- Recipient block -->
  <text x="640" y="320" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="18" fill="#4B5563" letter-spacing="3">Diberikan kepada</text>
  <text x="640" y="392" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="48" font-style="italic" fill="#0A2540">${recipient}</text>
  <line x1="340" y1="416" x2="940" y2="416" stroke="#C9A961" stroke-width="1" opacity="0.5"/>

  <!-- Course block -->
  <text x="640" y="462" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="16" fill="#4B5563" letter-spacing="2">Atas penyelesaian kursus</text>
  <text x="640" y="510" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="30" font-weight="bold" fill="#0A2540">${course}</text>

  <!-- Signature + date row -->
  <g font-family="Georgia, 'Times New Roman', serif" fill="#0A2540">
    <!-- Left: issuer / signature -->
    <line x1="220" y1="640" x2="500" y2="640" stroke="#0A2540" stroke-width="1"/>
    <text x="360" y="666" text-anchor="middle" font-size="13" fill="#4B5563" letter-spacing="2">Dikeluarkan oleh</text>
    <text x="360" y="688" text-anchor="middle" font-size="18" font-weight="bold">${issuer}</text>

    <!-- Right: date -->
    <line x1="780" y1="640" x2="1060" y2="640" stroke="#0A2540" stroke-width="1"/>
    <text x="920" y="666" text-anchor="middle" font-size="13" fill="#4B5563" letter-spacing="2">Tanggal</text>
    <text x="920" y="688" text-anchor="middle" font-size="18" font-weight="bold">${date}</text>
  </g>

  <!-- Footer: certificate id (verifiable) -->
  <text x="640" y="744" text-anchor="middle" font-family="'Courier New', monospace" font-size="11" fill="#6B7280" letter-spacing="2">ID Sertifikat: ${certId}</text>
</svg>
`
}
