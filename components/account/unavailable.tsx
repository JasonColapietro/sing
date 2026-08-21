import { LinkButton, SectionLabel } from "@/components/ui";

/**
 * What /sign-in and /sign-up render when this deployment has no production
 * Clerk instance.
 *
 * The routes stay routes rather than 404ing: they are already noindex, they are
 * linked from nowhere while the offer is hidden, and a 404 on a URL that will
 * be real again next deploy is the sort of thing that ends up cached somewhere
 * unhelpful. What they must not do is render a sign-in form that takes an email
 * and then fails, so they say the plain thing instead and point back at the
 * practice rooms, which have never needed an account.
 */
export function AccountsUnavailable({ verb }: { verb: "Signing in" | "Signing up" }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-12 sm:py-16">
      <SectionLabel className="mb-3">Not yet</SectionLabel>
      <h1 className="text-center text-3xl">Accounts are not open yet</h1>
      <p className="mt-3 text-center text-mut">
        {verb} is not available on this site right now. Nothing is missing from
        your practice: your XP, streak, sessions and range are saved in this
        browser exactly as before, and every room works the same.
      </p>
      <p className="mt-6 text-center text-sm text-dim">
        Keep your record safe in the meantime by exporting it from the progress
        page.
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <LinkButton href="/progress" size="sm">
          Go to Progress
        </LinkButton>
        <LinkButton href="/studio" variant="ghost" size="sm">
          Back to the studio
        </LinkButton>
      </div>
    </main>
  );
}
