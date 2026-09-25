import { accountsReady } from "./accounts";

/**
 * Sign-in is required to *use* the practice tools, never to see them.
 *
 * Every page, title and lesson stays visible to anyone. The gate sits at the
 * two points every practice action passes through, opening the microphone and
 * starting audio (lib/audio/mic.ts and lib/audio/context.ts), so pressing
 * start, play or enable is what asks a signed-out visitor to sign in, and they
 * come straight back to the page they were on.
 *
 * The famous-singer range pages are exempt, as is everything while accounts
 * are not configured on this deployment (see accountsReady): with development
 * keys nobody can sign in on the production domain, so a gate there would lock
 * every visitor out of every tool.
 */

const OPEN_PATHS = ["/singers", "/sign-in", "/sign-up"];

interface ClerkGlobal {
  loaded?: boolean;
  user?: unknown;
}

function clerk(): ClerkGlobal | undefined {
  return (window as unknown as { Clerk?: ClerkGlobal }).Clerk;
}

/** True when this visitor may use the tools right now. */
export function canUseTools(): boolean {
  if (typeof window === "undefined") return true;
  if (!accountsReady()) return true;
  const path = window.location.pathname;
  if (OPEN_PATHS.some((p) => path === p || path.startsWith(`${p}/`))) return true;
  const c = clerk();
  // Until Clerk has loaded we can't tell, and a signed-in singer should never
  // be bounced to sign-in by a race; Clerk loads before anyone reaches a
  // start button in practice.
  if (!c?.loaded) return true;
  return !!c.user;
}

let redirecting = false;

/** Sends the visitor to sign in, returning them to this page afterwards. */
export function goSignIn(): void {
  if (redirecting) return;
  redirecting = true;
  const back = window.location.pathname + window.location.search;
  // A full navigation on purpose: this runs from library code outside React,
  // and a hard load also tears down any audio or mic the page had started.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(`/sign-in?redirect_url=${encodeURIComponent(back)}`);
}

/**
 * The check used at each point of use: true to proceed, or false after
 * starting the redirect to sign-in.
 */
export function requireAccountToUse(): boolean {
  if (canUseTools()) return true;
  goSignIn();
  return false;
}
