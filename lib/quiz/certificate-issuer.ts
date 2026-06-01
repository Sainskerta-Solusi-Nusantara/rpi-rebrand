/**
 * Certificate issuance + HTML render pipeline.
 *
 * On a passing quiz attempt that completes a course, we:
 *   1. Look up any existing Certificate for (userId, courseId) — idempotent.
 *   2. Generate a unique certificateNumber `RPI-CERT-{YYYY}-{6char}`.
 *      Retries up to 3x on Prisma P2002 (unique collision) before giving up.
 *   3. Render an elegant A4-landscape HTML file with embedded CSS — no
 *      external dependencies, no puppeteer. The user opens it in the browser
 *      and uses the browser's "Print to PDF" feature.
 *   4. Save the HTML to /public/uploads/certificates/{userId}/{number}.html
 *      and create the Certificate row pointing at it.
 *   5. Audit `certificate.issued`.
 *
 * The fileUrl format matches the existing convention in the codebase
 * (lib/enrollments/actions.ts also writes under /public/uploads/certificates/).
 */

import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { headers } from 'next/headers'
import { AuditAction, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type CertificatePayload = {
  userName: string
  courseName: string
  completionDate: Date
  certificateNumber: string
  issuerName: string
  tenantName?: string | null
}

export type IssueResult = {
  id: string
  certificateNumber: string
  fileUrl: string
  title: string
  issuer: string
  issuedAt: Date
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const NUMBER_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // omit confusable 0/O/I/1

function generateCertificateNumber(year: number = new Date().getFullYear()): string {
  // 6-char suffix from crypto.randomBytes, mapped to the unambiguous alphabet.
  const buf = crypto.randomBytes(6)
  let suffix = ''
  for (let i = 0; i < 6; i++) {
    suffix += NUMBER_ALPHABET[buf[i]! % NUMBER_ALPHABET.length]
  }
  return `RPI-CERT-${year}-${suffix}`
}

function getRequestMeta() {
  try {
    const h = headers()
    return {
      ip:
        h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        h.get('x-real-ip') ??
        null,
      userAgent: h.get('user-agent') ?? null,
    }
  } catch {
    return { ip: null, userAgent: null }
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatDateId(date: Date): string {
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

// -----------------------------------------------------------------------------
// HTML renderer
// -----------------------------------------------------------------------------

/**
 * Render a self-contained A4-landscape HTML certificate. No external assets:
 * fonts fall back to a serif stack, the "QR" verification block is a styled
 * placeholder so we don't need a runtime QR library. Print-to-PDF friendly.
 */
export function renderCertificateHtml(payload: CertificatePayload): string {
  const recipient = escapeHtml(payload.userName || 'Penerima Sertifikat')
  const course = escapeHtml(payload.courseName || 'Kursus RPI')
  const issuer = escapeHtml(payload.issuerName || 'Rumah Pekerja Indonesia')
  const tenant = payload.tenantName ? escapeHtml(payload.tenantName) : null
  const number = escapeHtml(payload.certificateNumber)
  const date = escapeHtml(formatDateId(payload.completionDate))
  const verifyPath = `/sertifikat/verify/${encodeURIComponent(payload.certificateNumber)}`

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Sertifikat ${course} — ${number}</title>
<meta name="description" content="Sertifikat penyelesaian kursus ${course} atas nama ${recipient}." />
<style>
  @page { size: A4 landscape; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #e6e3d8; }
  body {
    font-family: Georgia, 'Times New Roman', 'Garamond', serif;
    color: #0a2540;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .sheet {
    width: 297mm;
    height: 210mm;
    margin: 16px auto;
    background: #fbfaf6;
    position: relative;
    box-shadow: 0 30px 60px -20px rgba(10, 37, 64, 0.35);
    overflow: hidden;
  }
  @media print {
    body { background: #fff; }
    .sheet { margin: 0; box-shadow: none; }
  }
  .frame-outer {
    position: absolute;
    inset: 12mm;
    border: 3px double #c9a961;
    pointer-events: none;
  }
  .frame-inner {
    position: absolute;
    inset: 15mm;
    border: 1px solid rgba(201, 169, 97, 0.6);
    pointer-events: none;
  }
  .ornament {
    position: absolute;
    width: 24mm;
    height: 24mm;
    border: 2px solid #c9a961;
    border-radius: 50%;
    opacity: 0.5;
  }
  .ornament.tl { top: 8mm; left: 8mm; }
  .ornament.tr { top: 8mm; right: 8mm; }
  .ornament.bl { bottom: 8mm; left: 8mm; }
  .ornament.br { bottom: 8mm; right: 8mm; }
  .band {
    position: absolute;
    top: 18mm;
    left: 22mm;
    right: 22mm;
    background: linear-gradient(180deg, #0a2540 0%, #13315a 100%);
    color: #fff;
    text-align: center;
    padding: 6mm 0 5mm;
  }
  .band h1 {
    margin: 0;
    font-size: 16pt;
    letter-spacing: 8pt;
    font-weight: 400;
  }
  .band p {
    margin: 2mm 0 0;
    font-size: 9pt;
    letter-spacing: 4pt;
    color: #c9a961;
  }
  .body {
    position: absolute;
    top: 60mm;
    left: 30mm;
    right: 30mm;
    bottom: 38mm;
    text-align: center;
  }
  .body .headline {
    font-size: 42pt;
    font-weight: 700;
    letter-spacing: 12pt;
    color: #0a2540;
    margin: 0;
  }
  .body .gold-rule {
    width: 60mm;
    height: 2px;
    background: linear-gradient(90deg, transparent, #c9a961, transparent);
    margin: 6mm auto;
  }
  .body .label {
    font-size: 11pt;
    letter-spacing: 3pt;
    color: #4b5563;
    margin: 4mm 0 2mm;
  }
  .body .recipient {
    font-size: 36pt;
    font-style: italic;
    color: #0a2540;
    margin: 4mm 0 2mm;
    border-bottom: 1px solid rgba(201, 169, 97, 0.55);
    padding-bottom: 4mm;
  }
  .body .course-label {
    font-size: 10pt;
    letter-spacing: 2pt;
    color: #4b5563;
    margin: 6mm 0 2mm;
  }
  .body .course {
    font-size: 22pt;
    font-weight: 700;
    color: #0a2540;
    margin: 0 0 4mm;
  }
  .footer {
    position: absolute;
    left: 30mm;
    right: 30mm;
    bottom: 22mm;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 10mm;
  }
  .footer .block {
    flex: 1;
    text-align: center;
    border-top: 1px solid #0a2540;
    padding-top: 3mm;
  }
  .footer .block .small {
    font-size: 9pt;
    letter-spacing: 2pt;
    color: #4b5563;
  }
  .footer .block .big {
    font-size: 13pt;
    font-weight: 700;
    margin-top: 1mm;
  }
  .verify {
    width: 28mm;
    text-align: center;
    flex: 0 0 auto;
  }
  .verify .qr {
    width: 26mm;
    height: 26mm;
    margin: 0 auto;
    border: 1.5px solid #0a2540;
    background:
      repeating-linear-gradient(0deg, #0a2540 0 1.6mm, transparent 1.6mm 3.2mm),
      repeating-linear-gradient(90deg, rgba(10,37,64,0.85) 0 1.6mm, transparent 1.6mm 3.2mm),
      #fbfaf6;
    background-blend-mode: multiply;
    display: grid;
    place-items: center;
    color: #fbfaf6;
    font-size: 7pt;
    letter-spacing: 1pt;
    font-family: 'Courier New', monospace;
  }
  .verify .qr span {
    background: #0a2540;
    padding: 0.5mm 1mm;
  }
  .verify p {
    margin: 2mm 0 0;
    font-size: 7pt;
    color: #4b5563;
    letter-spacing: 0.5pt;
    word-break: break-all;
  }
  .number {
    position: absolute;
    bottom: 10mm;
    left: 0;
    right: 0;
    text-align: center;
    font-family: 'Courier New', monospace;
    font-size: 9pt;
    letter-spacing: 4pt;
    color: #6b7280;
  }
  .number strong { color: #0a2540; letter-spacing: 5pt; }
  .controls {
    max-width: 297mm;
    margin: 0 auto 24px;
    padding: 0 24px;
    text-align: center;
  }
  .controls button, .controls a {
    display: inline-block;
    margin: 0 4px;
    padding: 8px 16px;
    background: #0a2540;
    color: #fff;
    text-decoration: none;
    border: none;
    border-radius: 6px;
    font: 600 13px system-ui, sans-serif;
    cursor: pointer;
  }
  .controls a.outline {
    background: transparent;
    color: #0a2540;
    border: 1px solid #0a2540;
  }
  @media print { .controls { display: none; } }
</style>
</head>
<body>
  <div class="controls">
    <button type="button" onclick="window.print()">Cetak / Simpan PDF</button>
    <a class="outline" href="${verifyPath}">Verifikasi sertifikat</a>
  </div>
  <main class="sheet" aria-label="Sertifikat ${course}">
    <div class="frame-outer"></div>
    <div class="frame-inner"></div>
    <div class="ornament tl"></div>
    <div class="ornament tr"></div>
    <div class="ornament bl"></div>
    <div class="ornament br"></div>

    <header class="band">
      <h1>RUMAH PEKERJA INDONESIA</h1>
      <p>RPI ACADEMY</p>
    </header>

    <section class="body">
      <p class="headline">SERTIFIKAT</p>
      <div class="gold-rule"></div>
      <p class="label">Diberikan kepada</p>
      <p class="recipient">${recipient}</p>
      <p class="course-label">Atas penyelesaian kursus</p>
      <p class="course">${course}</p>
    </section>

    <footer class="footer">
      <div class="block">
        <p class="small">Dikeluarkan oleh</p>
        <p class="big">${issuer}</p>
        ${tenant ? `<p class="small">${tenant}</p>` : ''}
      </div>
      <div class="verify" aria-label="Verifikasi sertifikat">
        <div class="qr"><span>SCAN</span></div>
        <p>[verifikasi: ${verifyPath}]</p>
      </div>
      <div class="block">
        <p class="small">Tanggal</p>
        <p class="big">${date}</p>
      </div>
    </footer>

    <p class="number">Nomor Sertifikat: <strong>${number}</strong></p>
  </main>
</body>
</html>
`
}

// -----------------------------------------------------------------------------
// Issuer
// -----------------------------------------------------------------------------

/**
 * Idempotently create a Certificate for (userId, courseId).
 *
 * Returns the existing certificate if one already exists. Otherwise generates
 * a unique number, writes the HTML file, creates the row, audits the event.
 *
 * Number-collision strategy: try up to 3 times; on the 3rd Prisma P2002 we
 * surface an error rather than spinning forever.
 */
export async function issueCertificate(
  userId: string,
  courseId: string,
): Promise<IssueResult | null> {
  if (!userId || !courseId) return null

  // 1. Idempotency — return existing if any.
  const existing = await prisma.certificate.findFirst({
    where: { userId, courseId },
    orderBy: { issuedAt: 'desc' },
    select: {
      id: true,
      certificateNumber: true,
      fileUrl: true,
      title: true,
      issuer: true,
      issuedAt: true,
    },
  })
  if (existing && existing.certificateNumber) {
    return {
      id: existing.id,
      certificateNumber: existing.certificateNumber,
      fileUrl: existing.fileUrl,
      title: existing.title,
      issuer: existing.issuer,
      issuedAt: existing.issuedAt,
    }
  }

  // 2. Load context (course title, tenant name, user name).
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      tenantId: true,
      tenant: { select: { id: true, name: true } },
    },
  })
  if (!course) return null

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  })
  if (!user) return null

  const recipientName =
    user.name?.trim() || user.email?.split('@')[0] || 'Peserta RPI'
  const issuerName = course.tenant?.name || 'Rumah Pekerja Indonesia'
  const tenantName = course.tenant?.name ?? null
  const title = `Sertifikat Penyelesaian: ${course.title}`
  const now = new Date()
  const year = now.getFullYear()

  // 3. Write the row + file with unique-number retry.
  let attempt = 0
  let lastError: unknown = null
  while (attempt < 3) {
    attempt++
    const certificateNumber = generateCertificateNumber(year)
    try {
      const created = await prisma.certificate.create({
        data: {
          userId,
          courseId,
          certificateNumber,
          title,
          issuer: issuerName,
          // Placeholder — patched after we write the file.
          fileUrl: '',
        },
        select: { id: true, issuedAt: true },
      })

      // Render + write HTML file.
      const html = renderCertificateHtml({
        userName: recipientName,
        courseName: course.title,
        completionDate: created.issuedAt,
        certificateNumber,
        issuerName,
        tenantName,
      })
      const baseDir = path.join(
        process.cwd(),
        'public',
        'uploads',
        'certificates',
        userId,
      )
      await fs.mkdir(baseDir, { recursive: true })
      const filename = `${certificateNumber}.html`
      await fs.writeFile(path.join(baseDir, filename), html, 'utf8')
      const fileUrl = `/uploads/certificates/${userId}/${filename}`

      await prisma.certificate.update({
        where: { id: created.id },
        data: { fileUrl },
      })

      // Audit.
      const meta = getRequestMeta()
      await prisma.auditLog.create({
        data: {
          tenantId: course.tenantId,
          userId,
          action: AuditAction.CREATE,
          resource: 'certificate.issued',
          resourceId: created.id,
          metadata: {
            userId,
            courseId,
            certificateNumber,
            fileUrl,
          } as Prisma.InputJsonValue,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      })

      return {
        id: created.id,
        certificateNumber,
        fileUrl,
        title,
        issuer: issuerName,
        issuedAt: created.issuedAt,
      }
    } catch (err) {
      lastError = err
      // Retry on unique-collision (P2002) up to the loop cap.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        continue
      }
      console.error('[issueCertificate] failed', err)
      return null
    }
  }
  console.error(
    '[issueCertificate] failed after retries (likely persistent P2002)',
    lastError,
  )
  return null
}
