# SECURITY.md — SSN Pekerja (SSN)

Dokumen keamanan komprehensif untuk platform SaaS multi-tenant SSN. Sasaran: melindungi data pencari kerja, partner, dan integritas platform sesuai UU PDP (Indonesia) dan praktik GDPR-compatible.

---

## 1. Threat Model (STRIDE)

| Kategori            | Ancaman                                   | Aset                  | Mitigasi                                                         |
| ------------------- | ----------------------------------------- | --------------------- | ---------------------------------------------------------------- |
| **S**poofing        | Phishing login, session hijack            | Akun user/partner     | NextAuth JWT signed + httpOnly cookie, 2FA TOTP, SPF/DKIM/DMARC  |
| **T**ampering       | SQL inject, mass-assign, parameter tamper | Job, application data | Prisma parameterized, Zod whitelist, RLS, CSRF token             |
| **R**epudiation     | Partner menolak telah hapus job           | Audit                 | Append-only `audit_logs` + hash chain                            |
| **I**nfo disclosure | Cross-tenant leak, IDOR, S3 public        | CV, salary, PII       | RLS, presigned URL, no public bucket, scoped queries             |
| **D**oS             | Login brute, API flood                    | Availability          | Upstash rate-limit, Vercel WAF, captcha, queue backpressure      |
| **E**oP             | User → admin, partner A → tenant B        | Privilege             | RBAC matrix, `requireRole`, RLS double-check, no eval/dyn-import |

### Aktor & Permukaan Serang

- **Anonim Internet** → endpoint publik (`/api/v1/auth/*`, `/api/v1/jobs` GET).
- **User terdaftar** → seluruh user-scoped resource.
- **Partner** → tenant-scoped write.
- **Admin tenant** → tenant config + team.
- **Superadmin** → cross-tenant; akun terpisah hardware key wajib.
- **Insider (developer)** → akses prod via break-glass IAM.
- **Supply chain** → npm dep, container image, Vercel build.

---

## 2. Authentication

### 2.1 NextAuth Configuration

- **Strategy**: JWT (stateless) untuk session; tabel `sessions` dipakai hanya untuk OAuth account linking.
- **JWT**: HS512, secret 64 byte (env `NEXTAUTH_SECRET`). Klaim: `sub`, `email`, `role`, `tenantId`, `iat`, `exp` (30 hari rolling 7 hari sliding).
- **Cookie**: `Secure; HttpOnly; SameSite=Lax; Path=/; __Host-` prefix.
- **Providers**: Credentials + Google OAuth.

### 2.2 Password Policy

- Minimal 12 karakter; cek kekuatan zxcvbn ≥ 3.
- **bcrypt cost 12** (per benchmark target ~250ms/hash di prod hardware).
- Cek terhadap Have I Been Pwned API (k-anonymity, prefix 5 char SHA1) — tolak jika muncul.
- Tidak ada complexity rule kaku (NIST 800-63B aligned).

```ts
// lib/auth/password.ts
import bcrypt from 'bcrypt'
import { createHash } from 'crypto'

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 12)
}
export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash)
}
export async function isPwned(pw: string) {
  const sha1 = createHash('sha1').update(pw).digest('hex').toUpperCase()
  const prefix = sha1.slice(0, 5)
  const suffix = sha1.slice(5)
  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
    headers: { 'Add-Padding': 'true' },
    cache: 'no-store',
  })
  const body = await res.text()
  return body.split('\n').some((l) => l.startsWith(suffix))
}
```

### 2.3 Google OAuth

- Scopes minimal: `openid email profile`.
- `hd` claim tidak dipaksa (konsumen umum).
- Account linking: jika email sama dengan akun Credentials existing → wajib konfirmasi via email link sebelum merge.

### 2.4 2FA TOTP (Post-MVP)

- `otplib` (RFC 6238), 6 digit, 30s step, drift ±1.
- Backup codes: 10 codes one-time, disimpan sebagai bcrypt hash.
- Recovery: lewat email + cooldown 24 jam + manual review jika partner/admin.

### 2.5 Login Throttle & Lockout

