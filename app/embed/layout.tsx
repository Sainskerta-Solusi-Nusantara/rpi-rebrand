/**
 * Minimal layout for `/embed/*` routes.
 *
 * Why a separate layout?
 *   - The `/embed/[slug]/jobs` page is loaded inside iframes on third-party
 *     websites. It MUST NOT inherit the public layout's navbar/footer.
 *   - It also MUST NOT inherit dashboard auth gates or SessionProvider.
 *
 * This layout is intentionally a passthrough. The root `app/layout.tsx`
 * already provides <html><body>, font variables, globals.css, and the
 * AppProviders shell — we only need to render children here.
 *
 * If we needed to break out of root providers (e.g. SessionProvider) we'd
 * have to use route handlers or a parallel app, but AppProviders today is
 * only theming + i18n, which is harmless for the embed.
 */

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
