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
 * ~420 singer pages and the homepage.
 *
 * This is the estate's hub-and-spoke crawl spine: the singer pages already
 * link to each other, but the *hubs* that gather them (the voice-type and
 * genre indexes, the records page, the atlas) previously had no inbound link
 * from most of the site, so crawl budget never reached them. Putting the hubs
 * in the footer makes every hub reachable in one click from any page, which is
 * how link equity flows to the deep singer inventory Google discovered but was
 * not crawling. Descriptive, self-contained anchor text throughout — no
 * "click here" / "read more".
 */

type FooterLink = { href: string; label: string };

const REFERENCE: FooterLink[] = [
  { href: "/singers", label: "Famous singers' vocal ranges" },
  { href: "/singers/records", label: "Widest, lowest & highest ranges" },
  { href: "/atlas", label: "The Voice Atlas" },
  // /book had no sitewide inbound link in server-rendered HTML at all: absent
  // here, and clipped out of the old header row. Its twin /atlas was wired from
  // day one, so the two now sit next to each other.
  { href: "/book", label: "The Measured Voice" },
  { href: "/glossary", label: "Vocal glossary" },
  { href: "/songs", label: "Song library" },
];

// /breath, /recorder, /analyze and /tools were each in the sitemap and carrying
// schema while sitting off this spine — pages the site asks Google to index and
// then links from nowhere sitewide. Anchor text follows each page's title tag.
const PRACTICE: FooterLink[] = [
  { href: "/studio", label: "Vocal studio" },
  { href: "/warmups", label: "Guided warmups" },
  { href: "/range", label: "Free vocal range test" },
  { href: "/breath", label: "Breathing exercises for singers" },
  { href: "/ear-training", label: "Ear training" },
  { href: "/recorder", label: "Voice recorder for practice" },
  { href: "/analyze", label: "Voice spectrogram & tone analyzer" },
  { href: "/tools", label: "Metronome, keyboard & vocal drone" },
  { href: "/progress", label: "Your progress" },
];

// `inline-block py-1` takes the desktop row height from 19px to 27px — the
// footer is the densest field of click targets on the site, and 19px is under
// the 24px minimum. `space-y-1` below pays the padding back, so column height
// is unchanged.
const linkClass =
  "inline-block py-1 text-mut transition-colors hover:text-ink hover:underline underline-offset-4";

function Column({
  heading,
  links,
}: {
  heading: string;
  links: FooterLink[];
}) {
  return (
    <div>
      <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
        {heading}
      </h2>
      <ul className="mt-3 space-y-1 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className={linkClass}>
              {l.label}
            </Link>
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
          className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-5"
        >
          <Column heading="Reference" links={REFERENCE} />
          <Column heading="Practice" links={PRACTICE} />

          {/* Every voice-type hub, one click from any page. */}
          <div>
            <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
              By voice type
            </h2>
            <ul className="mt-3 space-y-1 text-sm">
              {VOICE_KINDS.map((v) => (
                <li key={v}>
                  <Link
                    href={`/singers/voice-type/${voiceTypeSlug(v)}`}
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
            <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
              By genre
            </h2>
            <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm lg:grid-cols-2">
              {HUB_GENRES.map((g) => (
                <li key={g}>
                  <Link
                    href={`/singers/genre/${genreSlug(g)}`}
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
          <span>SUEDE SING</span>
          <span>practice loud — your voice never leaves this device</span>
        </div>
      </div>
    </footer>
  );
}
