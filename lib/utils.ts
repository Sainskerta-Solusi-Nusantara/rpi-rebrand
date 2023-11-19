import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind class names safely (clsx + tailwind-merge).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as Indonesian Rupiah (IDR).
 * Accepts numbers, bigints, or numeric strings.
 */
export function formatRupiah(
  value: number | bigint | string | null | undefined,
  options: { withSymbol?: boolean; fractionDigits?: number } = {},
): string {
  const { withSymbol = true, fractionDigits = 0 } = options
  const numeric =
    typeof value === 'string'
      ? Number(value)
      : typeof value === 'bigint'
        ? Number(value)
        : (value ?? 0)

  if (!Number.isFinite(numeric)) return withSymbol ? 'Rp 0' : '0'

  const formatter = new Intl.NumberFormat('id-ID', {
    style: withSymbol ? 'currency' : 'decimal',
    currency: 'IDR',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })

  return formatter.format(numeric)
}

/**
 * Format a date in Indonesian locale (e.g., 19 Mei 2026).
 */
export function formatDate(
  value: Date | string | number | null | undefined,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' },
): string {
  if (value === null || value === undefined) return '-'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('id-ID', options).format(date)
}

/**
 * Format date + time in Indonesian locale (e.g., 19 Mei 2026, 14.30).
 */
export function formatDateTime(value: Date | string | number | null | undefined): string {
  if (value === null || value === undefined) return '-'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * Convert a string to a URL-friendly slug.
 */
export function slugify(value: string): string {
  return value
    .toString()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Truncate a string with an ellipsis once it exceeds `length`.
 */
export function truncate(value: string, length: number, suffix = '…'): string {
  if (!value) return ''
  if (value.length <= length) return value
  return value.slice(0, Math.max(0, length - suffix.length)).trimEnd() + suffix
}

/**
 * Derive up to two uppercase initials from a name.
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return (parts[0]?.charAt(0) ?? '?').toUpperCase()
  const first = parts[0]?.charAt(0) ?? ''
  const last = parts[parts.length - 1]?.charAt(0) ?? ''
  return (first + last).toUpperCase()
}

/**
 * Build an absolute URL using NEXT_PUBLIC_APP_URL.
 */
export function absoluteUrl(path = ''): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  if (!path) return base
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${base.replace(/\/$/, '')}${normalized}`
}
