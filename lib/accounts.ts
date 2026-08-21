/**
 * Whether the account offer is real on this deployment.
 *
 * Clerk development instances only hold a session on localhost and on their own
 * *.accounts.dev domain. Pointed at a custom production domain the handshake
 * never completes, so `auth()` sees no user and every call to the backup
 * endpoint comes back 401 - which is exactly what shipping the Vercel
 * marketplace's default keys to sing.suedeai.ai did. Clerk says so itself in the
 * console: "Development instances have strict usage limits and should not be
 * used when deploying your application to production."
 *
 * Offering an account that cannot be created is worse than not offering one, so
 * the entry points stay hidden until the keys are real. Everything else about a
 * signed-out visit is unchanged, because nothing here was ever gated on an
 * account.
 *
 * Deliberately derived from the key rather than a hand-set flag: the moment a
 * production instance is configured and `pk_live_` lands in the environment,
 * the offer returns on the next deploy with no code change and no flag left
 * behind to forget. `NODE_ENV` keeps `next dev` working against test keys,
 * and it is inlined identically on server and client, so this cannot
 * desynchronise a hydration.
 */
export function accountsReady(): boolean {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  if (key.startsWith("pk_live_")) return true;
  return process.env.NODE_ENV !== "production" && key.length > 0;
}
