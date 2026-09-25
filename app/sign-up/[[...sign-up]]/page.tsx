import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { LinkButton, SectionLabel } from "@/components/ui";
import { SING_APPEARANCE } from "@/lib/clerk-appearance";
import { AccountsUnavailable } from "@/components/account/unavailable";
import { accountsReady } from "@/lib/accounts";

export const metadata: Metadata = {
  title: "Create your free account",
  description:
    "Create a free Suede Sing account to back up your XP, streak, logged sessions and vocal range.",
  // Same reasoning as /sign-in: a utility page, deliberately outside the index
  // and outside app/sitemap.ts.
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  if (!accountsReady()) return <AccountsUnavailable verb={"Signing up"} />;

  return (
    <main className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-12 sm:py-16">
      <SectionLabel className="mb-3">Free account</SectionLabel>
      {/* A lede, not an <h1>: Clerk's card supplies the page's only heading, and
          it re-labels itself at every step of the flow. The full reasoning is on
          the shared Clerk appearance module. */}
      <p className="text-center text-3xl font-extrabold tracking-[-0.01em]">
        Create your free account
      </p>
      <p className="mt-3 text-center text-mut">
        The lessons and practice rooms open with a free account. Sign up with
        Apple or Google and your XP, streak, sessions and vocal range are backed
        up too.
      </p>

      <div className="mt-8 flex w-full justify-center">
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/progress"
          appearance={SING_APPEARANCE}
        />
      </div>

      <p className="mt-10 text-center text-sm text-dim">
        The account is free. Famous singers&apos; ranges stay open without one.
      </p>
      <LinkButton href="/singers" variant="ghost" size="sm" className="mt-2">
        Browse singers&apos; ranges
      </LinkButton>
    </main>
  );
}
