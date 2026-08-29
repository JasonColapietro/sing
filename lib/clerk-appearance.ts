import type { SignIn } from "@clerk/nextjs";
import type { ComponentProps } from "react";

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
 * header's sign-in modal and user button; keep the two in step.
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
    fontFamily: "var(--font-body)",
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
