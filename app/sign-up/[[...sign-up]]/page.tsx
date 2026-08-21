import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { LinkButton, SectionLabel } from "@/components/ui";
// Sign-in is where the theme lives, so the two cards cannot drift apart. The
// bracketed segment is the real directory name; this is a plain module import,
// not a route reference.
import { SING_APPEARANCE } from "@/app/sign-in/[[...sign-in]]/page";

export const metadata: Metadata = {
  title: "Create your free account",
  description:
    "Create a free Suede Sing account to back up your XP, streak, logged sessions and vocal range.",
  // Same reasoning as /sign-in: a utility page, deliberately outside the index
  // and outside app/sitemap.ts.
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-12 sm:py-16">
      <SectionLabel className="mb-3">Free account</SectionLabel>
      <h1 className="text-center text-3xl">Keep a copy of your progress</h1>
      <p className="mt-3 text-center text-mut">
        Right now your XP, streak, logged sessions and vocal range live in this
        browser and nowhere else. One cleared browser and they are gone. An
        account is free and keeps a backup.
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
        This buys you a backup, nothing else. Everything free stays free and
        stays open signed out.
      </p>
      <LinkButton href="/studio" variant="ghost" size="sm" className="mt-2">
        Back to the studio
      </LinkButton>
    </main>
  );
}
