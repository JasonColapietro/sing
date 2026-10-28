import Link from "next/link";
import {
  HUB_GENRES,
  VOICE_KINDS,
  genreSlug,
  voiceTypeSlug,
} from "@/lib/singers";
import { PRICING, formatPrice } from "@/lib/pro-shared";
import { NotPro } from "@/components/pro/gate";
import { rangeTestHref } from "@/lib/site";

/**
 * Site-wide footer: a Server Component, so every link ships in the HTML of
 * every page. It is the crawl spine that reaches every hub (voice-type and
 * genre indexes, records, atlas) in one click, with descriptive anchor text.
 * Every internal link is prefetch={false}: secondary navigation on every page
 * must not fetch dozens of routes as it scrolls into view.
 */

type FooterLink = {
  href: string;
  label: string;
  /** A price clause after the label, hidden for a Pro browser (NotPro). */
  price?: string;
};

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
  { href: rangeTestHref(), label: "Free vocal range test" },
  { href: "/voice", label: "Suede Voice for iPhone & Android" },
  { href: "/ear-training", label: "Ear training" },
  // Both rooms are live and were in no footer column, so neither had a
  // site-wide internal link.
  { href: "/breath", label: "Breath training" },
  { href: "/tools", label: "Metronome, keyboard and drone" },
  // One name per room, as the homepage card and lib/guides.ts use.
  { href: "/recorder", label: "Recorder" },
  { href: "/analyze", label: "Voice analyzer" },
  { href: "/progress", label: "Your progress" },
  { href: "/extension", label: "Chrome extension vocal coach" },
  // Priced like every ask that leads to the offer; hidden from an owner.
  { href: "/pro#buy", label: "Suede Pro vocal coach", price: `, ${formatPrice(PRICING.lifetime.amount)} once` },
];

/** The voice course (hosted here since 2026-09-23), then the sibling Suede properties. */
const MORE_FROM_SUEDE: FooterLink[] = [
  { href: "/learn/voice", label: "Voice lessons" },
  { href: "https://strumly.suedeai.ai/capo", label: "Capo calculator on Strumly" },
  { href: "https://suedeai.ai", label: "Suede AI" },
];

const linkClass =
  "text-mut transition-colors hover:text-ink hover:underline underline-offset-4";

/* Links that stand on their own (the columns, the legal row): at least 24px
   tall (WCAG 2.5.8) where the plain inline link measured 19px. Inline links
   inside running text use proseLinkClass, which wraps with the sentence. */
const navLinkClass = `${linkClass} inline-flex min-h-6 items-center`;

/* A link inside a sentence carries a resting underline: in the dim
   attribution line, color alone (mut against dim) did not mark it as a link
   (WCAG 1.4.1). */
const proseLinkClass =
  "text-mut underline decoration-dim underline-offset-2 transition-colors hover:text-ink hover:decoration-ink";

/** How many genre hubs a phone lists before the "All genres" link. */
const PHONE_GENRES = 8;

/** Column heading: the 12px label tier from the type scale, not a one-off 11px. */
const headingClass = "font-mono text-label uppercase tracking-[0.14em] text-dim";

/* The extra 2px below sm keeps two-line labels from reading as one block. */
const listClass = "mt-3 space-y-2.5 text-sm sm:space-y-2";

/* The two hub columns fold into <details> on a phone: the links stay in the
   HTML for crawlers, and the inline script after the nav opens them from sm
   up before first paint. The summary hides once the column is open there. */
const hubDetailsClass = "group";
const hubSummaryClass = `${headingClass} flex min-h-11 cursor-pointer list-none items-center gap-2 sm:min-h-0 sm:group-open:hidden [&::-webkit-details-marker]:hidden`;
const HUB_OPEN_SCRIPT =
  'try{if(matchMedia("(min-width:640px)").matches)for(const d of document.querySelectorAll("details[data-footer-hub]"))d.open=true}catch(e){}';

function HubCaret() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true" className="transition-transform group-open:rotate-180">
      <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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
              <a href={l.href} className={navLinkClass}>
                {l.label}
              </a>
            ) : (
              <Link href={l.href} prefetch={false} className={navLinkClass}>
                {/* One span: the link is a flex box, and a bare label beside
                    the price clause became two columns. */}
                <span>
                  {l.label}
                  {l.price && <NotPro>{l.price}</NotPro>}
                </span>
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
          <Column heading="More from Suede AI" links={MORE_FROM_SUEDE} />

          {/* Every voice-type hub, one click from any page. */}
          <details data-footer-hub className={hubDetailsClass}>
            <summary className={hubSummaryClass}>
              <h2 className="contents">By voice type</h2>
              <HubCaret />
            </summary>
            <ul className={listClass}>
              {VOICE_KINDS.map((v) => (
                <li key={v}>
                  <Link
                    href={`/singers/voice-type/${voiceTypeSlug(v)}`}
                    prefetch={false}
                    className={navLinkClass}
                  >
                    {v} voices
                  </Link>
                </li>
              ))}
            </ul>
          </details>

          {/* Every genre hub that clears the singer-count threshold. */}
          <details data-footer-hub className={`${hubDetailsClass} col-span-2 sm:col-span-1 lg:col-span-2`}>
            <summary className={hubSummaryClass}>
              <h2 className="contents">By genre</h2>
              <HubCaret />
            </summary>
            {/* Every hub stays in the HTML; a phone shows the first few and a way to the rest. */}
            <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm sm:gap-y-2">
              {HUB_GENRES.map((g, i) => (
                <li key={g} className={i >= PHONE_GENRES ? "max-sm:hidden" : undefined}>
                  <Link
                    href={`/singers/genre/${genreSlug(g)}`}
                    prefetch={false}
                    className={navLinkClass}
                  >
                    {g} vocal ranges
                  </Link>
                </li>
              ))}
              {HUB_GENRES.length > PHONE_GENRES && (
                <li className="sm:hidden">
                  <Link href="/singers" prefetch={false} className={navLinkClass}>
                    All genres
                  </Link>
                </li>
              )}
            </ul>
          </details>
        </nav>
        <script dangerouslySetInnerHTML={{ __html: HUB_OPEN_SCRIPT }} />

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 font-mono text-meta text-dim">
          {/* Spaced, not dotted: a wrapped row put a separator at a line's edge. */}
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>SUEDE SING</span>
            {/* The durable inbound link to /changelog. */}
            <Link href="/changelog" prefetch={false} className={navLinkClass}>
              4.0: what we&apos;ve changed
            </Link>
            {/* suedeai.org's policy and terms govern this site; plain anchors
                to another origin. */}
            <a href="https://suedeai.org/privacy/" className={navLinkClass}>
              Privacy
            </a>
            <a href="https://suedeai.org/terms/" className={navLinkClass}>
              Terms
            </a>
            {/* A static file behind a vercel.json rewrite, so a plain anchor. */}
            <a href="/ai-instructions" className={navLinkClass}>
              AI instructions
            </a>
            {/* CC BY 3.0 asks for a credit where the samples are used. */}
            <a href="/audio/piano/CREDITS.txt" className={navLinkClass}>
              Piano: Salamander Grand by Alexander Holm, CC BY
            </a>
          </span>
          <span>practice loud: your voice never leaves this device</span>
        </div>

        {/* Estate attribution. */}
        <p className="mt-4 max-w-3xl text-meta leading-relaxed text-dim">
          A <a href="https://suedeai.ai" className={proseLinkClass}>Suede AI</a>{" "}
          product, built by{" "}
          <a href="https://suedeai.ai/founder" rel="author" className={proseLinkClass}>
            Jason Colapietro
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
