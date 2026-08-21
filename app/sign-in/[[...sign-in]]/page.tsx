import type { ComponentProps } from "react";
import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { LinkButton, SectionLabel } from "@/components/ui";

type ClerkAppearance = NonNullable<ComponentProps<typeof SignIn>["appearance"]>;

/**
 * Clerk paints its own components, and its defaults are a blue-on-white system
 * with nothing in common with this site's paper and gold. Tailwind's semantic
 * classes cannot reach Clerk's own subtree, but the tokens behind them can:
 * app/globals.css emits every one onto `:root, :host`, so a var() reference
 * resolves inside Clerk's card and its portals alike. Naming the tokens rather
 * than pasting their hexes is what stops this card drifting the next time the
 * palette moves.
 *
 * colorPrimary is --color-amber-ink, not --color-amber. Clerk spends it on
 * links as well as button fills, and the lighter gold reads 2.4:1 on paper —
 * fine as a fill, a WCAG AA failure as text.
 *
 * components/nav.tsx carries its own copy of the same variables, for the
 * header's sign-in modal and user button; keep the two in step. A route module
 * and a "use client" module cannot share one constant without a third file.
 */
export const SING_APPEARANCE: ClerkAppearance = {
  variables: {
    colorPrimary: "var(--color-amber-ink)",
    colorPrimaryForeground: "var(--color-panel)",
    colorBackground: "var(--color-panel)",
    colorForeground: "var(--color-ink)",
    colorMuted: "var(--color-panel2)",
    colorMutedForeground: "var(--color-mut)",
    colorNeutral: "var(--color-ink)",
    colorInput: "var(--color-panel)",
    colorInputForeground: "var(--color-ink)",
    colorBorder: "var(--color-line)",
    // The site's own :focus-visible outline is --color-rec, so the ring inside
    // Clerk's card matches the one on every control outside it.
    colorRing: "var(--color-rec)",
    colorDanger: "var(--color-rec)",
    colorSuccess: "var(--color-ok-ink)",
    colorWarning: "var(--color-amber-ink)",
    fontFamily: "var(--font-display)",
    fontFamilyMono: "var(--font-mono)",
    borderRadius: "0.75rem",
  },
  options: {
    // The wordmark is already in the header two inches up, and the fallback is
    // whatever logo the Clerk dashboard holds, which is not ours.
    logoPlacement: "none",
    socialButtonsVariant: "blockButton",
  },
};

// Clerk's card carries its own heading, "Sign in to <application name>", which
// is a second h1 under this page's own. It stays: that header slot is also
// where the later steps announce themselves ("Verify your email address") and
// where the back link lives, so hiding it would strand someone mid-flow. The
// name it prints is the Clerk dashboard's application name, so that has to read
// "Suede Sing" there — it is not set from here.

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to Suede Sing to keep a backup of your XP, streak, logged sessions and vocal range.",
  // A utility page with no query behind it and nothing worth crawling onward
  // to. Keeping it out of the index also keeps it out of app/sitemap.ts, which
  // lists its pages by hand.
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-12 sm:py-16">
      <SectionLabel className="mb-3">Free account</SectionLabel>
      <h1 className="text-center text-3xl">Pick your practice record back up</h1>
      <p className="mt-3 text-center text-mut">
        Your XP, streak, logged sessions and vocal range are stored in this
        browser. Signing in restores the copy you saved, on this device or any
        other.
      </p>

      <div className="mt-8 flex w-full justify-center">
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/progress"
          signUpFallbackRedirectUrl="/progress"
          appearance={SING_APPEARANCE}
        />
      </div>

      <p className="mt-10 text-center text-sm text-dim">
        You never need an account to sing. The mic, every practice room and
        every free feature work exactly the same signed out.
      </p>
      <LinkButton href="/studio" variant="ghost" size="sm" className="mt-2">
        Back to the studio
      </LinkButton>
    </main>
  );
}
