import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE } from "@/lib/og";
import Link from "next/link";
import { LinkButton, PageShell, SectionHeading, SectionLabel } from "@/components/ui";
import { ProChip } from "@/components/pro/ui";
import V2TraceGlyph from "@/components/v2-glyph";
import { SINGERS } from "@/lib/singers";
import { proHeadlineLong } from "@/lib/pro-shared";
import { SITE_URL } from "@/lib/site";

const TITLE = "What's New in Suede Sing 3.1: Changelog";
const DESCRIPTION =
  "Suede Sing 3.1: a 102-lesson voice curriculum, multi-week practice programs, microphone-scored songs with mastery, breath and vibrato measurement, and a sharper pitch engine. Plus the v2 story and the month-by-month release log.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/changelog` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/changelog`,
    siteName: "Suede Sing",
    type: "website",
    locale: "en_US",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

// py-0.5 is not decoration: these are standalone calls to action in a row of
// their own, not links inside a sentence, so WCAG 2.5.8's inline exception does
// not cover them and a 20px line box is under the 24px minimum. The padding
// raises the press target to 24px; the underline sits on the text and does not
// move with it.
const linkClass =
  "inline-block py-0.5 text-sm text-ink underline decoration-line2 underline-offset-4 transition-colors hover:decoration-ink";

type Story = {
  label: string;
  title: string;
  body: string;
  links: Array<{ href: string; text: string }>;
};

/** The 3.1 stories, told in the order a singer meets them. */
const RELEASE_STORIES: Story[] = [
  {
    label: "Lessons",
    title: "A voice curriculum, 102 lessons deep",
    body: "The full Suede voice course now lives here: 7 stages, 34 modules and 102 lessons, from posture and breath through the passaggio to mix and range. Modules link straight into the room that trains them, show your practice history from that room, and measure against the same 50-cent in-tune tolerance the studio scores with. A new Learn hub maps the whole path, with a 20-minute first session and a seven-day starter plan.",
    links: [
      { href: "/learn/voice", text: "Start the course" },
      { href: "/learn", text: "Open the Learn hub" },
    ],
  },
  {
    label: "Programs",
    title: "Multi-week programs, worked day by day",
    body: "Six named programs, from a one-week recovery plan to the twelve-week plan from The Measured Voice. Each practice day runs 10 to 20 minutes of routines, breath sets, songs and range-test check-ins, every item deep-linked to the exact step it opens. Four programs are free, and the two Pro programs open their first week free.",
    links: [{ href: "/programs", text: "Choose a program" }],
  },
  {
    label: "Songs",
    title: "Songs that listen, and remember",
    body: "Pick a pass: Listen, Sing along with the guide under your voice, or On your own. Songs earn star grades and a mastery mark, and mastering two songs in a band opens the next of five bands. Set an A-to-B loop with two handles that snap to note starts, record your take and play it back in the summary, and run tempo anywhere from 25% to 125% in 5% steps, or on Auto, which follows your last loop's score. A short taste quiz picks your first songs.",
    links: [{ href: "/songs", text: "Sing the songs" }],
  },
  {
    label: "Measurement",
    title: "Breath and vibrato, measured",
    body: "The microphone now hears you breathe in. A 2048-point spectral classifier tracks its own adaptive noise floor and marks an unvoiced inhale of 0.25 to 2.5 seconds, and the breath drills wait for it. Vibrato drills read the rate in hertz and the width in cents of every hold against a 5 to 7 Hz target band. New drill sets cover vibrato, vocal recovery, mix and high notes.",
    links: [
      { href: "/breath", text: "Open breath training" },
      { href: "/warmups", text: "Open the warmups" },
    ],
  },
  {
    label: "Pitch engine",
    title: "A sharper pitch engine",
    body: "The NSDF detector now reads through a 4 kHz low-pass, takes a true median of four readings, and rejects 50 and 60 Hz mains hum and periodic room tone while still hearing quiet voices. Measured on our precision harness, vibrato bias fell from 5.5 cents to 0.7 cents. Every room that listens gets the upgrade.",
    links: [{ href: "/studio", text: "Step into the studio" }],
  },
  {
    label: "Daily practice",
    title: "A plan for today, and a report for the week",
    body: "Today's three picks three exercises each day from your own scores, each starting at a tempo set by your recent results. Warmup routines run themselves in a full-screen session across warmups, ear training and breath. On the first visit of a new week, your progress page sums up the week before. And Note Catcher joins ear training: steer with your voice and hold within the target for 0.4 seconds to catch each note, including chases built from the songbook.",
    links: [
      { href: "/warmups", text: "See today's three" },
      { href: "/ear-training", text: "Play Note Catcher" },
    ],
  },
];

