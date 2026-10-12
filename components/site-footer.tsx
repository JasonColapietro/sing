import Link from "next/link";
import {
  HUB_GENRES,
  VOICE_KINDS,
  genreSlug,
  voiceTypeSlug,
} from "@/lib/singers";

/**
 * Site-wide footer. A Server Component with no client state, so every link
 * below ships in the raw server-rendered HTML of every page — including all
 * ~636 singer pages and the homepage.
 *
 * This is the estate's hub-and-spoke crawl spine: the singer pages already
 * link to each other, but the *hubs* that gather them (the voice-type and
 * genre indexes, the records page, the atlas) previously had no inbound link
 * from most of the site, so crawl budget never reached them. Putting the hubs
 * in the footer makes every hub reachable in one click from any page, which is
 * how link equity flows to the deep singer inventory Google discovered but was
 * not crawling. Descriptive, self-contained anchor text throughout — no
 * "click here" / "read more".
 *
 * Every internal link here is prefetch={false}. Next prefetches a <Link>'s
 * whole static route when it scrolls into view, and this is secondary
 * navigation on every page: reaching the footer fired dozens of background
 * requests (hundreds on /singers) for pages almost nobody was about to open.
 * The <a href> a crawler reads is identical, and a click still navigates
 * client-side; the header and tab bar keep their prefetch for the rooms
 * people actually go to next.
 */

type FooterLink = { href: string; label: string };

const REFERENCE: FooterLink[] = [
  { href: "/learn", label: "Learn to sing" },
  { href: "/singers", label: "Famous singers' vocal ranges" },
  { href: "/singers/records", label: "Widest, lowest & highest ranges" },
  { href: "/singers/methodology", label: "Singer range methodology" },
  { href: "/contact", label: "Suggest a correction" },
  { href: "/atlas", label: "The Voice Atlas" },
  { href: "/book", label: "The Measured Voice singing book" },
  {
    href: "/atlas/vocal-range-by-voice-type",
    label: "Vocal range by voice type",
  },
  { href: "/glossary", label: "Vocal glossary" },
  { href: "/songs", label: "Song library" },
  { href: "/can-you-sing", label: "Vocal ranges of popular songs" },
];

const PRACTICE: FooterLink[] = [
  { href: "/studio", label: "Vocal studio" },
  { href: "/warmups", label: "Guided warmups" },
  { href: "/programs", label: "Multi-week practice programs" },
  { href: "/range?mode=range", label: "Free vocal range test" },
  { href: "/voice", label: "Suede Voice for iPhone & Android" },
  { href: "/ear-training", label: "Ear training" },
  // Both rooms are live and were in no footer column, so neither had a
  // site-wide internal link.
  { href: "/breath", label: "Breath training" },
  { href: "/tools", label: "Metronome, keyboard and drone" },
  // No longer header tabs of their own — the footer and /tools carry the
  // crawl path into these rooms now. "Take recorder" is what the homepage room
  // card and lib/guides.ts call it; a footer naming the same room differently
  // splits the anchor text pointing at one URL, and reads as two rooms.
  { href: "/recorder", label: "Take recorder" },
  { href: "/analyze", label: "Voice analyzer" },
  { href: "/progress", label: "Your progress" },
  { href: "/extension", label: "Chrome extension vocal coach" },
  { href: "/pro", label: "Suede Pro online vocal coach" },
];

/**
 * The voice course, then the sibling Suede properties.
 *
 * The course used to live on GuitarHub and this was the link out to it. Since
 * 2026-09-23 sing hosts the lessons itself at /learn/voice, and GuitarHub
 * redirects its copy here, so the entry is a local route.
 */
const MORE_FROM_SUEDE: FooterLink[] = [
  { href: "/learn/voice", label: "Voice lessons" },
  { href: "https://strumly.suedeai.ai/capo", label: "Capo calculator on Strumly" },
  { href: "https://suedeai.ai", label: "Suede AI" },
];

const linkClass =
  "text-mut transition-colors hover:text-ink hover:underline underline-offset-4";

/** Column heading: the 12px label tier from the type scale, not a one-off 11px. */
const headingClass = "font-mono text-label uppercase tracking-[0.14em] text-dim";

/* Two-line wrapped labels ("Famous singers' vocal ranges") sat 8px from the
   next link on a phone, so the rows read as one block; the extra 2px below sm
   separates them and gives each tap a little more room. */
