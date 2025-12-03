# FRONTEND.md — Rumah Pekerja Indonesia (RPI)

Dokumen arsitektur frontend untuk platform SaaS RPI. Stack: **Next.js 14 App Router**, **TypeScript strict**, **Tailwind CSS** (CSS-variable based), **Atomic Design**, **react-hook-form + Zod**, **Zustand** (selektif), **SWR** (live data), **Storybook + Vitest + Playwright**.

Bahasa narasi: **Bahasa Indonesia**. Bahasa kode: **English**.

---

## 1. Prinsip Arsitektur

1. **Server-First** — RSC adalah default. Client component hanya untuk interaktivitas nyata (form, animasi, listener).
2. **Composable, bukan Inheritance** — semua komponen dirakit lewat komposisi atomic.
3. **Token-Driven** — tidak ada warna/spacing hardcoded. Semua merujuk CSS variable.
4. **Type-Safe End-to-End** — Zod schema dipakai server action, form resolver, dan API contract.
5. **Accessibility First** — WCAG 2.1 AA non-negotiable.
6. **Mobile-First** — breakpoint kecil dulu, baru `md:`/`lg:` ke atas.
7. **Dynamic Theming** — setiap tenant (partner) bisa override warna brand tanpa rebuild.

---

## 2. Atomic Design — Rasional & Tree

Atomic Design dipilih karena RPI memiliki **multi-tenant** dengan banyak halaman publik + dashboard berbeda peran. Struktur atomic menjaga konsistensi visual, mempercepat onboarding developer, dan memudahkan A/B testing per layer.

```
src/components/
├── atoms/              # Unit terkecil, tidak punya logika domain
│   ├── button/
│   │   ├── Button.tsx
│   │   ├── Button.stories.tsx
│   │   ├── Button.test.tsx
│   │   └── index.ts
│   ├── input/
│   ├── textarea/
│   ├── select/
│   ├── checkbox/
│   ├── radio/
│   ├── switch/
│   ├── label/
│   ├── badge/
│   ├── avatar/
│   ├── icon/           # wrapper lucide-react
│   ├── spinner/
│   ├── skeleton/
│   ├── separator/
│   ├── kbd/
│   ├── link/
│   ├── tag/
│   ├── progress/
│   ├── tooltip-trigger/
│   └── visually-hidden/
│
├── molecules/          # Kombinasi 2-5 atoms, satu fungsi UI
│   ├── form-field/         # Label + Input + Error
│   ├── search-bar/
│   ├── filter-chip/
│   ├── price-tag/
│   ├── stat-card/
│   ├── user-menu/
│   ├── notification-item/
│   ├── breadcrumb/
│   ├── pagination/
│   ├── tab-trigger/
│   ├── dropdown-item/
│   ├── command-item/
│   ├── job-card-compact/
│   ├── course-card-compact/
│   ├── company-badge/
│   ├── salary-range/
│   ├── skill-pill/
│   ├── rating-stars/
│   ├── deadline-counter/
│   ├── verified-tick/
│   ├── empty-state/
│   ├── upload-dropzone/
│   ├── color-swatch/
│   ├── theme-toggle/
│   ├── locale-switcher/
│   ├── copy-button/
│   ├── share-button/
│   └── alert-banner/
│
├── organisms/          # Kombinasi molecules + atoms, satu blok halaman
│   ├── navbar-public/
│   ├── navbar-dashboard/
│   ├── mini-sidebar/         # collapsible icon-only, expand on hover
│   ├── footer-public/
│   ├── hero-split-screen/    # untuk homepage
│   ├── live-job-ticker/      # right panel hero
│   ├── story-testimonial/
│   ├── lms-path-timeline/
│   ├── job-list/
│   ├── job-detail-panel/
│   ├── course-list/
│   ├── course-player/
│   ├── kanban-applications/
│   ├── cv-builder/
│   ├── certificate-viewer/
│   ├── command-palette/       # Cmd+K
│   ├── tabbed-workspace/
│   ├── funnel-chart/
│   ├── kpi-grid/
│   ├── top-talent-grid/
│   ├── talent-search-panel/
│   ├── team-roster/
│   ├── branding-editor/       # logo + color picker
│   ├── audit-log-table/
│   ├── system-health-grid/
│   ├── pricing-grid/
│   ├── data-table/            # generic, supports sort/filter/pagination
│   ├── modal-shell/
│   ├── drawer-shell/
│   ├── toast-region/
│   ├── auth-form/
│   ├── apply-job-form/
│   ├── invite-team-form/
│   └── bottom-nav-mobile/
│
├── templates/          # Layout-level, tidak menerima data
│   ├── PublicLayout.tsx
│   ├── AuthLayout.tsx
│   ├── DashboardLayout.tsx
│   ├── PartnerCareerLayout.tsx
│   └── PrintLayout.tsx       # CV/Certificate
│
└── pages/              # composition entry points (di app/ Next.js)
    # halaman bukan komponen — tinggal merangkai template + organisms.
```

