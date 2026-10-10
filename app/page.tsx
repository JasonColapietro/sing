import type { Metadata } from "next";
import Link from "next/link";
import { formatPrice, PRICING, proHeadlineLong } from "@/lib/pro-shared";
import { TOTAL_CHAPTERS, TOTAL_WORDS } from "@/lib/pro-inventory";
import { SONGS } from "@/components/songs/data";
import { SINGERS } from "@/lib/singers";
import { ORG_NODE } from "@/lib/organization";
import { SITE_URL } from "@/lib/site";
import { LinkButton, SectionLabel } from "@/components/ui";
import { FamousVoices } from "@/components/landing/famous-voices";
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

/** The complete Early Access offer, shared with every other sales surface. */
const PRO_PRICE_LINE = proHeadlineLong();
const PRO_MONTHLY_PRICE = formatPrice(PRICING.monthly.amount);

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
    desc: "Warmup routines from five to fifteen minutes, every exercise scored as you sing.",
    Glyph: WarmupGlyph,
  },
  {
    href: "/range",
    label: "Range test",
    desc: "Find your lowest and highest notes and get a voice-type estimate.",
    Glyph: RangeGlyph,
  },
  {
    href: "/singers",
    label: "Famous ranges",
    desc: "Famous voices on one keyboard — see whose range matches yours.",
    Glyph: SingersGlyph,
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
    desc: "Practice melodies auto-transposed into your comfortable range.",
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
  "Online singing practice with live pitch feedback, warmups and songs. The pitch meter and range test are free; guided practice is 3 free minutes a day.";

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
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#app`,
      name: "Suede Sing",
      description: HOME_DESCRIPTION,
      applicationCategory: "MusicApplication",
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
        description: "Guided practice includes three free minutes a day; additional practice and Pro features require a paid plan.",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
    },
  ],
};

/** Cover gradients for the song carousel, cycled so neighbours never match. */
const COVERS = [
  "from-[#7c3aed] to-[#ff4fa3]",
  "from-[#0ea5e9] to-[#7c3aed]",
  "from-[#ff4fa3] to-[#ffc24a]",
  "from-[#10b981] to-[#0ea5e9]",
  "from-[#f97316] to-[#ff4fa3]",
  "from-[#6366f1] to-[#22d3ee]",
];

const LESSONS = [
  { href: "/warmups", label: "Warmups", desc: "5 to 15 minute routines", Glyph: WarmupGlyph },
  { href: "/ear-training", label: "Ear training", desc: "Intervals and pitch matching", Glyph: EarGlyph },
  { href: "/breath", label: "Breath", desc: "Support and sustain", Glyph: BreathGlyph },
  { href: "/learn", label: "Learn", desc: "The voice course and books", Glyph: ProgressGlyph },
];

const TOOLS = FEATURES.filter((f) =>
  ["/analyze", "/studio", "/recorder", "/tools", "/singers"].includes(f.href),
);

