// Public alias for the tenant job form. The partner "create job" page imports
// `JobForm` from this path; the actual implementation lives in
// `tenant-job-form.tsx` (shared with the tenant dashboard). Keeping a thin
// re-export avoids duplicating the form and keeps both call sites in sync.
export { JobForm, type JobFormInitial } from './tenant-job-form'
export { JobForm as default } from './tenant-job-form'
