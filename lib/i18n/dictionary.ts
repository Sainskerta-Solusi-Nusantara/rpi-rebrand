// Aggregated translation dictionary.
//
// Namespaces are split into separate files under ./dictionaries so multiple
// authors can edit in parallel without merge conflicts:
//   - home.ts        homepage (legacy keys — kept flat at root for backward compat)
//   - common.ts      shared UI strings (actions, status, errors, language)
//   - auth.ts        auth flows (login, register, verify, reset, 2FA, onboarding)
//   - dashboard.ts   dashboard pages (nav, applications, security, settings)
//   - publicpages.ts public marketing (pricing, tentang, contact, jobs, courses)
//
// All keys from `home.ts` are flattened at the root of each locale to preserve
// existing callers (`t.nav.jobs`, `t.hero.headlineLine1`, etc.).
// New code should use the namespaced form: `t.common.actions.save`, `t.auth.login.title`.

import { home } from './dictionaries/home'
import { common } from './dictionaries/common'
import { auth } from './dictionaries/auth'
import { dashboard } from './dictionaries/dashboard'
import { publicpages } from './dictionaries/publicpages'
import { partner } from './dictionaries/partner'
import { admin } from './dictionaries/admin'
import { formsStatus } from './dictionaries/forms-status'
import { formsContent } from './dictionaries/forms-content'
import { formsEditor } from './dictionaries/forms-editor'
import { formsActions } from './dictionaries/forms-actions'

export type Locale = 'id' | 'en'

export const locales: Locale[] = ['id', 'en']
export const defaultLocale: Locale = 'id'

export const dictionary = {
  id: {
    ...home.id,
    common: { ...home.id.common, ...common.id },
    auth: auth.id,
    dashboard: dashboard.id,
    public: publicpages.id,
    partner: partner.id,
    admin: admin.id,
    formsStatus: formsStatus.id,
    formsContent: formsContent.id,
    formsEditor: formsEditor.id,
    formsActions: formsActions.id,
  },
  en: {
    ...home.en,
    common: { ...home.en.common, ...common.en },
    auth: auth.en,
    dashboard: dashboard.en,
    public: publicpages.en,
    partner: partner.en,
    admin: admin.en,
    formsStatus: formsStatus.en,
    formsContent: formsContent.en,
    formsEditor: formsEditor.en,
    formsActions: formsActions.en,
  },
} as const

export type Dictionary = (typeof dictionary)[Locale]
