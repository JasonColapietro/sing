import type { Metadata } from "next";
import Link from "next/link";
import { formatPrice, PRICING, proHeadlineLong } from "@/lib/pro-shared";
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
import V2Banner from "@/components/v2-banner";
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

/**
 * The span of the free warmup routines, read from the routines themselves so
 * a new short routine (the cool-down) or a longer one cannot leave the
 * homepage quoting a range nothing on /warmups matches.
 */
const WARMUP_MINUTES = ROUTINES.filter((r) => !r.pro).map(routineMinutes);
const WARMUP_SPAN = `${Math.min(...WARMUP_MINUTES)} to ${Math.max(...WARMUP_MINUTES)}`;

/** The complete Early Access offer, shared with every other sales surface. */
const PRO_PRICE_LINE = proHeadlineLong();
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
    // The directory's payload is its whole chart; a visible card would fetch
    // it in the background (lib/singer-link-prefetch.test.ts).
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
    desc: "Once you've taken the range test, songs open fitted to your measured range. Without one they open in the written key and are scored in either octave.",
    Glyph: SongGlyph,
  },
  {
    href: "/recorder",
    label: "Take recorder",
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

// Homepage-only head additions (audit 2026-08-02: canonical, OG and schema were
// absent sitewide at the root). Kept here rather than in layout.tsx so routes that
// set their own canonical (e.g. /singers/[slug]) are not overridden.
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
    // The organization's founder pointer resolves on this page, not only on
    // suedeai.ai: a crawler reading the homepage alone found a dangling @id.
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

export default function Home() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(HOME_JSON_LD) }}
      />
      {/* The original portrait presentation with the current pitch/range actions. */}
      <HeroSplit />
      {/* The 4.0 card, for every visitor until dismissed; keep it after the start buttons. */}
      <V2Banner />

      {/* 2 — Starting paths, above the grid: equal choices are the wrong
              shape for a first visit, and a beginner and a working singer
              need opposite entry points. */}
      <StartingPaths />

      {/* 3 — Feature grid */}
      <section className="border-t border-line">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <SectionHeading
            label="Singing practice tools"
            lede="Open any room and sing. Live pitch feedback, range testing, warmups, ear training, breath work and song practice, all in the browser."
          >
            Every practice room, in your browser
          </SectionHeading>
          {/* Two columns on a phone, with the descriptions held back until
              sm: eleven single-column cards ran to nearly three phone
              screens of a page that is a directory, not a pitch. */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {FEATURES.map(({ href, label, desc, Glyph, prefetch }) => (
              <Link
                key={href}
                href={href}
                prefetch={prefetch}
                className="lift group rounded-2xl border border-line bg-panel p-4 hover:border-violet/50 sm:p-6"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-panel2 text-violet-ink">
                  <Glyph />
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

      {/* 4 — Head-query singer pages, linked straight from the strongest page
              on the subdomain. See famous-voices.tsx for why the hubs alone
              were not enough. */}
      <FamousVoices />

      {/* 5 — The iOS app, folded in from print.suedeai.ai */}
      <IosBand />

      {/* 6 — Comparison */}
      <section className="border-t border-line bg-panel/40">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <SectionHeading
            label="Side by side"
            lede="The free studio beside the apps you would compare it to, row by row."
          >
            How Suede Sing compares
          </SectionHeading>
          <div className="mt-8">
            <ComparisonTable />
          </div>
        </div>
      </section>

      {/* 7 — Pro teaser. The old "How practice works" section sat here:
              three steps the hero sentence and the beginner path already
              walk through, and a fourth on-device claim. */}
      <section className="border-t border-line">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
            <div>
              <SectionLabel className="mb-4 border-violet/50 text-violet-ink">
                Suede Pro · Early Access
              </SectionLabel>
              <h2 className="max-w-xl text-2xl sm:text-3xl">
                The coach on top of the studio
              </h2>
              {/* One sentence, with the price in it: what Pro is and costs,
                  before the bullets itemize it. */}
              <p className="mt-3 max-w-xl text-mut">
                Suede Pro is the coach on top of the free studio, {PRO_PRICE} once
                for life: no daily practice limit, the full daily plan, per-note
                accuracy, pitch analysis on every take, and both books.
              </p>
              <ul className="mt-5 space-y-2.5">
                {[
                  `Both books in full: ${TOTAL_CHAPTERS} chapters, ${TOTAL_WORDS.toLocaleString("en-US")} words, two PDFs to keep`,
                  // The free plan is built the same way and shows its first
                  // two steps, the weak-note siren first unless a range test
                  // is due (lib/pro.ts PRO_PERKS "coach"): Pro's part is the
                  // rest of the plan.
                  "The whole daily practice plan, not just the first two steps the free plan shows",
                  // /pro's wording. The weekly score trend is on the free
                  // plan; Pro's accuracy chart is one tally per note with no
                  // time axis, and only the range is charted over time.
                  "A per-note accuracy chart, and your range charted over months",
                  "Pitch analysis on every recorded take",
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
                {/* The priced button lands on the buy card; the quieter link
                    is for the reader who wants the whole page first. */}
                {/* Never sold to an owner: NotPro hides the priced asks
                    for a Pro browser before the first paint. */}
                <NotPro>
                  <LinkButton href="/pro#buy" variant="violet" size="lg">
                    {`Go Pro: ${PRO_PRICE} once`}
                  </LinkButton>
                </NotPro>
                <LinkButton href="/pro" variant="ghost" size="lg">
                  See everything Pro adds
                </LinkButton>
              </div>
              {/* The price used to appear nowhere on this page. One line: the
                  sold-out monthly plan and its footnotes belong on /pro. */}
              <NotPro as="p" className="mt-5 font-mono text-xs uppercase tracking-[0.14em] text-dim">
                {PRO_PRICE_LINE}
                <span className="mx-2 text-line2">·</span>Never renews
              </NotPro>
            </div>
            <ProVisual />
          </div>
        </div>
      </section>

      {/* 9 — Privacy strip */}
      <section className="border-t border-line bg-panel/40">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 sm:px-6">
          <p className="max-w-xl text-sm text-mut">
            <span className="text-ink">Your voice stays yours.</span> All audio
            analysis runs on this device. No audio is uploaded, and there are
            no ads.
          </p>
        </div>
      </section>

      {/* 10 — Final CTA */}
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
          <NotPro as="p" className="mt-6 font-mono text-xs uppercase tracking-[0.14em] text-dim">
            Ready for the coach?{" "}
            <Link
              href="/pro#buy"
              className="text-violet-ink underline decoration-violet/50 underline-offset-4 hover:decoration-violet"
            >
              {`Suede Pro is ${PRO_PRICE} once`}
            </Link>
          </NotPro>
        </div>
      </section>
    </main>
  );
}
