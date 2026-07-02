/**
 * Generates an OpenAPI 3.0 specification document for a given tenant.
 *
 * The spec documents the tenant-scoped REST endpoints that today accept a
 * Tenant API Key (Bearer `rpi_t_…`) — currently the audit export endpoint
 * is fully API-key compatible (read scope). The CSV template endpoints are
 * included as a preview of the planned surface; they still require a
 * session today but follow the same routing shape.
 *
 * The spec is intentionally hand-rolled (no zod-to-openapi / swagger-jsdoc
 * dependency) so we can ship it without adding third-party packages.
 */

export type OpenApiSpec = {
  openapi: string
  info: {
    title: string
    version: string
    description: string
    contact?: { name?: string; url?: string }
  }
  servers: Array<{ url: string; description?: string }>
  tags: Array<{ name: string; description?: string }>
  components: {
    securitySchemes: Record<string, unknown>
    schemas: Record<string, unknown>
  }
  paths: Record<string, Record<string, unknown>>
}

export function buildOpenApiSpec({
  slug,
  baseUrl,
}: {
  slug: string
  baseUrl: string
}): OpenApiSpec {
  const normalisedBase = baseUrl.replace(/\/+$/, '')

  return {
    openapi: '3.0.3',
    info: {
      title: `SSN Pekerja — Tenant API (${slug})`,
      version: '1.0.0',
      description:
        'API tenant SSN Pekerja. Gunakan Tenant API Key dengan ' +
        'format `rpi_t_<token>` dikirim sebagai header `Authorization: Bearer <key>`. ' +
        'Kunci dibatasi pada tenant penerbit; permintaan ke slug tenant lain ditolak.',
      contact: {
        name: 'SSN Pekerja',
        url: `${normalisedBase}/dashboard/tenants/${slug}/api-keys`,
      },
    },
    servers: [
      {
        url: normalisedBase,
        description: 'Server saat ini',
      },
    ],
    tags: [
      { name: 'Audit', description: 'Akses log aktivitas tenant.' },
      { name: 'Jobs', description: 'Lowongan pekerjaan tenant.' },
      { name: 'Kursus', description: 'Kursus / modul pelatihan tenant.' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'rpi_t_<token>',
          description:
            'Kirim header `Authorization: Bearer rpi_t_<token>`. Kunci dibuat ' +
            'pada halaman API Keys dan terikat ke satu tenant.',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          description: 'Bentuk error standar untuk semua endpoint tenant.',
          required: ['error'],
          properties: {
            error: {
              type: 'string',
              description: 'Kode error mesin (mis. INVALID_TOKEN, TENANT_MISMATCH).',
              example: 'INVALID_TOKEN',
            },
          },
        },
        AuditLogEntry: {
          type: 'object',
          required: ['id', 'createdAt', 'action', 'resource'],
          properties: {
            id: { type: 'string', format: 'cuid', example: 'clx1abc...' },
            createdAt: { type: 'string', format: 'date-time' },
            action: {
              type: 'string',
              enum: [
                'CREATE',
                'UPDATE',
                'DELETE',
                'LOGIN',
                'LOGOUT',
                'INVITE',
                'REVOKE',
                'PERMISSION_CHANGE',
              ],
            },
            resource: { type: 'string', example: 'tenant.api_key' },
            resourceId: { type: 'string', nullable: true },
            actorEmail: { type: 'string', nullable: true, format: 'email' },
            actorName: { type: 'string', nullable: true },
            ip: { type: 'string', nullable: true },
            userAgent: { type: 'string', nullable: true },
            metadata: {
              type: 'object',
              nullable: true,
              additionalProperties: true,
            },
          },
        },
        PaginatedResponse: {
          type: 'object',
          required: ['items', 'total', 'page', 'pageSize'],
          properties: {
            items: {
              type: 'array',
              items: { type: 'object', additionalProperties: true },
            },
            total: { type: 'integer', minimum: 0 },
            page: { type: 'integer', minimum: 1 },
            pageSize: { type: 'integer', minimum: 1 },
          },
        },
      },
    },
    paths: {
      [`/api/tenants/${slug}/audit/export`]: {
        get: {
          tags: ['Audit'],
          summary: 'Ekspor log audit (CSV)',
          description:
            'Mengunduh log audit tenant dalam format CSV. Mendukung filter ' +
            'berdasarkan action, resource, actor, dan rentang tanggal. Batas 10.000 baris ' +
            'per permintaan. Memerlukan scope `read`.',
          security: [{ bearerAuth: ['read'] }],
          parameters: [
            {
              name: 'slug',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              example: slug,
            },
            {
              name: 'action',
              in: 'query',
              required: false,
              schema: {
                type: 'string',
                enum: [
                  'CREATE',
                  'UPDATE',
                  'DELETE',
                  'LOGIN',
                  'LOGOUT',
                  'INVITE',
                  'REVOKE',
                  'PERMISSION_CHANGE',
                ],
              },
            },
            {
              name: 'resource',
              in: 'query',
              required: false,
              schema: { type: 'string' },
            },
            {
              name: 'actor',
              in: 'query',
              required: false,
              description: 'Email pelaku audit.',
              schema: { type: 'string', format: 'email' },
            },
            {
              name: 'from',
              in: 'query',
              required: false,
              schema: { type: 'string', format: 'date' },
            },
            {
              name: 'to',
              in: 'query',
              required: false,
              schema: { type: 'string', format: 'date' },
            },
          ],
          responses: {
            '200': {
              description: 'File CSV dengan header dan baris log audit.',
              content: {
                'text/csv': {
                  schema: { type: 'string', format: 'binary' },
                },
              },
            },
            '401': {
              description: 'Token tidak ada / tidak valid.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '403': {
              description:
                'Scope tidak mencukupi atau token milik tenant lain.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '404': {
              description: 'Tenant tidak ditemukan.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      [`/api/tenants/${slug}/jobs/template`]: {
        get: {
          tags: ['Jobs'],
          summary: 'Unduh template CSV impor lowongan',
          description:
            'Mengembalikan file CSV berisi header dan satu baris contoh untuk ' +
            'fitur impor massal lowongan. Saat ini memerlukan sesi pengguna dengan ' +
            'permission `job.create` (dukungan API key direncanakan).',
          security: [{ bearerAuth: ['read'] }],
          parameters: [
            {
              name: 'slug',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              example: slug,
            },
          ],
          responses: {
            '200': {
              description: 'File CSV template.',
              content: {
                'text/csv': {
                  schema: { type: 'string', format: 'binary' },
                },
              },
            },
            '401': {
              description: 'Belum terotentikasi.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '403': {
              description: 'Tidak memiliki izin job.create.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '404': {
              description: 'Tenant tidak ditemukan.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      [`/api/tenants/${slug}/kursus/template`]: {
        get: {
          tags: ['Kursus'],
          summary: 'Unduh template CSV impor kursus',
          description:
            'Mengembalikan file CSV berisi header dan satu baris contoh untuk ' +
            'fitur impor massal kursus. Saat ini memerlukan sesi pengguna dengan ' +
            'permission `course.create` (dukungan API key direncanakan).',
          security: [{ bearerAuth: ['read'] }],
          parameters: [
            {
              name: 'slug',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              example: slug,
            },
          ],
          responses: {
            '200': {
              description: 'File CSV template.',
              content: {
                'text/csv': {
                  schema: { type: 'string', format: 'binary' },
                },
              },
            },
            '401': {
              description: 'Belum terotentikasi.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '403': {
              description: 'Tidak memiliki izin course.create.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '404': {
              description: 'Tenant tidak ditemukan.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
    },
  }
}
