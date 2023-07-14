/**
 * Tenant context helpers.
 *
 * The Postgres RLS policies in prisma/migrations/manual/002_rls_policies.sql
 * read three custom GUCs to decide visibility:
 *
 *   app.current_tenant_id
 *   app.current_user_id
 *   app.is_superadmin   ('true' or 'false', stored as text)
 *
 * `withTenantContext` opens a Prisma `$transaction`, applies the GUCs via
 * `SET LOCAL` (scoped to that transaction only, so they reset cleanly after
 * commit/rollback even when the pooled connection is reused), and then runs
 * the caller's callback with a transactional client.
 *
 * Usage:
 *   const jobs = await withTenantContext(
 *     { tenantId, userId, isSuperadmin: false },
 *     (tx) => tx.job.findMany()
 *   );
 */

import { headers } from "next/headers";
import type { Prisma } from "@prisma/client";
import { prisma } from "./db";

export type TenantContext = {
  tenantId: string | null;
  userId: string | null;
  isSuperadmin?: boolean;
};

type TxClient = Omit<
  Prisma.TransactionClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/**
 * Escape a single value for SET LOCAL. We rely on Postgres' standard
 * single-quote escaping (double the quote).
 */
function quote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/**
 * Run `fn` inside a transaction with RLS GUCs configured.
 *
 * Null tenant/user are encoded as the empty string; the helper functions in
 * 001_enable_rls.sql treat empty as missing.
 */
export async function withTenantContext<T>(
  ctx: TenantContext,
  fn: (tx: TxClient) => Promise<T>
): Promise<T> {
  const tenantId = ctx.tenantId ?? "";
  const userId = ctx.userId ?? "";
  const isSuperadmin = ctx.isSuperadmin === true ? "true" : "false";

  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `SELECT set_config('app.current_tenant_id', ${quote(tenantId)}, true)`
    );
    await tx.$executeRawUnsafe(
      `SELECT set_config('app.current_user_id', ${quote(userId)}, true)`
    );
    await tx.$executeRawUnsafe(
      `SELECT set_config('app.is_superadmin', ${quote(isSuperadmin)}, true)`
    );
    return fn(tx);
  });
}

/**
 * Convenience overload: run `fn` with superadmin privileges (bypasses RLS).
 * Use sparingly - only for system jobs, migrations, cross-tenant analytics.
 */
export async function withSuperadminContext<T>(
  fn: (tx: TxClient) => Promise<T>
): Promise<T> {
  return withTenantContext({ tenantId: null, userId: null, isSuperadmin: true }, fn);
}

/**
 * Resolve the active tenant slug from request headers.
 *
 * Subdomain routing MVP: middleware writes the resolved slug into the
 * `x-tenant-slug` header. We read it here from next/headers so server
 * components and route handlers don't have to thread the value manually.
 *
 * Returns null when the request is on the apex domain (no tenant context).
 */
export function getCurrentTenantSlug(): string | null {
  try {
    const h = headers();
    const slug = h.get("x-tenant-slug");
    return slug && slug.length > 0 ? slug : null;
  } catch {
    // headers() throws if called outside a request scope - return null.
    return null;
  }
}

/**
 * Look up a tenant by slug. Returns `null` when not found.
 *
 * This runs as superadmin context because the resolver itself must be able
 * to see every tenant row before any policy can apply.
 */
export async function resolveTenantBySlug(slug: string) {
  if (!slug) return null;
  return withSuperadminContext((tx) =>
    tx.tenant.findUnique({
      where: { slug },
      include: { branding: true },
    })
  );
}

/**
 * Look up a tenant by custom domain (e.g. careers.telkom.co.id).
 */
export async function resolveTenantByDomain(domain: string) {
  if (!domain) return null;
  return withSuperadminContext((tx) =>
    tx.tenant.findUnique({
      where: { customDomain: domain },
      include: { branding: true },
    })
  );
}