export default function Home() {
  const songs = SONGS.slice(0, 12);
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(HOME_JSON_LD) }}
      />

      {/* Hero: one job, start singing. */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#2a1460] via-[#3b1670] to-[#5b1450] px-6 py-10 sm:px-12 sm:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-pink/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 size-80 rounded-full bg-violet/40 blur-3xl"
        />
        <div className="relative max-w-2xl">
          <p className="text-label font-extrabold uppercase tracking-[0.14em] text-pink">
            Suede Sing · from Suede AI
          </p>
          <h1 className="mt-3 text-[clamp(2.4rem,7vw,4.25rem)] leading-[1.02]">
            Online singing practice with live pitch feedback
          </h1>
          <p className="mt-4 max-w-xl text-lg text-mut">
            Suede Sing is a singing practice app that runs in your browser: sing
            into your mic and see the note you are singing, in real time. Warm up
            with guided singing exercises, practice songs in your key, or take
            the vocal range test.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <LinkButton href="/range" variant="violet" size="lg">
              Start singing
            </LinkButton>
            <LinkButton href="/range?mode=range" variant="outline" size="lg">
              Find my vocal range
            </LinkButton>
          </div>
          <p className="mt-5 text-sm text-dim">
            The pitch meter and range test are free with no time limit. Guided
            practice includes three free minutes a day. No install; audio stays
            on your device.
          </p>
        </div>
      </section>

      {/* Today */}
      <section className="mt-10" aria-labelledby="today">
        <h2 id="today" className="text-2xl sm:text-3xl">
          Start today&apos;s practice
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Link
            href="/warmups"
            className="lift group relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0e6b5a] to-[#0b3d4f] p-6"
          >
            <span className="text-label font-extrabold uppercase tracking-[0.14em] text-ok-ink">
              Daily workout
            </span>
            <span className="mt-2 block text-2xl font-extrabold">Warm up your voice</span>
            <span className="mt-1 block text-mut">
              A short guided routine, every note scored as you sing.
            </span>
            <span className="mt-5 inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm font-bold text-bg">
              Start workout
            </span>
          </Link>
          <Link
            href="/range"
            className="lift group relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#4c1d95] to-[#1e1b4b] p-6"
          >
            <span className="text-label font-extrabold uppercase tracking-[0.14em] text-violet-ink">
              Pitch meter
            </span>
            <span className="mt-2 block text-2xl font-extrabold">How in tune are you?</span>
            <span className="mt-1 block text-mut">
              Hold a note and watch the line. Green means you nailed it.
            </span>
            <span className="mt-5 inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm font-bold text-bg">
              Open pitch meter
            </span>
          </Link>
        </div>
      </section>

      {/* Songs carousel */}
      <section className="mt-12" aria-labelledby="songs">
        <div className="flex items-end justify-between gap-4">
          <h2 id="songs" className="text-2xl sm:text-3xl">
            Sing a song in your key
          </h2>
          <Link href="/songs" className="text-sm font-bold text-violet-ink hover:text-ink">
            See all {SONGS.length} practice songs
          </Link>
        </div>
        <ul className="no-scrollbar -mx-4 mt-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
          {songs.map((song, i) => (
            <li key={song.id} className="w-40 shrink-0 snap-start sm:w-48">
              <Link href={`/songs/${song.slug}`} className="group block">
                <span
                  className={`lift flex aspect-square items-end rounded-3xl bg-gradient-to-br p-4 ${COVERS[i % COVERS.length]}`}
                >
                  <span aria-hidden className="text-white/90">
                    <SongGlyph />
                  </span>
                </span>
                <span className="mt-2 block truncate font-bold text-ink group-hover:text-violet-ink">
                  {song.title}
                </span>
                <span className="block truncate text-sm text-dim">{song.genre}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Lessons */}
      <section className="mt-12" aria-labelledby="lessons">
        <h2 id="lessons" className="text-2xl sm:text-3xl">
          Vocal exercises and lessons
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {LESSONS.map(({ href, label, desc, Glyph }) => (
            <Link
              key={href}
              href={href}
              className="lift rounded-3xl border border-line bg-panel p-5 hover:border-violet/50"
            >
              <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-violet/15 text-violet-ink">
                <Glyph />
              </span>
              <span className="mt-4 block text-lg font-extrabold">{label}</span>
              <span className="mt-0.5 block text-sm text-mut">{desc}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Tools */}
      <section className="mt-12" aria-labelledby="tools">
        <h2 id="tools" className="text-2xl sm:text-3xl">
          Singing practice tools
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map(({ href, label, desc, Glyph }) => (
            <Link
              key={href}
              href={href}
              className="lift flex items-start gap-4 rounded-3xl border border-line bg-panel p-5 hover:border-violet/50"
            >
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-panel2 text-pink">
                <Glyph />
              </span>
              <span>
                <span className="block font-extrabold">{label}</span>
                <span className="mt-0.5 block text-sm text-mut">{desc}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Famous voices: head-query singer pages, linked from the strongest
          page on the subdomain. */}
      <div className="-mx-4 mt-12 sm:-mx-6">
        <FamousVoices />
      </div>

      {/* Pro */}
      <section className="mt-12 overflow-hidden rounded-[2rem] border border-violet/40 bg-panel">
        <div className="grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-2">
          <div>
            <SectionLabel className="mb-4">Suede Pro · Early Access</SectionLabel>
            <h2 className="max-w-xl text-2xl sm:text-3xl">Practice without the clock</h2>
            <p className="mt-3 max-w-xl text-mut">
              The pitch meter, the range test and {SINGERS.length} measured voices
              are free. Free accounts get three minutes of guided practice a
              day. Pro removes the clock and adds both books ({TOTAL_CHAPTERS}{" "}
              chapters, {TOTAL_WORDS.toLocaleString("en-US")} words), pitch
              analysis on every take, and your range charted over months.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <LinkButton href="/pro" variant="violet" size="lg">
                See Suede Pro
              </LinkButton>
            </div>
            <p className="mt-4 text-xs font-bold text-dim">
              {PRO_PRICE_LINE} · The {PRO_MONTHLY_PRICE} monthly price stays
              while your subscription remains active · Monthly cancels anytime ·
              Lifetime never renews
            </p>
          </div>
          <ProVisual />
        </div>
      </section>

      <p className="mt-10 text-center text-sm text-dim">
        <span className="text-ink">Your voice stays yours.</span> All audio
        analysis runs on this device. Nothing is uploaded and there are no ads.
      </p>
    </main>
  );
}