**Aturan import**: atom tidak boleh import molecule/organism. Molecule tidak import organism. Mencegah cyclic & menjaga lapisan tetap rapi.

---

## 3. Kontrak Komponen

### 3.1 CVA (class-variance-authority)

Semua atom dengan varian visual memakai CVA agar varian terdefinisi sebagai TypeScript discriminated union.

```ts
// atoms/button/Button.tsx
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-colors " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
    "disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "border border-border bg-background hover:bg-muted",
        ghost: "hover:bg-muted",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-sm rounded-md",
        md: "h-10 px-4 text-sm rounded-lg",
        lg: "h-12 px-6 text-base rounded-lg",
        icon: "h-10 w-10 rounded-lg",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? <Spinner size="sm" /> : null}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";
```

### 3.2 Polymorphic `asChild`

Menggunakan `@radix-ui/react-slot`. Pola ini memungkinkan `<Button asChild><Link href="/jobs">Lihat</Link></Button>` tanpa nested DOM. Wajib untuk komponen yang sering jadi link.

### 3.3 `forwardRef`

Semua atom interaktif **wajib** `forwardRef` agar bisa dipakai oleh react-hook-form, popover anchor, dan focus management.

### 3.4 Compound Components

Komponen kompleks (Tabs, Dialog, DropdownMenu, Command) memakai compound pattern:

```tsx
<Tabs defaultValue="profile">
  <Tabs.List>
    <Tabs.Trigger value="profile">Profil</Tabs.Trigger>
    <Tabs.Trigger value="security">Keamanan</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="profile">...</Tabs.Content>
</Tabs>
```

Implementasi via React Context internal + Radix primitives di bawahnya.

### 3.5 Props Naming Convention

| Pola              | Contoh                                |
| ----------------- | ------------------------------------- |
| Boolean flags     | `disabled`, `loading`, `selected`     |
| Event handlers    | `onChange`, `onSelect`, `onConfirm`   |
| Render props      | `renderItem`, `renderEmpty`           |
| Slot props        | `leftSlot`, `rightSlot`, `icon`       |
| Data shapes       | `items`, `data`, `value` / `onValueChange` |

---

## 4. State Management

### 4.1 Hirarki Default

```
1. URL state (searchParams)         ← filter, paginasi, tab aktif
2. Server state (RSC + cache)       ← data dari DB
3. Form state (react-hook-form)     ← input transient
4. Local component state (useState) ← UI ephemeral
5. Zustand store                    ← cross-tree client state (Command Palette, Toast, Theme override preview)
```

Zustand **hanya** untuk:
- Command Palette open/close + query
- Toast queue
- Branding preview state (sebelum save)
- Mini-sidebar hover/pin state
- Onboarding tour step

Tidak dipakai untuk data domain — itu tugas server.

### 4.2 Server Actions

Setiap mutation = satu server action. Pola:

```ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const ApplyJobSchema = z.object({
  jobId: z.string().uuid(),
  coverLetter: z.string().min(20).max(2000),
  cvFileId: z.string().uuid(),
});

export async function applyJob(input: z.infer<typeof ApplyJobSchema>) {
  const session = await auth();
  if (!session) return { ok: false, error: "UNAUTHORIZED" } as const;

  const parsed = ApplyJobSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID", issues: parsed.error.issues } as const;

  await db.application.create({ data: { ...parsed.data, userId: session.user.id } });
  revalidatePath("/dashboard/applications");
  return { ok: true } as const;
}
```

Server action **selalu** return discriminated union `{ ok: true, ... } | { ok: false, error: "...", ... }` — tidak pernah throw ke client.

### 4.3 Zustand Slice Pattern

```ts
// stores/command-palette.ts
import { create } from "zustand";

interface CommandPaletteState {
  open: boolean;
  query: string;
  setOpen: (open: boolean) => void;
  setQuery: (q: string) => void;
  toggle: () => void;
}

export const useCommandPalette = create<CommandPaletteState>((set) => ({
  open: false,
  query: "",
  setOpen: (open) => set({ open }),
  setQuery: (query) => set({ query }),
  toggle: () => set((s) => ({ open: !s.open })),
}));
```

---

## 5. Data Fetching

### 5.1 Server Components + `cache()`

```ts
// lib/data/jobs.ts
import { cache } from "react";
import { db } from "@/lib/db";

export const getJobById = cache(async (id: string) => {
  return db.job.findUnique({ where: { id }, include: { company: true } });
});
```

`cache()` membuat dedup di dalam satu request — bisa dipanggil dari layout & page tanpa double query.

### 5.2 SWR untuk Live Data

Live Job Ticker (homepage), notification bell, talent search hasil real-time pakai SWR + interval polling 30 detik. Untuk pure real-time (chat di future), siapkan abstraksi untuk migrate ke WebSocket/SSE.

```ts
const { data } = useSWR("/api/jobs/live", fetcher, {
  refreshInterval: 30_000,
  revalidateOnFocus: true,
});
```

### 5.3 Revalidation Strategy

| Action                    | Method                            |
| ------------------------- | --------------------------------- |
| User apply ke job         | `revalidatePath("/dashboard/applications")` |
| Partner publish job baru  | `revalidateTag("jobs-list")`      |
| Admin moderasi job        | `revalidateTag("jobs-list")` + `revalidatePath` job detail |
| Branding update           | `revalidateTag("tenant-theme:" + tenantId)` |

### 5.4 Streaming + Suspense

Halaman dashboard membungkus blok berat dengan `<Suspense fallback={<SkeletonGrid/>}>` agar shell muncul instan dan data masuk progressively.

---

## 6. Form Handling

Stack: **react-hook-form** + `@hookform/resolvers/zod` + server action.

### 6.1 Pola Form Standar

```tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { applyJob } from "./actions";

const Schema = z.object({
  coverLetter: z.string().min(20, "Minimal 20 karakter"),
  cvFileId: z.string().uuid("Pilih CV"),
});
type FormValues = z.infer<typeof Schema>;

export function ApplyJobForm({ jobId }: { jobId: string }) {
  const form = useForm<FormValues>({ resolver: zodResolver(Schema) });

  const onSubmit = form.handleSubmit(async (values) => {
    const res = await applyJob({ jobId, ...values });
    if (!res.ok) {
      if (res.error === "INVALID") {
        res.issues?.forEach((i) => form.setError(i.path[0] as any, { message: i.message }));
      }
      return;
    }
    toast.success("Lamaran terkirim");
  });

  return <form onSubmit={onSubmit}>...</form>;
}
```

### 6.2 Zod Schema Sharing

Schema didefinisikan **sekali** di `lib/schemas/` dan diimport oleh:
- Server action (validate input)
- Form resolver (validate client-side)
- API route handler (jika ada)
- Storybook story (mock data)

