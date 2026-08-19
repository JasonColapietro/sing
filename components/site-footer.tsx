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
  { href: "/glossary", label: "Vocal glossary" },
  { href: "/songs", label: "Song library" },
];

const PRACTICE: FooterLink[] = [
  { href: "/studio", label: "Vocal studio" },
  { href: "/warmups", label: "Guided warmups" },
  { href: "/range", label: "Free vocal range test" },
  { href: "/ear-training", label: "Ear training" },
  { href: "/progress", label: "Your progress" },
  { href: "/extension", label: "Chrome extension vocal coach" },
];

const linkClass =
  "text-mut transition-colors hover:text-ink hover:underline underline-offset-4";

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
      <ul className="mt-3 space-y-2 text-sm">
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
            <ul className="mt-3 space-y-2 text-sm">
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
            <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm lg:grid-cols-2">
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
