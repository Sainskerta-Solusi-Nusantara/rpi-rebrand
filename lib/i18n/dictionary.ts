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
import { formsResume } from './dictionaries/forms-resume'
import { formsTenantImport } from './dictionaries/forms-tenantimport'
import { formsProfile } from './dictionaries/forms-profile'
import { formsInterviewSched } from './dictionaries/forms-interviewsched'
import { formsTenantJob } from './dictionaries/forms-tenantjob'
import { formsFeatureFlag } from './dictionaries/forms-featureflag'
import { formsAccount } from './dictionaries/forms-account'

import { formsMarketing } from './dictionaries/forms-marketing'
import { formsBulk } from './dictionaries/forms-bulk'
import { formsQuizEditors } from './dictionaries/forms-quizeditors'
import { formsTenantMisc } from './dictionaries/forms-tenantmisc'
import { formsTenantIntegration } from './dictionaries/forms-tenantintegration'


import { formsTenantCourse } from './dictionaries/forms-tenantcourse'

import { formsEnterprise } from './dictionaries/forms-enterprise'
import { formsPublicSections } from './dictionaries/forms-publicsections'
import { formsApplications } from './dictionaries/forms-applications'
import { formsMisc1 } from './dictionaries/forms-misc1'
import { formsSavedSearch } from './dictionaries/forms-savedsearch'
import { formsMisc2 } from './dictionaries/forms-misc2'
import { formsInterviewPipe } from './dictionaries/forms-interviewpipe'

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
    formsResume: formsResume.id,
    formsTenantImport: formsTenantImport.id,
    formsProfile: formsProfile.id,
    formsTenantJob: formsTenantJob.id,
    formsFeatureFlag: formsFeatureFlag.id,
    formsAccount: formsAccount.id,
    
    formsMarketing: formsMarketing.id,
    formsBulk: formsBulk.id,
    formsQuizEditors: formsQuizEditors.id,
    formsEnterprise: formsEnterprise.id,
    formsTenantMisc: formsTenantMisc.id,
    formsTenantIntegration: formsTenantIntegration.id,
    formsPublicSections: formsPublicSections.id,
    formsTenantCourse: formsTenantCourse.id,
    formsMisc1: formsMisc1.id,
    formsSavedSearch: formsSavedSearch.id,
    formsInterviewSched: formsInterviewSched.id,
    formsMisc2: formsMisc2.id,
    formsApplications: formsApplications.id,
    formsInterviewPipe: formsInterviewPipe.id,
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
    formsResume: formsResume.en,
    formsTenantImport: formsTenantImport.en,
    formsProfile: formsProfile.en,
    formsTenantJob: formsTenantJob.en,
    formsFeatureFlag: formsFeatureFlag.en,
    formsAccount: formsAccount.en,
    
    formsMarketing: formsMarketing.en,
    formsBulk: formsBulk.en,
    formsQuizEditors: formsQuizEditors.en,
    formsEnterprise: formsEnterprise.en,
    formsTenantMisc: formsTenantMisc.en,
    formsTenantIntegration: formsTenantIntegration.en,
    formsPublicSections: formsPublicSections.en,
    formsTenantCourse: formsTenantCourse.en,
    formsMisc1: formsMisc1.en,
    formsSavedSearch: formsSavedSearch.en,
    formsInterviewSched: formsInterviewSched.en,
    formsMisc2: formsMisc2.en,
    formsApplications: formsApplications.en,
    formsInterviewPipe: formsInterviewPipe.en,
  },
} as const

export type Dictionary = (typeof dictionary)[Locale]