### 6.3 File Upload

Pakai `react-dropzone` di molecule `UploadDropzone`. Upload langsung ke S3-compatible storage via presigned URL — server action hanya simpan metadata.

---

## 7. Routing — App Router

### 7.1 Struktur

```
app/
├── (public)/                  # route group, tanpa layout dashboard
│   ├── page.tsx               # Homepage
│   ├── jobs/page.tsx
│   ├── jobs/[slug]/page.tsx
│   ├── courses/page.tsx
│   ├── courses/[slug]/page.tsx
│   ├── partners/[tenant]/page.tsx   # career page partner
│   ├── about/page.tsx
│   ├── pricing/page.tsx
│   ├── help/page.tsx
│   └── layout.tsx             # PublicLayout
│
├── (auth)/
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── forgot/page.tsx
│   └── layout.tsx             # AuthLayout
│
├── dashboard/
│   ├── layout.tsx             # DashboardLayout (mini-sidebar)
│   ├── page.tsx               # overview, role-aware
│   ├── @tabs/                 # parallel route untuk tabbed workspace
│   │   ├── default.tsx
│   │   └── [tabId]/page.tsx
│   ├── applications/page.tsx
│   ├── jobs/page.tsx
│   ├── courses/page.tsx
│   ├── certificates/page.tsx
│   ├── cv/page.tsx
│   ├── profile/page.tsx
│   └── @modal/(.)apply/[jobId]/page.tsx   # intercepting → modal
│
├── partner/                   # role: partner
│   ├── layout.tsx
│   ├── page.tsx
│   ├── jobs/page.tsx
│   ├── talent/page.tsx
│   ├── team/page.tsx
│   ├── analytics/page.tsx
│   ├── branding/page.tsx
│   └── billing/page.tsx
│
├── admin/                     # role: admin & superadmin
│   ├── layout.tsx
│   ├── page.tsx
│   ├── users/page.tsx
│   ├── tenants/page.tsx       # superadmin only — guard di layout
│   ├── moderation/page.tsx
│   ├── branding-default/page.tsx
│   ├── audit/page.tsx
│   └── health/page.tsx
│
├── api/
│   └── ...                    # webhook, presigned URL, dsb
│
├── error.tsx
├── not-found.tsx
└── global-error.tsx
```

### 7.2 Parallel Routes — Tabbed Workspace

Dashboard memakai parallel slot `@tabs`. Setiap tab adalah segmen tersendiri yang bisa load independen — user bisa buka 3-5 tab paralel tanpa kehilangan state masing-masing.

### 7.3 Intercepting Routes — Modal

`/dashboard/@modal/(.)apply/[jobId]` mencegat navigasi ke `/jobs/[id]/apply`. Refresh page = full page (deep link tetap valid).

### 7.4 Subdomain Routing

Middleware (`middleware.ts`) membaca `host` header → rewrite ke `app/(public)/partners/[tenant]/...` jika subdomain partner.

---

## 8. Dynamic Theming Engine

### 8.1 Token → CSS Variable

`tailwind.config.ts` mengonsumsi CSS variable:

```ts
colors: {
  primary: "hsl(var(--primary) / <alpha-value>)",
  "primary-foreground": "hsl(var(--primary-foreground) / <alpha-value>)",
  // ... gold, indigo, muted, border, ring, destructive, dst.
}
```

CSS variable diset di `:root` (lihat `app/globals.css`) untuk default Premium Corporate:

```css
:root {
  --primary: 213 76% 15%;          /* Navy #0A2540 */
  --gold:    42 49% 60%;            /* Gold #C9A961 */
  --indigo:  244 100% 68%;          /* Indigo #635BFF */
  --background: 0 0% 100%;
  --foreground: 213 76% 15%;
  --muted: 30 9% 96%;
  --border: 220 13% 91%;
}
```

### 8.2 ThemeProvider

Server component membaca tenant dari `headers()` → query tema → inject `<style>` di `<head>`:

