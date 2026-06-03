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
import { formsNotif } from './dictionaries/forms-notif'
import { formsTables } from './dictionaries/forms-tables'
import { formsLearning } from './dictionaries/forms-learning'
import { formsInsights } from './dictionaries/forms-insights'
import { formsMisc4 } from './dictionaries/forms-misc4'
import { formsTenantAdmin2 } from './dictionaries/forms-tenantadmin2'
import { formsMisc3 } from './dictionaries/forms-misc3'
import { formsMarketing2 } from './dictionaries/forms-marketing2'
import { pagesTenant2 } from './dictionaries/pages-tenant2'
import { pagesPublicMisc } from './dictionaries/pages-publicmisc'
import { pagesCareers } from './dictionaries/pages-careers'
import { pagesDash } from './dictionaries/pages-dash'
import { pagesRoot } from './dictionaries/pages-root'
import { pagesTenant4 } from './dictionaries/pages-tenant4'
import { pagesPress } from './dictionaries/pages-press'
import { pagesTenant3 } from './dictionaries/pages-tenant3'
import { pagesTenant1 } from './dictionaries/pages-tenant1'

import { pagesBlog } from './dictionaries/pages-blog'
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
    formsNotif: formsNotif.id,
    formsTables: formsTables.id,
    formsLearning: formsLearning.id,
    formsInsights: formsInsights.id,
    formsMisc4: formsMisc4.id,
    formsTenantAdmin2: formsTenantAdmin2.id,
    formsMisc3: formsMisc3.id,
    formsMarketing2: formsMarketing2.id,
    pagesTenant2: pagesTenant2.id,
    pagesDash: pagesDash.id,
    pagesRoot: pagesRoot.id,
    pagesTenant4: pagesTenant4.id,
    pagesPress: pagesPress.id,
    pagesPublicMisc: pagesPublicMisc.id,
    pagesCareers: pagesCareers.id,
    pagesTenant1: pagesTenant1.id,
    pagesBlog: pagesBlog.id,
    pagesTenant3: pagesTenant3.id,
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
    formsNotif: formsNotif.en,
    formsTables: formsTables.en,
    formsLearning: formsLearning.en,
    formsInsights: formsInsights.en,
    formsMisc4: formsMisc4.en,
    formsTenantAdmin2: formsTenantAdmin2.en,
    formsMisc3: formsMisc3.en,
    formsMarketing2: formsMarketing2.en,
    pagesTenant2: pagesTenant2.en,
    pagesDash: pagesDash.en,
    pagesRoot: pagesRoot.en,
    pagesTenant4: pagesTenant4.en,
    pagesPress: pagesPress.en,
    pagesPublicMisc: pagesPublicMisc.en,
    pagesCareers: pagesCareers.en,
    pagesTenant1: pagesTenant1.en,
    pagesBlog: pagesBlog.en,
    pagesTenant3: pagesTenant3.en,
  },
} as const

export type Dictionary = (typeof dictionary)[Locale]
