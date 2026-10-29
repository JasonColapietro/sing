import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { formatPrice, PRICING } from "@/lib/pro-shared";
import { AUTHOR_NODE } from "@/lib/author";
import { NotPro } from "@/components/pro/gate";
import { TOTAL_CHAPTERS, TOTAL_WORDS } from "@/lib/pro-inventory";
import { ROUTINES, routineMinutes } from "@/components/warmups/routines";
import { ORG_NODE } from "@/lib/organization";
import { SITE_URL, rangeTestHref } from "@/lib/site";
import { LinkButton, SectionHeading, SectionLabel } from "@/components/ui";
import { FamousVoices } from "@/components/landing/famous-voices";
import { HeroSplit } from "@/components/landing/hero-split";
import { IosBand } from "@/components/landing/ios-band";
import { StartingPaths } from "@/components/landing/paths";
import ComparisonTable from "@/components/landing/comparison";
import ProVisual from "@/components/pro/pro-visual";
import {
  AnalyzeGlyph,
  BreathGlyph,
  EarGlyph,
  ProgressGlyph,
  RangeGlyph,
  RecorderGlyph,
  SingersGlyph,
  SongGlyph,
  StudioGlyph,
  ToolsGlyph,
  WarmupGlyph,
} from "@/components/landing/glyphs";
import { routeKeywords } from "@/lib/keywords";

/** The span of the free warmup routines, read from the routines themselves. */
const WARMUP_MINUTES = ROUTINES.filter((r) => !r.pro).map(routineMinutes);
const WARMUP_SPAN = `${Math.min(...WARMUP_MINUTES)} to ${Math.max(...WARMUP_MINUTES)}`;

const PRO_PRICE = formatPrice(PRICING.lifetime.amount);

const FEATURES = [
  {
    href: "/analyze",
    label: "Voice spectrogram and tone analyzer",
    desc: "See your voice on a live spectrogram and explore your tone and harmonics.",
    Glyph: AnalyzeGlyph,
  },
  {
    href: "/studio",
    label: "Pitch studio",
    desc: "Sing into your mic and watch your pitch trace against target notes, live.",
    Glyph: StudioGlyph,
  },
  {
    href: "/warmups",
    label: "Warmups",
    desc: `Warmup routines from ${WARMUP_SPAN} minutes, every exercise scored as you sing.`,
    Glyph: WarmupGlyph,
  },
  {
    href: rangeTestHref(),
    label: "Range test",
    desc: "Find your lowest and highest notes and get a voice-type estimate.",
    Glyph: RangeGlyph,
  },
  {
    href: "/singers",
    label: "Famous ranges",
    desc: "Famous voices on one keyboard. See whose range matches yours.",
    Glyph: SingersGlyph,
    // The directory's payload is its whole chart (lib/singer-link-prefetch.test.ts).
    prefetch: false,
  },
  {
    href: "/ear-training",
    label: "Ear training",
    desc: "Interval, pitch-matching, and melody games that sharpen your ear.",
    Glyph: EarGlyph,
  },
  {
    href: "/breath",
    label: "Breath control",
    desc: "Timed breathing and sustain exercises for steadier phrases.",
    Glyph: BreathGlyph,
  },
  {
    href: "/songs",
    label: "Song practice",
    // Both halves of the key rule, as lib/song-page.test.ts pins them.
    desc: "Real songs, scored line by line. With a range test saved, songs open fitted to your range; without one they open in the written key and are scored in either octave.",
    Glyph: SongGlyph,
  },
  {
    href: "/recorder",
    label: "Recorder",
    desc: "Record takes, play them back, and hear yourself improve.",
    Glyph: RecorderGlyph,
  },
  {
    href: "/tools",
    label: "Tools",
    desc: "Metronome, virtual piano, and a drone for pitch reference.",
    Glyph: ToolsGlyph,
  },
  {
    href: "/progress",
    label: "Progress",
    desc: "XP, streaks, achievements, and a coach that plans your practice.",
    Glyph: ProgressGlyph,
  },
];

// Homepage-only head additions, kept here so routes with their own canonical
// are not overridden by layout.tsx.
const HOME_TITLE = "Online Singing Practice with Live Pitch | Suede Sing";
const HOME_DESCRIPTION =
  "Online singing practice with live pitch feedback, warmups and songs. The pitch meter and range test are free; guided practice is 5 free minutes a day.";

export const metadata: Metadata = {
  title: { absolute: HOME_TITLE },
  description: HOME_DESCRIPTION,
  keywords: routeKeywords("/"),
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: SITE_URL,
    siteName: "Suede Sing",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
  },
};

const HOME_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: "Suede Sing",
      publisher: { "@id": "https://suedeai.ai/#organization" },
    },
    ORG_NODE,
    // The organization's founder pointer has to resolve on this page alone.
    AUTHOR_NODE,
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#app`,
      name: "Suede Sing",
      description: HOME_DESCRIPTION,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web Browser",
      browserRequirements: "Requires a microphone for pitch and range features",
      url: `${SITE_URL}/`,
      publisher: { "@id": "https://suedeai.ai/#organization" },
      featureList: [
        "Real-time pitch training",
        "Vocal range test",
        "Guided warmups",
        "Ear training",
        "Breath work",
        "Recorder and song practice",
        "Famous singer vocal range library",
      ],
      offers: {
        "@type": "Offer",
        name: "Free pitch meter and vocal range test",
        description: "Guided practice includes five free minutes a day; additional practice and Pro features require a paid plan.",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
    },
  ],
};

