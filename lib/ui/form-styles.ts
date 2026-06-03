// Shared form-control class strings.
//
// These were previously copy-pasted as local `const inputClass = '…'` /
// `btnPrimary` / etc. across ~50 form components. Consolidated here as the
// single source of truth — same exact classes, so no visual change. The few
// genuinely-different variants (compact inputs, alt button padding) are exported
// under their own names so each call site keeps its precise look.
//
// (A future migration to the <Input>/<Button> atoms can replace these, but the
// atoms are styled differently and that is a separate, visually-reviewed change.)

/** Standard text input / select. */
export const inputClass =
  'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60'

/** Input variant without the disabled-state styles. */
export const inputClassNoDisabled =
  'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30'

/** Input variant without placeholder color (used for selects/non-placeholder fields). */
export const inputClassNoPlaceholder =
  'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60'

/** Input variant without shadow / placeholder / disabled extras. */
export const inputClassBare =
  'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30'

/** Small uppercase field label. */
export const labelClass = 'text-muted-foreground text-xs uppercase tracking-wide'

/** Primary (filled, brand) button. */
export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60'

/** Primary button, taller padding variant. */
export const btnPrimaryLg =
  'inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60'

/** Secondary (outline) button, taller padding. */
export const btnSecondary =
  'border-border bg-background hover:bg-muted inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium text-foreground transition disabled:cursor-not-allowed disabled:opacity-60'

/** Secondary (outline) button, tighter gap/padding. */
export const btnSecondarySm =
  'border-border bg-background hover:bg-muted inline-flex items-center justify-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium text-foreground transition disabled:cursor-not-allowed disabled:opacity-60'
