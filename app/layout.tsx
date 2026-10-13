import type { Metadata, Viewport } from "next";
import { Manrope, IBM_Plex_Mono } from "next/font/google";
import { accountsReady } from "@/lib/accounts";
import "./globals.css";
import Nav from "@/components/nav";
import SiteFooter from "@/components/site-footer";
import { SITE_URL } from "@/lib/site";
import ProMoments from "@/components/pro/moments";
import ProSync from "@/components/pro/sync";
import ClerkShell from "@/components/account/clerk-shell";
import { AccountBackupSync } from "@/components/progress/account-backup-sync";
import WeeklyReportCard from "@/components/weekly-report-card";
import { routeKeywords } from "@/lib/keywords";
import { INDEXABLE_ROBOTS } from "@/lib/robots-meta";

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
  keywords: routeKeywords("/"),
  metadataBase: new URL(SITE_URL),
  // Inherited by every page that does not set `robots`; pages that do go
  // through pageRobots() so the preview directives survive the shallow merge.
  robots: INDEXABLE_ROBOTS,
  // Google Search Console ownership: set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
  // on the Vercel project to the token from GSC's URL-prefix "HTML tag"
  // method — no code change needed to (re)verify.
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  title: {
    default: "Online Singing Practice with Live Pitch | Suede Sing",
    template: "%s · Suede Sing",
  },
  description:
    "Online singing practice with live pitch feedback, warmups and songs. The pitch meter and range test are free; guided practice is 5 free minutes a day.",
};

export const viewport: Viewport = {
  themeColor: "#0f0c1f",
};

/**
 * The account provider lives in components/account/clerk-shell.tsx, which
 * renders ClerkProvider only when accounts are live on this deployment.
 * Consumers read auth through useAccountAuth, which answers "signed out" when
 * there is no provider, so nothing below throws when it is skipped. See that
 * file for why it is a module of its own.
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
      <Nav />
      <ProSync />
      {/* The free account backup, mounted once for the whole site so a singer
          who signs up from any room is reconciled and backed up there, not
          only after a visit to /progress or the recorder. Rendered only when
          accounts are live: with them off it has nothing to do. */}
      {accountsReady() && <AccountBackupSync />}
      <ProMoments />
      <div id="content" className="min-h-[70dvh]">
        {/* The Monday summary. Inside #content so the skip link lands on it,
            and in the flow rather than over it so it never blocks a room. */}
        <WeeklyReportCard />
        {children}
      </div>
      <SiteFooter />
    </>
  );

  return (
    <html
      lang="en"
      className={`${manrope.variable} ${plexMono.variable}`}
    >
      <body className="min-h-dvh pb-[calc(3.5rem+env(safe-area-inset-bottom))] antialiased sm:pb-0">
        <ClerkShell>{shell}</ClerkShell>
      </body>
    </html>
  );
}