/** Two rooms at phone width, captured from this site (scripts/render-room-shots.mjs). */
const SESSION_SHOTS = [
  {
    src: "/room-studio.png",
    alt: "The pitch studio on a phone: a live pitch trace against the target note",
    caption: "Studio: the note you sang, live",
  },
  {
    src: "/room-progress.png",
    alt: "The progress room on a phone: streak, range card and the coach's plan",
    caption: "Progress: what to sing tomorrow",
  },
];

export default function Home() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(HOME_JSON_LD) }}
      />
      {/* 1 — Hero */}
      <HeroSplit />

      {/* 2 — Starting paths, above the grid: a beginner and a working singer
              need opposite entry points. */}
      <StartingPaths />

      {/* 3 — Feature grid */}
      <section className="border-t border-line">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <SectionHeading
            label="Singing practice tools"
            lede="Open a room, allow the mic, and sing. Each one runs in your browser."
          >
            Open any room and sing
          </SectionHeading>
          {/* Two columns on a phone, descriptions held back until sm: the
              grid is a directory, not a pitch. */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {FEATURES.map(({ href, label, desc, Glyph, prefetch }) => (
              <Link
                key={href}
                href={href}
                prefetch={prefetch}
                className="lift group rounded-2xl border border-line bg-panel p-4 hover:border-violet/50 sm:p-6"
              >
                <span className="well inline-flex h-12 w-12 items-center justify-center rounded-xl text-violet-ink">
                  <Glyph width={32} height={32} strokeWidth={1.25} />
                </span>
                <span className="mt-3 block text-lg text-ink group-hover:text-violet-ink sm:mt-4 sm:text-xl">
                  {label}
                </span>
                <span className="mt-1 hidden text-sm text-mut sm:block">{desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4 — Pro teaser */}
      <section className="border-t border-line bg-panel/40">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
            <div>
              <SectionLabel hairline className="mb-4">
                Suede Pro · Early Access
              </SectionLabel>
              <h2 className="max-w-xl text-2xl sm:text-3xl">
                Know what to sing tomorrow
              </h2>
              <p className="mt-3 max-w-xl text-mut">
                Free shows you today&rsquo;s score. Pro keeps the score over
                months and tells you what to sing next.
              </p>
              {/* Each perk once; the price is on the button only. */}
              <ul className="mt-5 space-y-2.5">
                {[
                  "No daily limit on guided practice",
                  "The coach's full daily plan: every step, built from your own scores.",
                  // /pro's wording: one tally per note, only the range over time.
                  "A per-note accuracy chart, and your range charted over months",
                  "Pitch analysis on every recorded take",
                  `Both books in full: ${TOTAL_CHAPTERS} chapters, ${TOTAL_WORDS.toLocaleString("en-US")} words, two PDFs to keep`,
                ].map((line) => (
                  <li
                    key={line}
                    className="flex items-start gap-2.5 text-sm text-mut"
                  >
                    <span aria-hidden className="mt-0.5 font-mono text-violet-ink">
                      ✓
                    </span>
                    {line}
                  </li>
                ))}
              </ul>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                {/* NotPro hides the priced ask from a Pro browser before first paint. */}
                <NotPro>
                  <LinkButton href="/pro#buy" variant="violet" size="lg">
                    {`Go Pro: ${PRO_PRICE} once`}
                  </LinkButton>
                </NotPro>
                <LinkButton href="/pro" variant="ghost" size="lg">
                  See everything Pro adds
                </LinkButton>
              </div>
            </div>
            <ProVisual />
          </div>
        </div>
      </section>

      {/* 5 — Comparison, trimmed to the rows where the columns differ */}
      <section className="border-t border-line">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <SectionHeading
            label="Side by side"
            lede="Only the rows where the answers differ."
          >
            What Suede Sing does free in a browser
          </SectionHeading>
          <div className="mt-8">
            <ComparisonTable />
          </div>
        </div>
      </section>

      {/* 6 — Famous voices */}
      <FamousVoices />

      {/* 7 — The iPhone companion */}
      <IosBand />

      {/* 8 — Final CTA */}
      <section className="border-t border-line">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 text-center sm:px-6">
          <h2 className="text-3xl sm:text-4xl">
            Your mic is the only equipment
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-mut">
            Open the pitch meter, enable your mic, and see the note you are
            singing. Or start a guided warmup and follow the notes on screen.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            {/* Violet, like the hero's: rust marks "mic on" everywhere else. */}
            <LinkButton href={rangeTestHref({ mode: "pitch" })} variant="violet" size="lg">
              Start singing free
            </LinkButton>
            <LinkButton href="/warmups" variant="ghost" size="lg">
              Browse warmups
            </LinkButton>
          </div>

          <figure className="mx-auto mt-14 max-w-2xl">
            <figcaption className="font-mono text-label uppercase tracking-[0.14em] text-dim">
              What a session looks like
            </figcaption>
            <ul className="mt-5 grid grid-cols-2 gap-4 sm:gap-6">
              {SESSION_SHOTS.map((shot) => (
                <li key={shot.src} className="flex flex-col items-center">
                  <span className="figure block w-full max-w-[220px] overflow-hidden rounded-2xl border border-line bg-panel p-2">
                    <Image
                      src={shot.src}
                      alt={shot.alt}
                      width={390}
                      height={844}
                      sizes="(max-width: 640px) 45vw, 220px"
                      className="h-auto w-full rounded-xl"
                    />
                  </span>
                  <span className="mt-3 text-sm text-mut">{shot.caption}</span>
                </li>
              ))}
            </ul>
          </figure>
        </div>
      </section>
    </main>
  );
}
