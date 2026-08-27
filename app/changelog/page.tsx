import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE } from "@/lib/og";
import Link from "next/link";
import { LinkButton, PageShell, SectionHeading, SectionLabel } from "@/components/ui";
import { ProChip } from "@/components/pro/ui";
import V2TraceGlyph from "@/components/v2-glyph";
import { SINGERS } from "@/lib/singers";
import { proHeadlineLong } from "@/lib/pro-shared";
import { SITE_URL } from "@/lib/site";

const TITLE = "What's New in Suede Sing v2 — Changelog";
const DESCRIPTION =
  "Suede Sing v2, room by room: warmups that sing along with you, free accounts that back up your practice record, a voice analyzer, a deeper singers library, and a calmer design — with the month-by-month release log.";

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

const linkClass =
  "text-sm text-ink underline decoration-line2 underline-offset-4 transition-colors hover:decoration-ink";

/** The five v2 stories, told in the order a singer meets them. */
const STORIES: Array<{
  label: string;
  title: string;
  body: string;
  links: Array<{ href: string; text: string }>;
}> = [
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
    body: "v2 rebuilt the site's voice: an editorial serif for the headings, a real type scale beneath it, and one meaning for amber — gold now only ever marks Pro. Ten focused tabs replace thirteen, and cards lift when they are clickable. A practice room is a console, and it finally reads like one.",
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
        note: "A second typeface, a real type scale, and one meaning for amber.",
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
      subtitle="Suede Sing v2: the studio rebuilt panel by panel — warmups that sing with you, free accounts that keep your record, a deeper library, and a calmer room around all of it."
    >
      {/* The record head: the page's one accented surface. Cool hairline and
          trace glyph up top, tape counters below — data as ornament. */}
      <div className="well relative flex flex-wrap items-center gap-x-3 gap-y-1 overflow-hidden rounded-2xl px-4 py-3 font-mono text-label uppercase tracking-[0.14em] text-dim">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cool to-transparent"
        />
        <V2TraceGlyph className="shrink-0 text-cool" />
        <span className="text-ink">V2</span>
        <span aria-hidden className="text-line2">
          ·
        </span>
        <span>Shipped Aug 2026</span>
        <span aria-hidden className="text-line2">
          ·
        </span>
        <span className="tabular">{STORIES.length} stories</span>
        <span aria-hidden className="text-line2">
          ·
        </span>
        <span className="tabular">{entriesLogged} entries logged</span>
      </div>

      <div className="mt-12 space-y-12">
        {STORIES.map((s) => (
          <section key={s.label}>
            <SectionHeading label={s.label} lede={s.body}>
              {s.title}
            </SectionHeading>
            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
              {s.links.map((l, i) => (
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
        ))}
      </div>

      {/* The page's one amber moment, because this surface genuinely is Pro. */}
      <section className="relative mt-14 overflow-hidden rounded-2xl border border-amber/50 bg-panel p-5 sm:p-6">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber to-transparent"
        />
        <ProChip />
        <h2 className="mt-3 text-2xl sm:text-3xl">{proHeadlineLong()}</h2>
        <p className="mt-3 max-w-prose text-mut">
          Both books in full, the pro warmup packs, pitch analysis on every
          take, your range history, and cloud sync. v2 grew the free studio;
          Pro is what keeps it free.
        </p>
        <LinkButton href="/pro" variant="amber" size="md" className="mt-5">
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
