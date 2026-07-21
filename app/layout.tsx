import type { Metadata, Viewport } from "next";
import { Manrope, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/nav";

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
        <Nav />
        <div className="min-h-[70dvh]">{children}</div>
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