const listClass = "mt-3 space-y-2.5 text-sm sm:space-y-2";

function Column({
  heading,
  links,
}: {
  heading: string;
  links: FooterLink[];
}) {
  return (
    <div>
      <h2 className={headingClass}>
        {heading}
      </h2>
      <ul className={listClass}>
        {links.map((l) => (
          <li key={l.href}>
            {/* next/link is for in-app routes; a sibling property is a plain
                anchor so it is not prefetched as a local route. */}
            {l.href.startsWith("http") ? (
              <a href={l.href} className={linkClass}>
                {l.label}
              </a>
            ) : (
              <Link href={l.href} prefetch={false} className={linkClass}>
                {l.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <nav
          aria-label="Explore Suede Sing"
          className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-6"
        >
          <Column heading="Reference" links={REFERENCE} />
          <Column heading="Practice" links={PRACTICE} />
          <Column heading="More from Suede" links={MORE_FROM_SUEDE} />

          {/* Every voice-type hub, one click from any page. */}
          <div>
            <h2 className={headingClass}>
              By voice type
            </h2>
            <ul className={listClass}>
              {VOICE_KINDS.map((v) => (
                <li key={v}>
                  <Link
                    href={`/singers/voice-type/${voiceTypeSlug(v)}`}
                    prefetch={false}
                    className={linkClass}
                  >
                    {v} voices
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Every genre hub that clears the singer-count threshold. */}
          <div className="col-span-2 sm:col-span-1 lg:col-span-2">
            <h2 className={headingClass}>
              By genre
            </h2>
            <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm sm:gap-y-2">
              {HUB_GENRES.map((g) => (
                <li key={g}>
                  <Link
                    href={`/singers/genre/${genreSlug(g)}`}
                    prefetch={false}
                    className={linkClass}
                  >
                    {g} vocal ranges
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 font-mono text-xs text-dim">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <span>SUEDE SING</span>
            <span aria-hidden>·</span>
            {/* The durable inbound link to /changelog: the release banner will
                retire one day, and the crawl path must not retire with it. */}
            <Link href="/changelog" prefetch={false} className={linkClass}>
              3.1: what we&apos;ve changed
            </Link>
            <span aria-hidden>·</span>
            {/* Both pages were already live and neither was linked from
                anywhere on the site. An app that asks for a microphone should
                put its policy one click from every page. */}
            {/* The company policy and terms cover suedeai.ai and its
                subdomains, including Stripe purchases, so they govern this
                site. suedeai.org/voice/* is the mobile app's policy. /privacy
                and /terms here still 308 there for the app-store and Chrome
                Web Store listings that declared them. Plain anchors: a <Link>
                to another origin buys nothing but a prefetch. */}
            <a href="https://suedeai.org/privacy/" className={linkClass}>
              Privacy
            </a>
            <span aria-hidden>·</span>
            <a href="https://suedeai.org/terms/" className={linkClass}>
              Terms
            </a>
            <span aria-hidden>·</span>
            {/* A plain anchor: /ai-instructions is a static file behind a
                vercel.json rewrite, not an app route, so there is nothing for
                next/link to prefetch. It used to sit in a stray nav of its own
                below the footer on every page. */}
            <a href="/ai-instructions" className={linkClass}>
              AI instructions
            </a>
            <span aria-hidden>·</span>
            {/* CC BY 3.0 asks for a credit where the samples are used. */}
            <a href="/audio/piano/CREDITS.txt" className={linkClass}>
              Piano: Salamander Grand by Alexander Holm, CC BY
            </a>
          </span>
          <span>practice loud — your voice never leaves this device</span>
        </div>

        {/* Estate attribution. The open-source record is the same claim the
            sibling Suede properties carry, worded identically and pointed at
            the one canonical receipt, so the number is verified in one place
            rather than drifting per surface. */}
        <p className="mt-4 max-w-3xl text-xs leading-relaxed text-dim">
          A <a href="https://suedeai.ai" className={linkClass}>Suede AI</a>{" "}
          product, built by{" "}
          <a href="https://suedeai.ai/founder" className={linkClass}>
            Jason Colapietro
          </a>
          , an{" "}
          <a
            href="https://seo.suedeai.ai/evidence#open-source"
            className={linkClass}
          >
            open-source contributor with 54 pull requests merged across 46
            external repositories through GitHub, plus one public Linux kernel
            USB/IP contribution labeled Public upstream v7, as of September 2026
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
