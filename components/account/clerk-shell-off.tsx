import type { ReactNode } from "react";

/**
 * The account provider for a build with accounts off: the page, untouched.
 *
 * Same default export as clerk-shell.tsx and no Clerk import, so a build
 * where accountsReady() is false can resolve "@/components/account/clerk-shell"
 * here and keep Clerk's React SDK out of every page. Nothing below it reads
 * Clerk directly: useAccountAuth answers "signed out" without a provider, and
 * every account control is hidden by accountsReady().
 */
export default function ClerkShell({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