/** The five v2 stories, told in the order a singer meets them. */
const STORIES: Story[] = [
  {
    label: "Warmups",
    title: "Warmups that sing with you",
    body: "Press start and the guide sounds under your voice — taught once, then continuous — with a real breath and a two-click count-in before every rep. Ladders climb to the top of your range, walk back down, and keep going as far as your voice does. And the score follows the phrase you actually sang.",
    links: [{ href: "/warmups", text: "Open the warmups" }],
  },
  {
    label: "Accounts",
    title: "Your practice record, kept",
    body: "Until now this browser held the only copy of your sessions, streaks and range history. A free account backs that record up and restores it on any device you sign into. The backup carries your numbers — never your audio: pitch analysis still runs entirely on your own machine.",
    links: [{ href: "/progress", text: "See your progress" }],
  },
  {
    label: "Library",
    title: "A deeper reference shelf",
    body: `The singers library now holds ${SINGERS.length} famous voices — every range drawn on one keyboard, with records pages for the widest, highest and lowest. The Voice Atlas joined The Measured Voice as the second book, both open their first chapters free, and a vocal glossary sits underneath. The song section adds real songs with guided, scored melodies.`,
    links: [
      { href: "/singers", text: "Browse the singers" },
      { href: "/book", text: "Read the books" },
      { href: "/songs", text: "Sing the songs" },
    ],
  },
  {
    label: "Tools",
    title: "New rooms, sharper tools",
    body: "The voice analyzer opens: a spectrogram of your own harmonics, tone, and vocal load from any sung phrase. The studio lets you pick exactly which microphone it listens to, and the range test says plainly when it hears too little to judge. Beyond this tab, a Chrome extension puts the coach in your side panel, and Suede Voice carries the range test to iPhone.",
    links: [
      { href: "/analyze", text: "Analyze your voice" },
      { href: "/extension", text: "Get the extension" },
    ],
  },
  {
    label: "Design",
    title: "A calmer room",
    body: "v2 rebuilt the site's voice: an editorial serif for the headings, a real type scale beneath it, and one meaning for violet — gold now only ever marks Pro. Ten focused tabs replace thirteen, and cards lift when they are clickable. A practice room is a console, and it finally reads like one.",
    links: [{ href: "/studio", text: "Step into the studio" }],
  },
];

/**
 * The running log. Curated by hand: user-facing changes only, one line each,
 * newest first. This is public release copy, not a commit mirror — keep it to
 * what a singer can see and use.
 */
const LOG: Array<{
  month: string;
  entries: Array<{ day: string; note: string }>;
}> = [
  {
    month: "September 2026",
    entries: [
      { day: "25", note: "Suede Sing 3.1." },
      {
        day: "23",
        note: "Breath detection: the microphone hears the inhale, and breath drills wait for it.",
      },
      {
        day: "23",
        note: "Multi-week programs, including the twelve-week plan from The Measured Voice, with week 1 of every Pro program free.",
      },
      {
        day: "23",
        note: "New drills for vibrato, recovery, mix and high notes, with vibrato rate and width measured on every hold.",
      },
      {
        day: "23",
        note: "All 102 voice lessons, across 7 stages and 34 modules, now on Suede Sing.",
      },
      { day: "23", note: "Your week: a weekly report on the first visit of a new week." },
      { day: "23", note: "Today's three: a daily set that adapts to your scores." },
      { day: "23", note: "Note Catcher, a pitch-steered catching game, with song chases." },
      { day: "23", note: "A taste quiz that picks your first songs." },
      { day: "23", note: "Record your take inside a song and play it back in the summary." },
      { day: "23", note: "Loop any span of a song with two handles." },
      {
        day: "23",
        note: "Pitch engine: a 4 kHz pre-filter and a true median bring vibrato bias down to 0.7 cents.",
      },
      {
        day: "23",
        note: "The Learn hub: a map of vocal training, with a 20-minute first session and a seven-day plan.",
      },
      {
        day: "5",
        note: "Song mastery: Listen, Sing along and On your own passes, five bands, and breath marks in the lyrics.",
      },
      {
        day: "5",
        note: "Songs gain rehearsal and performance modes, and tempo from 25% to 125% with Auto.",
      },
      { day: "4", note: "See your tone: a door to the analyzer from every results screen." },
      {
        day: "3",
        note: "Full-screen practice sessions across warmups, ear training and breath.",
      },
      { day: "3", note: "Warmup routines that run themselves, start to finish." },
      {
        day: "2",
        note: "Song-range pages suggest a first practice step fitted to your saved range.",
      },
      {
        day: "2",
        note: "The pitch detector ignores room tone and 50/60 Hz mains hum, and still hears quiet voices.",
      },
      {
        day: "1",
        note: "Can you sing it? Vocal-range pages for 22 popular songs, with a verdict against your range.",
      },
    ],
  },
  {
    month: "August 2026",
    entries: [
      { day: "24", note: "Early Access plans open: $4.99 a month or $79 for life." },
      {
        day: "23",
        note: "Warmups sing with you — a continuous guide under your voice, scored against the phrase you actually sang.",
      },
      { day: "22", note: "Pick which microphone the studio listens to." },
      {
        day: "22",
        note: "A second typeface, a real type scale, and one meaning for violet.",
      },
      {
        day: "21",
        note: "Free accounts: your practice record, backed up and restorable anywhere.",
      },
      {
        day: "21",
        note: "Warmup ladders climb to your top note, walk back down, and keep going.",
      },
      {
        day: "19",
        note: "Ten focused tabs — Recorder and Analyze join Tools; the books share a shelf.",
      },
      {
        day: "17",
        note: "The Chrome extension arrives: a vocal coach in the side panel, with a pitch meter over YouTube.",
      },
      {
        day: "16",
        note: "The range test asks for notes your microphone can measure — and says when it hears too little.",
      },
      { day: "15", note: "Both books open their first chapters, free." },
      {
        day: "14",
        note: "The voice analyzer opens: spectrogram, tone, and vocal load.",
      },
      {
        day: "4",
        note: "Suede Voice, the iPhone companion, takes its place beside the studio.",
      },
      {
        day: "3",
        note: "The song section opens: real songs, guided melodies, scored practice.",
      },
      {
        day: "2",
        note: "The Voice Atlas: a second book, with a free indexed contents page.",
      },
    ],
  },
  {
    month: "July 2026",
    entries: [
      {
        day: "30",
        note: "Suede Sing goes live: ten practice rooms, live pitch feedback, a free range test, and the famous-singers range library.",
      },
      {
        day: "30",
        note: "Suede Pro opens with The Measured Voice, a 23-chapter companion book.",
      },
    ],
  },
];