- 5 percobaan gagal per email/IP per 10 menit → tolak (`429`).
- 10 gagal kumulatif → kunci akun 30 menit (`423 ACCOUNT_LOCKED`), kirim email peringatan.
- Reset hitungan saat login sukses.

```ts
// lib/auth/throttle.ts
import { rl } from '@/lib/ratelimit'
export async function checkLoginThrottle(email: string, ip: string) {
  await rl('anonAuth', `login:${email}`)
  await rl('anonAuth', `login:ip:${ip}`)
}
```

### 2.6 Email Verification & Password Reset

- Token: 32 byte random, base64url, disimpan **sebagai hash SHA256** di DB.
- TTL: verifikasi 24 jam, reset 1 jam.
- Single-use: hapus saat dikonsumsi.
- Setelah reset password sukses: invalidasi semua session lain (rotasi `tokenVersion` di JWT).

---

## 3. Authorization (RBAC)

### 3.1 Hierarki Role

```
superadmin  >  admin (per-tenant)  >  partner (per-tenant owner)  >  recruiter  >  user
```

### 3.2 Matriks Izin

| Resource / Action          | user    | recruiter | partner        | admin | superadmin |
| -------------------------- | ------- | --------- | -------------- | ----- | ---------- |
| Branding GET               | R       | R         | R              | R     | R          |
| Branding PUT               | –       | –         | W              | W     | W          |
| Job GET                    | R       | R         | R              | R     | R          |
| Job POST/PATCH/DELETE      | –       | W (own)   | W              | W     | W          |
| Application POST           | W       | –         | –              | –     | –          |
| Application list (own job) | R (own) | R         | R              | R     | R          |
| Team list                  | –       | –         | R              | R     | R          |
| Team invite                | –       | –         | W              | W     | W          |
| Course CRUD                | –       | W (own)   | W              | W     | W          |
| Enrollment                 | W       | –         | –              | –     | –          |
| Tenant config              | –       | –         | W              | W     | W          |
| Audit log                  | –       | –         | R (own action) | R     | R (all)    |
| Cross-tenant admin         | –       | –         | –              | –     | W          |

### 3.3 Helper `requireRole` / `requireTenantRole`

```ts
// lib/authz.ts
export type Role = 'superadmin' | 'admin' | 'partner' | 'recruiter' | 'user'
export type AuthCtx = { userId: string; tenantId: string | null; role: Role }

const ORDER: Record<Role, number> = {
  superadmin: 5,
  admin: 4,
  partner: 3,
  recruiter: 2,
  user: 1,
}

export function requireRole(ctx: AuthCtx, allowed: Role[]) {
  if (!allowed.includes(ctx.role) && ctx.role !== 'superadmin') {
    throw new ApiError('FORBIDDEN', 'Role insufficient', 403)
  }
}

export function requireTenantRole(ctx: AuthCtx, tenantId: string, min: Role) {
  if (ctx.role === 'superadmin') return
  if (ctx.tenantId !== tenantId) throw new ApiError('FORBIDDEN', 'Wrong tenant', 403)
  if (ORDER[ctx.role] < ORDER[min]) throw new ApiError('FORBIDDEN', 'Role too low', 403)
}

export function requireOwnership<T extends { createdById: string; tenantId: string }>(
  ctx: AuthCtx,
  row: T,
  minRoleOverride: Role = 'admin',
) {
  if (ctx.role === 'superadmin') return
  if (ctx.tenantId !== row.tenantId) throw new ApiError('FORBIDDEN', 'tenant', 403)
  if (row.createdById !== ctx.userId && ORDER[ctx.role] < ORDER[minRoleOverride])
    throw new ApiError('FORBIDDEN', 'not owner', 403)
}
```

### 3.4 Pencegahan Cross-Tenant

1. **Middleware** menetapkan `x-tenant-slug`.
2. **Auth callback** memvalidasi `ctx.tenantId === tenantOfSlug.id` (kecuali superadmin).
3. **Service** selalu `withTenant(ctx.tenantId)`.
4. **RLS** menolak query kalaupun service salah.

Tiga lapisan; kompromi satu lapisan tidak otomatis bocor.

---

## 4. Postgres Row-Level Security (RLS)

### 4.1 Mengapa RLS

