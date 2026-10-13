import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { accountsReady } from "@/lib/accounts";
import { ClerkAuthBridge } from "./clerk-auth-bridge";

/**
 * Clerk names the sign-in card after the *application*, and Vercel's
 * marketplace install auto-generated that name, so the card greeted singers
 * with "Sign in to clerk-canary-button". Renaming it in the Clerk dashboard
 * would also work, but it is a setting in someone else's console that nothing
 * in this repo can hold in place. Pinning the strings here means the product
 * name cannot drift out from under the UI again.
 */
const CLERK_COPY = {
  signIn: { start: { title: "Sign in to Suede Sing" } },
  signUp: { start: { title: "Create your Suede Sing account" } },
};

/**
 * The site's account provider: ClerkProvider plus the bridge that feeds
 * useAccountAuth, or the page untouched when accounts are off.
 *
 * Mounting ClerkProvider is what pulls clerk-js down from Clerk's CDN: about
 * 1.2MB across a dozen requests, plus __client_uat cookies scoped to
 * .suedeai.ai, on every page load. With development keys none of that can do
 * anything, since every account surface is hidden by accountsReady(), so the
 * render is skipped.
 *
 * Skipping the render does not skip the download, though. Next loads every
 * client component the root layout's imports reach on every page, rendered or
 * not, and the @clerk/nextjs import above reaches all of Clerk's client
 * boundaries (the build before the nav split listed them as the layout's
 * client references). That is why this is a module of its own:
 * clerk-shell-off.tsx is a Clerk-free stand-in with the same default export,
 * so a build with accounts off resolves this import to it and leaves Clerk
 * out of the page entirely: next.config.ts aliases it, for Turbopack and
 * webpack alike, whenever accountsReady() is false at build time. With live
 * keys this file is what the layout loads, and it behaves exactly as the
 * inline provider did.
 */
export default function ClerkShell({ children }: { children: ReactNode }) {
  if (!accountsReady()) return <>{children}</>;
  return (
    // Inside <body>, per Clerk Core 3; wrapping <html> is the old shape and
    // breaks. It only reads the session: every page renders for a signed-out
    // visitor, and the sign-in-on-use gate lives in lib/account-gate.ts.
    <ClerkProvider localization={CLERK_COPY}>
      <ClerkAuthBridge>{children}</ClerkAuthBridge>
    </ClerkProvider>
  );
}
