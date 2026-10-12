"use client";

import { useMemo, type ReactNode } from "react";
import { useAuth } from "@clerk/nextjs";
import { AccountAuthContext } from "@/lib/use-account-auth";

/**
 * The only module that reads Clerk's session hook.
 *
 * Mounted by components/account/clerk-shell.tsx inside ClerkProvider, and
 * only when accounts are live on this deployment. Everything else reads the
 * answer through useAccountAuth, so the nav, the save prompt and the account
 * backup carry no Clerk import of their own (see lib/use-account-auth.ts).
 * This module and the provider in clerk-shell.tsx are the remaining static
 * Clerk imports.
 */
export function ClerkAuthBridge({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const value = useMemo(
    () => ({
      isLoaded,
      isSignedIn: Boolean(isSignedIn),
      userId: userId ?? null,
    }),
    [isLoaded, isSignedIn, userId],
  );
  return (
    <AccountAuthContext.Provider value={value}>
      {children}
    </AccountAuthContext.Provider>
  );
}

export default ClerkAuthBridge;