- **Defense in depth**: bug authz tidak langsung berarti data leak.
- **Compliance**: bukti audit untuk UU PDP / SOC2 — kontrol ada di DB, bukan hanya app.
- **Performa**: filter di engine, planner bisa pakai index `tenant_id`.

### 4.2 Pola Migrasi

```sql
-- migrations/20260101_rls_enable.sql
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs FORCE ROW LEVEL SECURITY;  -- owner pun terkena

CREATE POLICY jobs_tenant_isolation ON jobs
  USING (tenant_id::text = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant_id', true));

-- superadmin bypass via role terpisah:
CREATE ROLE rpi_app NOINHERIT LOGIN PASSWORD :'app_pw';
CREATE ROLE rpi_superadmin NOINHERIT LOGIN PASSWORD :'su_pw';
GRANT rpi_app TO rpi_superadmin;

ALTER POLICY jobs_tenant_isolation ON jobs
  USING (
    tenant_id::text = current_setting('app.current_tenant_id', true)
    OR current_user = 'rpi_superadmin'
  );
```

### 4.3 Session Var Per Request

```ts
// lib/db.ts (excerpt)
await tx.$executeRawUnsafe(`SELECT set_config('app.current_tenant_id', $1, true)`, tenantId)
```

Flag `true` (transaction-scoped) memastikan tidak bocor antar koneksi pool.

### 4.4 Policy untuk Tabel `users`

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_self_or_tenant ON users
  USING (
    -- user lihat dirinya sendiri:
    id::text = current_setting('app.current_user_id', true)
    -- atau anggota tenant yg sama:
    OR tenant_id::text = current_setting('app.current_tenant_id', true)
    OR current_user = 'rpi_superadmin'
  );
```

`app.current_user_id` di-set bersama `tenant_id` setiap request.

### 4.5 Testing RLS

```ts
// tests/integration/rls.spec.ts
it("isolates job rows between tenants", async () => {
  const t1 = await mkTenant(); const t2 = await mkTenant();
  await withTenant(t1.id, (tx) => tx.job.create({ data: { title:"T1", tenantId:t1.id, ... }}));
  const leaked = await withTenant(t2.id, (tx) => tx.job.findMany());
  expect(leaked).toHaveLength(0);
});

it("blocks insert with wrong tenant_id (WITH CHECK)", async () => {
  const t1 = await mkTenant(); const t2 = await mkTenant();
  await expect(
    withTenant(t1.id, (tx) => tx.job.create({ data: { title:"x", tenantId:t2.id, ... }}))
  ).rejects.toThrow(/row-level security/);
});
```

Wajib: setiap tabel ber-tenant punya test ini.

---

## 5. OWASP Top 10 — Mitigasi Spesifik

| OWASP 2021          | Risiko di SSN                    | Mitigasi                                                                     |
| ------------------- | -------------------------------- | ---------------------------------------------------------------------------- |
| A01 Broken Access   | IDOR job/application             | RLS + `requireOwnership`, UUID v7 (tidak ditebak), no incremental ID di URL  |
| A02 Crypto Failures | Resume di S3, password           | TLS 1.2+, bcrypt 12, AES-256 at rest (Postgres TDE / managed), presigned 60s |
| A03 Injection       | SQL, NoSQL, command              | Prisma parameterized, Zod schema, no `child_process` user-input              |
| A04 Insecure Design | Workflow flaw                    | Threat model review per fitur baru, abuse case di PR template                |
| A05 Misconfig       | CSP, CORS, debug                 | Helmet headers di middleware, CORS allowlist, `NODE_ENV=production` enforced |
| A06 Vuln Components | npm CVE                          | Renovate weekly + `npm audit` di CI, Socket.dev guard                        |
| A07 Auth Failures   | Brute, session fixate            | Throttle, rotasi token, cookie `__Host-`, no session ID di URL               |
| A08 Data Integrity  | Supply chain                     | SLSA build provenance, lockfile required, signed commits                     |
| A09 Logging Fail    | Tidak detect breach              | Audit log + Sentry + alert anomali (CPU, 5xx, login spike)                   |
| A10 SSRF            | Webhook config, avatar URL fetch | Allowlist scheme `https:`, deny RFC1918/metadata IP, DNS rebinding guard     |

### 5.1 SSRF Guard

```ts
// lib/safe-fetch.ts
import net from 'net'
import dns from 'dns/promises'

