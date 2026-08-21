"use client";

import { useAuth } from "@clerk/nextjs";
import { accountsReady } from "./accounts";

/**
 * Clerk's useAuth, or a static signed-out answer when there is no provider.
 *
 * ClerkProvider is only mounted when the keys are real, and Clerk's hooks throw
 * outside it. Every consumer here already renders nothing for a signed-out
 * visitor, so the honest substitute is simply "loaded, signed out".
 *
 * The implementation is chosen once at module load rather than inside a
 * component. accountsReady() is a build constant, so a build contains exactly
 * one of these two functions and the call site stays a single unconditional
 * hook call - hook order cannot differ between renders, and this does not trip
 * rules-of-hooks the way an `if` around useAuth() would.
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

export const useAccountAuth: () => AccountAuth = accountsReady()
  ? (useAuth as unknown as () => AccountAuth)
  : () => SIGNED_OUT;
