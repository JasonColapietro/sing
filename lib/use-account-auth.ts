"use client";

import { createContext, useContext } from "react";

/**
 * The visitor's account state, or a static signed-out answer when there is no
 * provider.
 *
 * ClerkProvider is only mounted when the keys are real
 * (components/account/clerk-shell.tsx), and Clerk's hooks throw outside it.
 * Every consumer here already renders nothing for a signed-out visitor, so the
 * honest substitute is simply "loaded, signed out", which is this context's
 * default.
 *
 * This module deliberately imports nothing from @clerk/nextjs. The nav, the
 * account backup and the save prompt all read auth through here, and a static
 * Clerk import in any of them shipped Clerk's whole React SDK (about 42 KB
 * gzipped) to every page, including the production build where accounts are
 * off and no account UI can ever render. The one module that calls Clerk's
 * useAuth is components/account/clerk-auth-bridge.tsx, which clerk-shell mounts
 * inside ClerkProvider and which feeds this context.
 */
export interface AccountAuth {
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
}

const SIGNED_OUT: AccountAuth = {
  isLoaded: true,
  isSignedIn: false,
  userId: null,
};

export const AccountAuthContext = createContext<AccountAuth>(SIGNED_OUT);

export function useAccountAuth(): AccountAuth {
  return useContext(AccountAuthContext);
}