```tsx
// app/layout.tsx
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getTenantFromHost();
  const theme = await getTenantTheme(tenant.id);
  return (
    <html lang="id">
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeToCssVars(theme) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### 8.3 Live Preview (Partner Branding Editor)

Halaman `/partner/branding` punya client-side preview: Zustand store menampung draft theme, `useEffect` patch `document.documentElement.style.setProperty(...)`. Saat user Save → server action persist & broadcast `revalidateTag`.

### 8.4 Dark Mode

`<html data-theme="dark">` swap blok variable kedua. ThemeProvider mengelola via `next-themes` (SSR-safe, tanpa flash).

### 8.5 Density Mode

`<html data-density="compact|comfortable">` mengubah `--row-height`, `--input-h`, `--gap-y`. Disimpan di user preference.

---

## 9. Icon System

- Library utama: **lucide-react** (tree-shakable, gaya line konsisten dengan brand premium).
- Custom icon (logo, ilustrasi mikro) sebagai React component di `components/atoms/icon/custom/`.
- Wrapper `<Icon name="briefcase" />` agar bisa di-rename library di masa depan tanpa migrasi besar.

---

## 10. Animasi

- **Framer Motion** untuk transisi makro (modal, drawer, hero parallax, story scroll).
- **CSS transition** untuk hover/focus mikro (lebih murah).
- **View Transitions API** progressive enhancement untuk navigasi same-document.
- Prinsip: durasi 150-300ms, easing `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-quint) default.
- Respect `prefers-reduced-motion`.

---

## 11. Image

- `next/image` selalu. Tidak ada `<img>` mentah kecuali di `PrintLayout`.
- Domain remote di `next.config.js` (`images.remotePatterns`).
- Format default: AVIF dengan fallback WebP.
- Placeholder: `blur` dengan base64 dari build pipeline (atau LQIP via Vercel).
- Logo tenant: SVG only, sanitized server-side sebelum render.

---

## 12. Font Loading

`next/font/google` untuk:
- **Playfair Display** (serif) — heading.
- **Inter** (sans) — body.
- **JetBrains Mono** — code, kbd.

`display: "swap"`, `preload: true` untuk Inter & Playfair, `preload: false` untuk Mono (jarang dipakai). Subset Latin + Latin-ext (untuk diakritik Indonesia tidak diperlukan tapi safe).

---

## 13. Internationalization (id / en)

Stack: **next-intl**.

- Lokal default: `id` (Bahasa Indonesia).
- Lokal sekunder: `en`.
- Route prefix: `/en/...` opsional (default tanpa prefix = id).
- Pesan disimpan di `messages/id.json` & `messages/en.json`.
- Komponen pakai `useTranslations("namespace")`.
- Server component bisa `getTranslations()`.
- Format tanggal: `Intl.DateTimeFormat("id-ID", { ... })`.
- Mata uang: IDR default — utility `formatRupiah(amount)`.

---

## 14. Aksesibilitas (WCAG 2.1 AA)

Checklist build-time + runtime:

| Item                                       | Cara                                  |
| ------------------------------------------ | ------------------------------------- |
| Kontras teks ≥ 4.5:1                       | Token color sudah lulus, ESLint plugin |
| Focus ring visible                         | `:focus-visible:ring-2 ring-ring`     |
| Skip link                                  | `<a href="#main" class="sr-only focus:not-sr-only">` |
| Landmark roles                             | `<header>`, `<nav>`, `<main>`, `<footer>` |
| Form label                                 | Semua input wrap `<FormField>` (label wajib) |
| Error association                          | `aria-invalid` + `aria-describedby`   |
| Keyboard nav                               | Roving tabindex untuk menu/listbox    |
| Live region                                | Toast region `aria-live="polite"`     |
| Modal trap focus                           | Radix Dialog                          |
| Reduced motion                             | Wrap framer animations                |
| Screen reader text                         | `<VisuallyHidden>` atom               |

