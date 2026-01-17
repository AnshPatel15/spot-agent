 'use client';

/**
 * Providers component - now just a simple wrapper
 * Previously used for NextAuth SessionProvider, but we've switched to custom auth
 */
export function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}