const PRIVATE = [/^10\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[01])\./, /^127\./, /^169\.254\./]

export async function safeFetch(url: string) {
  const u = new URL(url)
  if (u.protocol !== 'https:') throw new Error('scheme')
  const { address } = await dns.lookup(u.hostname)
  if (PRIVATE.some((r) => r.test(address))) throw new Error('private')
  return fetch(url, { redirect: 'error', signal: AbortSignal.timeout(5000) })
}
```

---

## 6. Content Security Policy (CSP)

CSP per request dengan **nonce** (RSC + script tag). Tidak pakai `unsafe-inline`.

```ts
// middleware.ts (excerpt)
const nonce = crypto.randomUUID().replace(/-/g, '')
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
  `style-src 'self' 'nonce-${nonce}'`,
  `img-src 'self' data: blob: https://*.ssn.id https://lh3.googleusercontent.com`,
  `font-src 'self' data:`,
  `connect-src 'self' https://*.upstash.io https://*.sentry.io https://api.ssn.id wss://*.ssn.id`,
  `frame-src 'self' https://www.google.com`,
  `frame-ancestors 'none'`,
  `form-action 'self'`,
  `base-uri 'self'`,
  `object-src 'none'`,
  `upgrade-insecure-requests`,
  `report-uri /api/csp-report`,
].join('; ')

res.headers.set('Content-Security-Policy', csp)
res.headers.set('x-nonce', nonce)
```

Header lain wajib:

- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-site`

---

## 7. Multi-Tenant Isolation — Test Suite

```ts
// tests/security/tenant-iso.spec.ts
describe.each(['jobs', 'applications', 'branding', 'courses', 'enrollments', 'team_members'])(
  'tenant isolation: %s',
  (table) => {
    it('GET cross-tenant returns 0/404', async () => {
      /* ... */
    })
    it('PATCH cross-tenant returns 403/404', async () => {
      /* ... */
    })
    it('DELETE cross-tenant returns 403/404', async () => {
      /* ... */
    })
    it('INSERT with foreign tenant_id rejected by RLS WITH CHECK', async () => {
      /* ... */
    })
  },
)
```

Run di CI dengan tag `security:critical`; gagal = block merge.

---

## 8. File Upload Security

- Presigned POST 60 detik TTL.
- `content-length-range` & `Content-Type` di-enforce S3 policy (tidak hanya client).
- Setelah upload, worker `scan-upload` menjalankan:
  - Magic byte check (file-type lib).
  - ClamAV (av4express container) — quarantine bila terdeteksi.
  - PDF: tolak jika punya JavaScript action.
  - Image: re-encode via sharp (strip EXIF + metadata).
- Bucket: **private**, akses via presigned GET 5 menit.
- Path: `<kind>/<tenantId>/<userId>/<uuid>` — tidak ada user-supplied filename.
- Tidak ada bucket listing untuk principal app.

```ts
// worker: scan upload
import { fileTypeFromBuffer } from 'file-type'
const t = await fileTypeFromBuffer(buf)
if (!ALLOWED_MIME[kind].includes(t?.mime)) await s3.deleteObject({ Bucket, Key })
```

---

## 9. UU PDP (Indonesia) + GDPR Compliance

### 9.1 Dasar Hukum

- UU No. 27/2022 Pelindungan Data Pribadi.
- Sebagai **Pengendali Data Pribadi (PDP)** untuk akun user; **Prosesor** untuk data partner mengenai pelamar.

### 9.2 Consent

- Checkbox eksplisit saat register, terpisah untuk:
  1. Persetujuan pemrosesan data wajib (akun, lamaran).
  2. Persetujuan opsional: marketing email, rekomendasi job berbasis profil.
- Disimpan: `user_consents { userId, kind, version, acceptedAt, ip, ua }`.
- Versi kebijakan privasi tersimpan; perubahan material → re-consent.

### 9.3 Retensi Data

