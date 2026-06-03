// pagesRoot namespace — root-level app pages (loading skeleton, status incident detail).
// Accessed as `t.pagesRoot.*`.
//
// Interpolation tokens like `{x}` are substituted by callers via
// .replace('{x}', String(value)).

export const pagesRoot = {
  id: {
    loading: {
      srOnly: 'Memuat…',
    },
    statusIncident: {
      backToStatus: 'Kembali ke status',
      startedAt: 'Dimulai: ',
      resolvedAt: 'Diselesaikan: ',
      affectedServices: 'Layanan terdampak: ',
      timelineHeading: 'Linimasa pembaruan',
      noUpdates: 'Belum ada pembaruan.',
      severity: {
        minor: 'Ringan',
        major: 'Berat',
        critical: 'Kritis',
      },
      incidentStatus: {
        investigating: 'Investigasi',
        identified: 'Teridentifikasi',
        monitoring: 'Pemantauan',
        resolved: 'Selesai',
      },
    },
  },
  en: {
    loading: {
      srOnly: 'Loading…',
    },
    statusIncident: {
      backToStatus: 'Back to status',
      startedAt: 'Started: ',
      resolvedAt: 'Resolved: ',
      affectedServices: 'Affected services: ',
      timelineHeading: 'Update timeline',
      noUpdates: 'No updates yet.',
      severity: {
        minor: 'Minor',
        major: 'Major',
        critical: 'Critical',
      },
      incidentStatus: {
        investigating: 'Investigating',
        identified: 'Identified',
        monitoring: 'Monitoring',
        resolved: 'Resolved',
      },
    },
  },
} as const