Tooling: `eslint-plugin-jsx-a11y`, `@axe-core/playwright` di E2E.

---

## 15. Error Boundary & Suspense

### 15.1 Hierarki Error

```
app/global-error.tsx     ← catastrophic (root)
app/error.tsx            ← per route segment
app/(group)/error.tsx    ← per group
app/[feature]/error.tsx  ← per feature
```

Setiap `error.tsx` adalah client component, menampilkan komponen `<ErrorState>` dengan tombol "Coba lagi" (`reset()`) & "Kembali ke beranda".

### 15.2 Suspense

Pasang di:
- Dashboard widget yang lambat (analytics chart).
- Live ticker.
- LMS player metadata.

Fallback selalu pakai `<Skeleton>` setara dimensi konten (tidak loncat layout).

---

## 16. Testing

### 16.1 Storybook

- Setiap atom/molecule wajib punya `.stories.tsx`.
- Organisms punya story dengan mock data (MSW handler).
- Addons: a11y, viewport, interactions, controls.
- Chromatic untuk visual regression (opsional, gating tahap 2).

### 16.2 Unit — Vitest + Testing Library

```ts
import { render, screen } from "@testing-library/react";
import { Button } from "./Button";

test("renders label and handles click", async () => {
  const onClick = vi.fn();
  render(<Button onClick={onClick}>Kirim</Button>);
  await userEvent.click(screen.getByRole("button", { name: /kirim/i }));
  expect(onClick).toHaveBeenCalledOnce();
});
```

Target coverage: 80% untuk `lib/` dan `components/atoms`, 60% untuk `components/molecules`.

### 16.3 E2E — Playwright

Skenario kritis:
1. Visitor → cari job → apply → terlihat di Kanban.
2. Partner → post job → moderasi admin → publish → tampil di list.
3. Partner → upload logo & ubah warna → preview live → save → tenant baru render.
4. Admin → suspend user → audit log tertulis.
5. Cmd+K navigation cross-segment.

### 16.4 CI

`npm run typecheck && npm run lint && npm test && npm run test:e2e` di GitHub Actions, per PR.

---

## 17. Konvensi Kode

- **File**: kebab-case folder, PascalCase komponen file (`Button.tsx`), camelCase util.
- **Export**: named export untuk komponen, default hanya untuk page/layout/route Next.js.
- **Import order**: react/next → external lib → internal alias → relative → CSS.
- **No barrel re-export berlebihan** — barrel hanya di level folder feature.
- **Strict mode TS**: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.

---

## 18. Performance Budget

| Metric                           | Target           |
| -------------------------------- | ---------------- |
| LCP (homepage)                   | ≤ 2.0 s          |
| INP                              | ≤ 200 ms         |
| CLS                              | ≤ 0.05           |
| JS shipped homepage              | ≤ 120 KB gzip    |
| Initial CSS                      | ≤ 30 KB gzip     |
| Image LCP                        | < 100 KB optimized |

Diukur via Lighthouse CI + Vercel Analytics.

---

## 19. Build & Deploy

- Build target: Node 20.
- Output: standalone (untuk Docker / self-host) + Vercel (default).
- Env validation: `@t3-oss/env-nextjs` — gagal build kalau env hilang.
- Image optimization: Vercel built-in / Sharp untuk self-host.

---

## 20. Roadmap Frontend

| Fase | Fokus                                                                 |
| ---- | --------------------------------------------------------------------- |
| 1    | Atomic foundation (atoms + molecules + theming engine)                |
| 2    | Public site (homepage, jobs, courses, partner career)                 |
| 3    | User dashboard (apply, kanban, LMS, CV builder)                       |
| 4    | Partner dashboard (jobs mgmt, talent search, branding)                |
| 5    | Admin/SuperAdmin (moderation, tenant mgmt, audit, health)             |
| 6    | Storybook publik + Chromatic + perf hardening                         |

---

Akhir dokumen FRONTEND.md.