| Data                      | Retensi                         | Aksi setelah         |
| ------------------------- | ------------------------------- | -------------------- |
| Akun aktif                | Selama aktif                    | –                    |
| Akun tidak aktif > 24 bln | Anonimisasi                     | Hash email, drop PII |
| CV / resume               | 12 bln setelah lamaran terakhir | Hapus dari S3        |
| Audit log                 | 5 tahun (regulator)             | Arsip cold storage   |
| Session log               | 90 hari                         | Truncate             |
| Backup                    | 30 hari rolling                 | Overwrite            |

Job cron harian `retention-sweep` menjalankan policy.

### 9.4 Hak Subjek Data

| Hak (UU PDP Pasal 5–11)        | Endpoint                                                                   |
| ------------------------------ | -------------------------------------------------------------------------- |
| Akses & salinan                | `GET /api/v1/users/me/export` → ZIP dalam 72 jam, link presigned 7 hari    |
| Pembetulan                     | `PATCH /api/v1/users/me`                                                   |
| Penghapusan (right to erasure) | `DELETE /api/v1/users/me` → soft 30 hari → hard delete (anonimisasi audit) |
| Penarikan consent              | `POST /api/v1/users/me/consents/withdraw`                                  |
| Portabilitas                   | Export JSON + CSV                                                          |
| Keberatan profiling            | Toggle di settings (matikan recommender)                                   |

### 9.5 DPO (Data Protection Officer)

- Kontak publik: `dpo@ssn.id`.
- SLA respon permintaan subjek: 3 hari kerja akui, 30 hari kerja selesai.
- Catatan permintaan: `dsr_requests` table dengan status workflow.

### 9.6 Breach Notification

- **Internal detection** → security on-call dalam 1 jam.
- **Investigasi & klasifikasi** dalam 24 jam.
- **Notifikasi ke Kementerian Kominfo/Lembaga PDP**: ≤ 3×24 jam (sesuai PP turunan UU PDP).
- **Notifikasi ke subjek terdampak**: tanpa penundaan tidak wajar, jika risiko tinggi.
- Template komunikasi disimpan di `/docs/runbooks/breach-comms.md` (post-MVP).

### 9.7 Transfer Lintas Negara

- Penyimpanan utama: region Singapore (cloud provider) — diizinkan dengan klausul SCC + risk assessment didokumentasikan.
- Tidak ada transfer ke yurisdiksi tanpa perlindungan setara tanpa consent.

---

## 10. Audit Logging

### 10.1 Skema

```sql
CREATE TABLE audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID,
  actor_id      UUID,
  actor_role    TEXT,
  action        TEXT NOT NULL,             -- e.g. JOB_CREATE, USER_LOGIN
  entity_type   TEXT,
  entity_id     UUID,
  ip            INET,
  user_agent    TEXT,
  metadata      JSONB,
  prev_hash     BYTEA,
  hash          BYTEA NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON audit_logs (tenant_id, created_at DESC);
CREATE INDEX ON audit_logs (entity_type, entity_id);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
-- read policy: tenant scoped; insert via service role only
```

### 10.2 Hash Chain

`hash = sha256(prev_hash || canonical_json(row_without_hash))`. Cron harian memverifikasi integritas dan mengarsipkan ke object storage write-once.

### 10.3 Event Wajib Dicatat

- AUTH: login (success/fail), logout, password change, 2FA enable/disable.
- USER: profile update, consent change, account delete.
- TENANT: branding change, team invite/remove, role change.
- JOB/COURSE: create, publish, delete.
- ADMIN: tenant suspend, cross-tenant access (superadmin), data export.
- SECURITY: rate-limit hit, RLS denial (sampled), CSP report.

### 10.4 Akses

- Partner/admin: lihat audit tenant sendiri (UI `/dashboard/audit`).
- Superadmin: lintas tenant; akses dicatat audit sendiri (meta-audit).

---

## 11. Secret Management

### 11.1 Penyimpanan

- **Vercel Encrypted Env** untuk production runtime.
- **1Password Vault `SSN-prod`** sebagai source of truth manusiawi.
- **Doppler / Infisical** (opsional post-MVP) untuk rotasi otomatis.
- Tidak ada secret di repo; pre-commit hook `gitleaks` + GitHub push protection.

### 11.2 Rotation Calendar

