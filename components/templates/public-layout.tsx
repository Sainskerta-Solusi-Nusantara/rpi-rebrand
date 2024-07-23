import * as React from 'react'
import { NavbarPublic, type NavbarPublicTenantInfo } from '@/components/organisms/navbar-public'
import { FooterPublic } from '@/components/organisms/footer-public'

export interface PublicLayoutProps {
  children: React.ReactNode
  tenantInfo?: NavbarPublicTenantInfo
  navLinks?: Array<{ href: string; label: string }>
  hideFooter?: boolean
}

/**
 * Server-rendered shell for marketing / unauthenticated pages.
 * Pairs `NavbarPublic` and `FooterPublic` around the page content.
 */
export function PublicLayout({ children, tenantInfo, navLinks, hideFooter }: PublicLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <NavbarPublic tenant={tenantInfo} links={navLinks} />
      <main className="flex-1">{children}</main>
      {hideFooter ? null : <FooterPublic tenantName={tenantInfo?.name} />}
    </div>
  )
}

export default PublicLayout