function StoryBlock({ story }: { story: Story }) {
  return (
    <section>
      <SectionHeading label={story.label} lede={story.body}>
        {story.title}
      </SectionHeading>
      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        {story.links.map((l, i) => (
          <span key={l.href} className="flex items-center gap-3">
            {i > 0 && (
              <span aria-hidden className="text-line2">
                ·
              </span>
            )}
            <Link href={l.href} className={linkClass}>
              {l.text}
            </Link>
          </span>
        ))}
      </p>
    </section>
  );
}

export default function ChangelogPage() {
  const entriesLogged = LOG.reduce((n, m) => n + m.entries.length, 0);

  return (
    <PageShell
      kicker="Changelog"
      title={
        <>
          What we&apos;ve <em>changed</em>
        </>
      }
      subtitle="Suede Sing 3.1: a full voice curriculum, programs that plan your weeks, songs that score and remember you, and a pitch engine measured to the cent."
    >
      {/* The record head: the page's one accented surface. Cool hairline and
          trace glyph up top, tape counters below — data as ornament. */}
      <div className="well relative flex flex-wrap items-center gap-x-3 gap-y-1 overflow-hidden rounded-2xl px-4 py-3 font-mono text-label uppercase tracking-[0.14em] text-dim">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cool to-transparent"
        />
        <V2TraceGlyph className="shrink-0 text-cool" />
        <span className="text-ink">3.1</span>
        <span aria-hidden className="text-line2">
          ·
        </span>
        <span>Shipped Sep 2026</span>
        <span aria-hidden className="text-line2">
          ·
        </span>
        <span className="tabular">{RELEASE_STORIES.length} stories</span>
        <span aria-hidden className="text-line2">
          ·
        </span>
        <span className="tabular">{entriesLogged} entries logged</span>
      </div>

      <div className="mt-12 space-y-12">
        {RELEASE_STORIES.map((s) => (
          <StoryBlock key={s.label} story={s} />
        ))}
      </div>

      <section aria-label="Suede Sing v2" className="mt-14 border-t border-line2 pt-8">
        <SectionLabel>Earlier: v2, August 2026</SectionLabel>
        <p className="mt-3 max-w-prose text-meta text-mut">
          The studio rebuilt panel by panel: warmups that sing with you, free
          accounts that keep your record, a deeper library, and a calmer room
          around all of it.
        </p>
      </section>

      <div className="mt-8 space-y-12">
        {STORIES.map((s) => (
          <StoryBlock key={s.label} story={s} />
        ))}
      </div>

      {/* The page's one violet moment, because this surface genuinely is Pro. */}
      <section className="relative mt-14 overflow-hidden rounded-2xl border border-violet/50 bg-panel p-5 sm:p-6">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet to-transparent"
        />
        <ProChip />
        <h2 className="mt-3 text-2xl sm:text-3xl">{proHeadlineLong()}</h2>
        <p className="mt-3 max-w-prose text-mut">
          Both books in full, the pro warmup packs, pitch analysis on every
          take, your range history, and cloud sync. v2 grew the free studio;
          Pro is what keeps it free.
        </p>
        <LinkButton href="/pro" variant="violet" size="md" className="mt-5">
          See what Pro adds
        </LinkButton>
      </section>

      <section aria-label="Release log" className="mt-14 border-t border-line2 pt-8">
        <SectionLabel>The running log</SectionLabel>
        <div className="mt-6 space-y-10">
          {LOG.map((m) => (
            <div key={m.month}>
              <h3 className="font-mono text-label font-medium uppercase tracking-[0.14em] text-dim">
                {m.month}
              </h3>
              <ul className="mt-4 space-y-3 border-l border-line pl-5">
                {m.entries.map((e, i) => (
                  <li
                    key={`${m.month}-${i}`}
                    className="flex gap-3 text-meta text-mut"
                  >
                    <span className="tabular w-5 shrink-0 text-right font-mono text-dim">
                      {e.day}
                    </span>
                    <span>{e.note}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