| Secret                  | Frekuensi               | Pemicu darurat                       |
| ----------------------- | ----------------------- | ------------------------------------ |
| `NEXTAUTH_SECRET`       | 12 bulan                | Suspek leak → segera (logout massal) |
| `DATABASE_URL` password | 6 bulan                 | Insider keluar                       |
| R2/S3 keys              | 6 bulan                 | Bucket policy change                 |
| OAuth client secret     | 12 bulan                | Suspek phishing                      |
| Webhook signing secret  | 6 bulan per endpoint    | Compromise partner                   |
| Sentry DSN              | – (low risk)            | Rotasi 24 bln                        |
| Encryption KMS key      | 12 bulan (CMK rotation) | Auto                                 |

Rotasi dijadwalkan di kalender ops; runbook `/docs/runbooks/secret-rotation.md` (post-MVP).

### 11.3 Akses Prod

- IAM role minimal; akses DB read-only via bastion + audit query log.
- Break-glass `prod-admin` role: 4-eyes approval (Slack `#sec-ops`), TTL 4 jam, otomatis dicabut.

---

## 12. Incident Response

### 12.1 Severity

| SEV  | Definisi                                 | Respon                                          |
| ---- | ---------------------------------------- | ----------------------------------------------- |
| SEV1 | Outage total / breach data PII confirmed | On-call ≤ 15 menit, war room, post-mortem wajib |
| SEV2 | Degradasi major / suspected breach       | ≤ 30 menit                                      |
| SEV3 | Bug serius non-data                      | ≤ 4 jam                                         |
| SEV4 | Minor                                    | Next business day                               |

### 12.2 Runbook (Ringkas)

1. **Deteksi** (alert PagerDuty / laporan).
2. **Triase** — assign IC (Incident Commander).
3. **Containment** — disable endpoint, rotate secret, isolasi tenant.
4. **Eradication** — patch, redeploy.
5. **Recovery** — verifikasi, monitor 24 jam.
6. **Post-mortem** dalam 5 hari kerja.

### 12.3 Template Post-Mortem (Blameless)

```
# Post-Mortem: <Judul Insiden>
- Tanggal/Waktu (WIB):
- Durasi:
- Severity:
- Dampak (user, tenant, data):
- Detection: how & when
- Timeline (UTC+7):
- Root cause:
- Contributing factors:
- What went well:
- What went poorly:
- Action items (owner, due, ticket):
- Lessons learned:
```

### 12.4 Komunikasi

- Internal: Slack `#incident-<id>`.
- Eksternal: status page `status.ssn.id`.
- Regulator/subjek: lihat 9.6.

---

## 13. Bug Bounty & Responsible Disclosure

### 13.1 Program (Soft Launch Post-MVP)

- Halaman publik: `/security` + `security.txt` (RFC 9116).
- Email: `security@ssn.id` (PGP key publik di halaman).
- SLA triase: 3 hari kerja; reward bracket:

| Severity                                      | Reward (IDR) |
| --------------------------------------------- | ------------ |
| Critical (RCE, mass data exfil, cross-tenant) | 15jt – 50jt  |
| High (auth bypass, IDOR sensitif)             | 5jt – 15jt   |
| Medium (stored XSS auth, SSRF terbatas)       | 1jt – 5jt    |
| Low (info disclosure minor)                   | 250rb – 1jt  |

### 13.2 Safe Harbor

Riset white-hat sesuai panduan tidak akan dipersangkakan. Larangan: DoS aktif, social engineering staff, akses data user lain selain bukti minimum.

### 13.3 `security.txt`

```
Contact: mailto:security@ssn.id
Contact: https://ssn.id/security/report
Expires: 2027-01-01T00:00:00.000Z
Preferred-Languages: id, en
Canonical: https://ssn.id/.well-known/security.txt
Policy: https://ssn.id/security
Acknowledgments: https://ssn.id/security/hall-of-fame
```

---

## 14. Secure Development Lifecycle

- **PR Template**: kolom "Security considerations" wajib diisi untuk PR yang menyentuh authz/data.
- **CI Gates**:
  - `npm audit --omit=dev` (high+ block).
  - `gitleaks` scan.
  - `semgrep` config `p/owasp-top-ten` + custom rule (lihat 14.1).
  - Unit + RLS integration test.
  - Playwright security suite (CSRF, login throttle, IDOR).
