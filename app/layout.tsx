import type { Metadata, Viewport } from "next";
import { Manrope, IBM_Plex_Mono, Instrument_Serif } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { accountsReady } from "@/lib/accounts";
import "./globals.css";
import Nav from "@/components/nav";
import SiteFooter from "@/components/site-footer";
import V2Banner from "@/components/v2-banner";
import { SITE_URL } from "@/lib/site";
import ProMoments from "@/components/pro/moments";
import ProSync from "@/components/pro/sync";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});
/**
 * The display face, and the only second voice on the site.
 *
 * Before this, --font-display and --font-body were both Manrope, so every
 * `font-display` class in the app — 44 of them — changed nothing, and the
 * wordmark, the headings, the card titles, the book prose, the nav and the
 * buttons were all one face at 400–800. The only contrast of form was IBM Plex
 * Mono, spent entirely on 11px uppercase labels. There was nothing for the eye
 * to grip, which is most of why the site read as a template.
 *
 * A high-contrast serif is the right second voice for this particular product
 * rather than a generic choice: the ground is warm paper, the numbers are
 * already mono, and two books ship with Pro. It carries h1 and h2 only —
 * everything inside an instrument stays Manrope, because a practice room is a
 * console, not an essay.
 *
 * Instrument Serif ships one weight (400), which is why globals.css drops
 * headings from 800 to 400 rather than leaving a bold that would synthesise.
 */
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Google Search Console ownership: set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
  // on the Vercel project to the token from GSC's URL-prefix "HTML tag"
  // method — no code change needed to (re)verify.
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  title: {
    default: "Suede Sing — the vocal studio in your browser",
    template: "%s · Suede Sing",
  },
  description:
    "Real-time pitch training, vocal range testing, guided warmups, ear training, breath work, a recorder and song practice — free, in the browser, no install.",
};

export const viewport: Viewport = {
  themeColor: "#f7f0e7",
};

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
 * Mounting ClerkProvider is what pulls clerk-js down from Clerk's CDN: about
 * 1.2MB across a dozen requests, plus __client_uat cookies scoped to
 * .suedeai.ai, on every page load. With development keys none of that can do
 * anything - every account surface is hidden by accountsReady() - so it is pure
 * weight on a site whose whole funnel is organic search. Consumers read auth
 * through useAccountAuth, which answers "signed out" when there is no provider,
 * so nothing below throws when this is skipped.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const shell = (
    <>
      {/* Sixteen tabbable elements sit ahead of the content on every page —
          the twelve-room nav plus the Pro and progress links — so a keyboard
          or screen-reader user crossed all of them again on every
          navigation. Visible only once focused. */}
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[80] focus:rounded-full focus:border focus:border-violet focus:bg-panel focus:px-4 focus:py-2.5 focus:text-sm focus:text-ink"
      >
        Skip to content
      </a>
      <V2Banner />
      <Nav />
      <ProSync />
      <ProMoments />
      <div id="content" className="min-h-[70dvh]">
        {children}
      </div>
      <SiteFooter />
    </>
  );

  return (
    <html
      lang="en"
      className={`${manrope.variable} ${plexMono.variable} ${instrumentSerif.variable}`}
    >
      <body className="min-h-dvh antialiased">
        {/* Inside <body>, per Clerk Core 3 — wrapping <html> is the old shape
            and breaks. It only reads the session; nothing under it is gated,
            and a signed-out visitor sees the whole site as before. Skipped
            entirely without real keys, so clerk-js is never fetched. */}
        {accountsReady() ? (
          <ClerkProvider localization={CLERK_COPY}>{shell}</ClerkProvider>
        ) : (
          shell
        )}
      </body>
    </html>
  );
}
