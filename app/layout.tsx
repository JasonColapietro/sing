import type { Metadata, Viewport } from "next";
import { Manrope, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/nav";
import { SITE_URL } from "@/lib/site";
import ProMoments from "@/components/pro/moments";
import ProSync from "@/components/pro/sync";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${plexMono.variable}`}
    >
      <body className="min-h-dvh antialiased">
        {/* Sixteen tabbable elements sit ahead of the content on every page —
            the twelve-room nav plus the Pro and progress links — so a keyboard
            or screen-reader user crossed all of them again on every
            navigation. Visible only once focused. */}
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[80] focus:rounded-full focus:border focus:border-amber focus:bg-panel focus:px-4 focus:py-2.5 focus:text-sm focus:text-ink"
        >
          Skip to content
        </a>
        <Nav />
        <ProSync />
        <ProMoments />
        <div id="content" className="min-h-[70dvh]">
          {children}
        </div>
        <footer className="mt-20 border-t border-line">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-8 font-mono text-xs text-dim sm:px-6">
            <span>SUEDE SING</span>
            <span>practice loud — your voice never leaves this device</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