- **CodeQL** (GitHub) untuk SAST mingguan.
- **DAST**: OWASP ZAP baseline scan terhadap staging mingguan.
- **Dependency**: Renovate weekly PR, auto-merge minor untuk allowlist.
- **Container**: image base distroless Node, Trivy scan, signed (cosign).

### 14.1 Semgrep Custom Rules

```yaml
# .semgrep/no-direct-prisma.yml
rules:
  - id: no-direct-prisma-in-handler
    patterns:
      - pattern: prisma.$X.$Y(...)
    paths:
      include: ['app/api/**/route.ts', 'app/**/actions.ts']
    message: 'Akses Prisma harus via service layer dengan withTenant().'
    severity: ERROR
```

---

## 15. Cryptography Cheatsheet

| Use                                   | Algoritma                                 |
| ------------------------------------- | ----------------------------------------- |
| Password hash                         | bcrypt cost 12                            |
| Token random                          | `crypto.randomBytes(32)` base64url        |
| Token storage                         | SHA-256 hash (one-way)                    |
| Webhook signature                     | HMAC-SHA256 with rotating secret          |
| Session JWT                           | HS512 (NEXTAUTH_SECRET 64B)               |
| TLS                                   | TLS 1.2+, modern ciphers (Vercel default) |
| At rest                               | AES-256 managed (Neon/RDS); R2 SSE-S3     |
| Field-level (NIK, NPWP jika disimpan) | AES-256-GCM via libsodium, key di KMS     |

```ts
// lib/crypto/field.ts
import sodium from 'libsodium-wrappers'
export async function encryptField(plain: string, keyHex: string) {
  await sodium.ready
  const key = sodium.from_hex(keyHex)
  const nonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES)
  const ct = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(plain, null, null, nonce, key)
  return sodium.to_base64(new Uint8Array([...nonce, ...ct]))
}
```

---

## 16. Privacy by Design Checklist (Per Fitur)

- [ ] Data minimization: ambil hanya field yang benar-benar dipakai.
- [ ] Default privat: visibility default = private, opt-in publik.
- [ ] Consent: jika baru, ada flow consent & versi policy bump.
- [ ] Retensi: kebijakan retensi didefinisikan dan terhubung ke retention-sweep.
- [ ] Export & delete: included di endpoint DSR.
- [ ] Audit: event ditambah ke `audit_logs`.
- [ ] Logging: tidak ada PII di pino log (gunakan field redaction).
- [ ] RLS: tabel baru aktifkan RLS + policy + test.

```ts
// lib/log.ts
export const log = pino({
  redact: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.email'],
})
```

---

## 17. Tenant Suspension & Data Lifecycle

- Partner langgar ToS → superadmin set `tenant.status = SUSPENDED` → middleware mengembalikan halaman info; API kembali `403 TENANT_SUSPENDED`.
- 30 hari → `SCHEDULED_DELETION` → email partner.
- 30 hari berikutnya → hard delete:
  - Data tenant dihapus per tabel (cascade).
  - File R2 prefix `*/<tenantId>/*` dihapus via lifecycle rule.
  - Audit log dipertahankan teranonimisasi (legal).

---

## 18. Lampiran: Daftar Periksa Rilis Keamanan

Sebelum tag `vX.Y.0`:

- [ ] `npm audit --omit=dev` bersih (atau waiver tertulis).
- [ ] Semgrep + CodeQL bersih.
- [ ] Coverage RLS test ≥ tabel ber-tenant.
- [ ] Tidak ada secret commit (gitleaks).
- [ ] CSP report-only di staging 7 hari tanpa pelanggaran baru.
- [ ] Dependensi major upgrade direview manual.
- [ ] Update CHANGELOG bagian Security.
- [ ] Komunikasikan breaking auth changes ke partner H-14.

---

## 19. Kontak

- Security: `security@ssn.id`
- DPO: `dpo@ssn.id`
- On-call: PagerDuty schedule `ssn-security`
- Halaman publik: `https://ssn.id/security`
