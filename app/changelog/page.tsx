import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE } from "@/lib/og";
import Link from "next/link";
import { LinkButton, PageShell, SectionHeading, SectionLabel } from "@/components/ui";
import { ProChip } from "@/components/pro/ui";
import V2TraceGlyph from "@/components/v2-glyph";
import { SINGERS } from "@/lib/singers";
import { formatPrice, PRICING, proHeadlineLong } from "@/lib/pro-shared";
import { SITE_URL, rangeTestHref } from "@/lib/site";
import { routeKeywords } from "@/lib/keywords";
import { webPageJsonLd } from "@/lib/page-jsonld";
import { accountsReady } from "@/lib/accounts";
import { FREE_DAILY_MINUTES } from "@/lib/practice-limits";
import { IDLE_GRACE_MS } from "@/components/practice/active-clock";

/**
 * Accounts were built in v2 but are not open on every deployment
 * (lib/accounts.ts). The account copy below says what a visitor can actually
 * do on this one, so it never sells a backup they cannot create.
 */
const ACCOUNTS_OPEN = accountsReady();

const TITLE = "Suede Sing Changelog: What's New in 4.2";
/** The day 4.2 shipped: the record head's <time> and the page's dateModified. */
export const RELEASE_DATE = "2026-10-29";
const DESCRIPTION =
  "Suede Sing changelog for 4.2: calmer room pages, share cards drawn in the site's own type, a clearer Pro page, and 4.1's example figures in every room.";

export const metadata: Metadata = {
  keywords: routeKeywords("/changelog"),
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

// min-h-11 is not decoration: these are standalone calls to action in a row of
// their own, not links inside a sentence, so WCAG 2.5.8's inline exception does
// not cover them, and a 20px line box measured about 24px even with padding.
// The 44px box matches the site's other tap targets; the underline sits on the
// text and does not move with it.
const linkClass =
  "inline-flex min-h-11 items-center text-sm text-ink underline decoration-line2 underline-offset-4 transition-colors hover:decoration-ink";

type Story = {
  label: string;
  title: string;
  body: string;
  links: Array<{ href: string; text: string }>;
};

/**
 * The 4.2 stories (fleet pass 5, October 29), in the order a singer meets
 * them. Each names something on screen in this release.
 */
const RELEASE_STORIES: Story[] = [
  {
    label: "Rooms",
    title: "Calmer room pages",
    body: "The section labels inside every room (The short version, How to do it, Questions, Where to go next, More practice rooms) are now a short gold rule and a line of small capitals instead of a boxed pill, so the boxes no longer outnumber the things they label. The page's own label at the top keeps its pill.",
    links: [{ href: "/breath", text: "Open the breath room" }],
  },
  {
    label: "Sharing",
    title: "Share cards that look like the site",
    body: "A shared Suede Sing link now shows a card set in the site's own serif. The homepage card draws a pitch trace settling onto its note; the Pro card shows a small example coach report, with one weak note flagged; a singer's card shows their reported span in teal on a keyboard with proper black keys, in the same octave count the page gives.",
    links: [{ href: "/singers", text: "Find a singer to share" }],
  },
  {
    label: "Home",
    title: "See the studio before you open it",
    body: "The homepage now shows what the studio draws, an example pitch trace finding its note, beside the two ways to start. The Pro section lists each thing Pro adds once, starting with no daily limit on guided practice, and prints the price once, on its button.",
    links: [{ href: "/", text: "See the homepage" }],
  },
  {
    label: "Pro",
    title: "A Pro page that gets to the point",
    body: "The price button at the top of the Pro page now opens checkout itself instead of scrolling to a second, identical button. Both books are shown with their covers above their chapter lists. Short Pro notes inside the practice rooms read as ordinary sentences rather than small capitals, and the card after a session states the price once.",
    links: [{ href: "/pro", text: "See what Pro adds" }],
  },
  {
    label: "Footer",
    title: "A footer that reads the same everywhere",
    body: "The By voice type and By genre columns now have headings on a wide screen, set in the same small capitals as the other columns. On a phone they still fold away, and their labels no longer switch to the serif.",
    links: [{ href: "/singers", text: "Browse the singers" }],
  },
];

/**
 * The 4.1 stories (fleet pass 4, #263, October 28), as a singer meets them.
 */
const RELEASE_41_STORIES: Story[] = [
  {
    label: "Rooms",
    title: "An example of what each room draws",
    body: "The range test, studio, songs, recorder and analyzer now show a small example drawing before you turn the microphone on: a range on a keyboard, a pitch trace, a piano roll, a take's waveform and a spectrogram. Each is labelled as sample data, so you know what to expect before the browser asks for the mic.",
    links: [
      { href: "/studio", text: "Step into the studio" },
      { href: "/analyze", text: "Open the analyzer" },
    ],
  },
  {
    label: "Songs",
    title: "Straight into the song",
    body: "A song's Sing button now opens straight into the count-in. Without a song picked, the microphone screen offers to pick one first, and a capped Sing again says why it is waiting.",
    links: [{ href: "/songs", text: "Sing the songs" }],
  },
  {
    label: "Singers",
    title: "Ranges you can compare at a glance",
    body: "Singer lists and the homepage's famous voices draw each range as a bar on a shared keyboard, and every singer page shows where that span sits among the whole catalog.",
    links: [{ href: "/singers", text: "Compare famous ranges" }],
  },
  {
    label: "Reading",
    title: "Books with covers, and a shorter homepage",
    body: "The Measured Voice and The Voice Atlas have covers and pull quotes on their pages, and both PDFs were rebuilt from the current chapters. The homepage is shorter, the studio's Stop ends on a card with the next rooms to try, and the free-minutes wall is shorter.",
    links: [
      { href: "/book", text: "Open The Measured Voice" },
      { href: "/atlas", text: "Open The Voice Atlas" },
    ],
  },
];

/**
 * The 4.0 stories, told in the order a singer meets them. 4.0 is what
 * shipped on main after 3.1 (September 24) up to October 24, and every claim
 * here points at a commit: the restored design and its menu (#229, #230),
 * the sampled piano and the phone and iOS audio fixes (7318aeb, f29a7be,
 * 1239eba, all September 25), the pitch meter beside the range test on /range (6d4ccdb; the Range tab itself opens the test, #229)
 * with #236's kept place and #238's warmup-first result, the free minutes
 * (#212) and the active-time clock (#226), program resumes, fortnights and
 * the program-aware coach (#224, #225, #238), and the song octave fixes and
 * the late microphone (#225, #226, #235). Every number is read from the code
 * that enforces it or, for the piano, from lib/audio/piano.ts's sample map.
 * Unmerged work (the pitch detector in #240, the mic release in #242) stays
 * out until it lands.
 */
const RELEASE_40_STORIES: Story[] = [
  {
    label: "Design",
    title: "The original Suede Sing, back",
    body: "The paper-and-portrait homepage and the original navigation are back. Ten tabs run across the top: Studio, Warmups, Range, Singers, Ear, Breath, Songs, Tools, Learn and Progress. On a phone, a button beside the logo opens the same ten as a menu, and wherever the tab row runs out of room, a Menu button keeps that list in reach.",
    links: [{ href: "/studio", text: "Step into the studio" }],
  },
  {
    label: "Range",
    title: "Sing one note, see where it lands",
    body: "The Range page now has a live pitch meter beside the guided range test: sing, and it shows the note you hit and whether it sits in tune, a little flat or sharp, or plainly off. The Range tab opens the range test, which finds your lowest and highest notes, and the meter is one tap away. A reload or Back keeps your place on the page, and a range result now leads with a warmup as the next step.",
    links: [
      { href: rangeTestHref({ mode: "pitch" }), text: "Open the pitch meter" },
      { href: rangeTestHref(), text: "Find my vocal range" },
    ],
  },
  {
    label: "Sound",
    title: "Reference notes on a recorded grand piano",
    body: "Warmups, songs, the range test and ear training now play their reference notes from recordings of a Yamaha C5 grand (Salamander Grand Piano V2 by Alexander Holm, CC BY 3.0), sampled every three semitones from A1 to C7, so once they have loaded, a steady note in that span plays from a recording at most a semitone away. The samples load in the background, and until a note's sample arrives a synthesized tone plays instead, now built with enough upper harmonics for a phone speaker to carry it. On iPhone, audio picks up again after the microphone, a call or a notification interrupts it, instead of freezing the player.",
    links: [{ href: "/warmups", text: "Open the warmups" }],
  },
  {
    label: "Free practice",
    title: "More free practice, and only practice counts",
    body: `Guided practice (warmups, ear training, breath and songs) now includes ${FREE_DAILY_MINUTES} free minutes a day, and the pitch studio, range test, recorder and tools stay free with no daily limit. The clock counts practice, not waiting: turn-based ear games and Breathe and sing leave out time the tab spends hidden and count at most ${IDLE_GRACE_MS / 1000} seconds of any stretch with no input. When a set stops at the limit, its result says why.`,
    links: [{ href: "/ear-training", text: "Play the ear games" }],
  },
  {
    label: "Programs",
    title: "Programs you can pick back up",
    body: "A routine you resume on a later day starts with a short warm-in of its first exercise. The Measured Voice program can go back a fortnight, and from a finished run you can repeat a single fortnight while your other check-in readings stay. The coach on Progress follows a running program's schedule instead of asking for a range test the plan has not set, and during Recovery week it leaves the range test and the octave siren out.",
    links: [
      { href: "/programs", text: "Choose a program" },
      { href: "/progress", text: "See your progress" },
    ],
  },
  {
    label: "Songs",
    title: "Songs that hear the octave you sing",
    body: "Sing a song an octave away from the written melody and the piano roll now draws your voice in the octave you sang. Per-note tallies and hardest notes are filed there too, so the coach no longer calls a low voice out of range. Without a saved range, a song scores one octave per pass. If you started without a microphone, the player and its summary offer to turn it on.",
    links: [{ href: "/songs", text: "Sing the songs" }],
  },
];

/** The 3.1 stories, kept as the previous release, in the order a singer meets them. */
const PREVIOUS_STORIES: Story[] = [
  {
    label: "Lessons",
    title: "A voice curriculum, 102 lessons deep",
    body: "The full Suede Sing voice course now lives here: 7 stages, 34 modules and 102 lessons, from posture and breath through the passaggio to style and performance. Every module links to a room to practice it in. Where that room measures part of the skill, such as pitch within 50 cents of the target in the warmups and songs, how long a sustain lasts, or the two ends of your range, the lesson says what that number does and does not show. A new Learn hub maps the whole path, with a 20-minute session template and a seven-day starter plan.",
    links: [
      { href: "/learn/voice", text: "Start the course" },
      { href: "/learn", text: "Open the Learn hub" },
    ],
  },
  {
    label: "Programs",
    title: "Multi-week programs, worked day by day",
    body: "Six named programs, from a one-week recovery plan to the twelve-week plan from The Measured Voice. Most practice days run 10 to 20 minutes of routines, breath sets, songs and range-test check-ins, every item deep-linked to the exact step it opens. Four programs are open to everyone, and the two Pro programs open their first week free.",
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
    body: "The microphone now hears you breathe in: the sustain test and a new Breathe and sing drill wait for your inhale before they start. Vibrato drills show you the rate in hertz and the width in cents of every hold against a 5 to 7 Hz target band. New drill sets cover vibrato, vocal recovery and high notes, plus a Pro mix set. Under the hood, a 2048-point spectral classifier tracks its own noise floor and marks an unvoiced inhale of 0.25 to 2.5 seconds.",
    links: [
      { href: "/breath", text: "Open breath training" },
      { href: "/warmups", text: "Open the warmups" },
    ],
  },
  {
    label: "Pitch engine",
    title: "A sharper pitch engine",
    body: "The meter holds steadier on a quiet voice and ignores mains hum and room tone: on a synthetic A3 vibrato in our precision harness, bias fell from 5.5 cents to 0.7 cents, and every live room gets the upgrade. Behind it, the NSDF detector now reads through a 4 kHz low-pass, takes a true median of four readings, and rejects 50 and 60 Hz hum and periodic room tone.",
    links: [{ href: "/studio", text: "Step into the studio" }],
  },
  {
    label: "Daily practice",
    title: "A plan for today, and a report for the week",
    body: "Today's three picks three warmups a day, weighted by your recent scores, each at a starting tempo those scores set. Routines run themselves, full-screen, across warmups, ear training and breath. On your first visit of a new week, a card sums up the week you just practiced. And Note Catcher joins ear training: steer with your voice and hold on each target for 0.4 to 0.6 seconds, by difficulty, to catch it, including chases built from the songbook.",
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
    body: "Press start and the guide sounds under your voice (taught once, then continuous) with a real breath and a two-click count-in before every rep. Ladders climb a semitone each rep, walk back down, and keep going. And the score follows the phrase you actually sang.",
    links: [{ href: "/warmups", text: "Open the warmups" }],
  },
  {
    label: "Accounts",
    title: "Your practice record, kept",
    // With accounts closed, "until now this browser held the only copy" would
    // be contradicted a sentence later, so that deployment gets its own body.
    body: ACCOUNTS_OPEN
      ? "Until now this browser held the only copy of your sessions, streaks and range history. A free account backs that record up and restores it on any device you sign into. The backup carries your numbers, never your audio: pitch analysis still runs entirely on your own machine."
      : "v2 built an account backup for your sessions, streaks and range history, restored on any device you sign into. Accounts are not open on this site yet; until they are, your record stays in this browser (Pro's cloud sync also backs it up) and can be exported from Progress. The backup carries your numbers, never your audio: pitch analysis still runs entirely on your own machine.",
    links: [{ href: "/progress", text: "See your progress" }],
  },
  {
    label: "Library",
    title: "A deeper reference shelf",
    body: `The singers library now holds ${SINGERS.length} famous voices: every range drawn on one keyboard, with records pages for the widest, highest and lowest. The Voice Atlas joined The Measured Voice as the second book, both open their first chapters free, and a vocal glossary sits underneath. The song section adds real songs with guided, scored melodies.`,
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
    body: "v2 rebuilt the site's voice: an editorial serif for the headings, a real type scale beneath it, and one meaning for violet. Gold now only ever marks Pro. Ten focused tabs replace thirteen, and cards lift when they are clickable. A practice room is a console, and it finally reads like one.",
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
    month: "October 2026",
    entries: [
      // Release lines are terse on purpose: the stories above say what shipped.
      { day: "29", note: "Suede Sing 4.2." },
      { day: "28", note: "Suede Sing 4.1." },
      { day: "24", note: "Suede Sing 4.0." },
      {
        // MIC_IDLE_RELEASE_MS in lib/audio/use-idle-mic-release.ts is the
        // "15 seconds"; keep the two in step.
        day: "24",
        note: "Warmups and Songs now turn the microphone off 15 seconds after a session ends, so the recording light no longer stays on while you read your score or browse. Starting again reopens it, and a silent stop offers a button to turn it off right away.",
      },
      {
        // Readings did not change: pitch-fft.test.ts and pitch-regressions.test.ts
        // hold the detector bit for bit to the old full scan. "About 700" and
        // "a twentieth" come from the pitch.ts header (~700 lags; 0.3 ms against
        // 5.8 ms per 4096-sample frame at 48 kHz, measured in Node), and the FFT
        // costs the same on noise as on a vowel. Nothing was timed on a phone, so
        // the note claims CPU, not frame rate. Dated by merge day in US Eastern
        // time; change the day if it merges later.
        day: "24",
        note: "Pitch engine: every frame reads exactly as before at about a twentieth of the CPU, in a noisy room or on a held note, because one FFT autocorrelation now replaces about 700 separate sums per frame.",
      },
      {
        // Undoes the navigation half of the October 2 entry below, which stays
        // as history. On phones the header button names the current room (it
        // reads "Menu" only off-tab), so the note describes it, not its label,
        // and its drawer lists the same ten LINKS as the header row.
        day: "15",
        note: "The original Suede Sing homepage and navigation are back: ten tabs across the top (Studio, Warmups, Range, Singers, Ear, Breath, Songs, Tools, Learn, Progress), and on phones a button beside the logo opens the same ten as a menu, in place of the bottom tab bar from October 2.",
      },
      {
        day: "11",
        note: "Fixes to practice timing, recorder recovery and the range-test journey.",
      },
      {
        day: "10",
        note: "Guided practice (warmups, ear training, breath and songs) is now five free minutes a day, up from three. The pitch studio, range test, recorder and tools stay free with no daily limit, and Pro removes the limit.",
      },
      {
        // The lifetime price did not change on the 9th; the monthly plan
        // stopped selling. Prices come from PRICING so the log cannot drift.
        // Legacy subscribers renew at their own (older) price, not the
        // current monthly figure, so the renewal clause names no amount.
        day: "9",
        note: `Pro is now sold as lifetime access only: ${formatPrice(PRICING.lifetime.amount)} once, with no renewal. The ${formatPrice(PRICING.monthly.amount)} monthly plan is sold out; existing monthly subscribers keep renewing at the price they signed up at.`,
      },
      {
        day: "2",
        note: "A phone-first redesign: five tabs with a bottom tab bar on phones, and a live pitch meter as the default voice test, with the guided range test one tap away.",
      },
    ],
  },
  {
    month: "September 2026",
    entries: [
      { day: "24", note: "Suede Sing 3.1." },
      {
        day: "23",
        note: "Breath detection: the microphone hears the inhale, and the sustain test and Breathe and sing wait for it.",
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
        note: "Pitch engine: a 4 kHz pre-filter, and a true median that brings vibrato bias down to 0.7 cents in our harness.",
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
        note: "Warmups sing with you: a continuous guide under your voice, scored against the phrase you actually sang.",
      },
      { day: "22", note: "Pick which microphone the studio listens to." },
      {
        day: "22",
        note: "A second typeface, a real type scale, and one meaning for violet.",
      },
      {
        day: "21",
        note: ACCOUNTS_OPEN
          ? "Free accounts: your practice record, backed up and restorable anywhere."
          : "Account backup for your practice record, built ahead of accounts opening on this site.",
      },
      {
        day: "21",
        note: "Warmup ladders climb a semitone each rep, walk back down, and keep going.",
      },
      {
        day: "19",
        note: "Ten focused tabs: Recorder and Analyze join Tools; the books share a shelf.",
      },
      {
        day: "17",
        note: "The Chrome extension arrives: a vocal coach in the side panel, with a pitch meter over YouTube.",
      },
      {
        day: "16",
        note: "The range test asks for notes your microphone can measure, and says when it hears too little.",
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
      <SectionHeading label={story.label} lede={story.body} level={3}>
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
            <Link href={l.href} prefetch={l.href === "/singers" ? false : undefined} className={linkClass}>
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
          Suede Sing changelog: everything new in <em>4.2</em>
        </>
      }
      subtitle="Suede Sing 4.2 calms the room pages, draws share cards in the site's own type, and makes the Pro page quicker to read. Below it: 4.1's example figures in every room, and 4.0, which brought back the original design and a recorded grand piano."
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd({ path: "/changelog", name: TITLE, description: DESCRIPTION, dateModified: RELEASE_DATE })) }}
      />
      {/* The record head: the page's one accented surface. Cool hairline and
          trace glyph up top, tape counters below — data as ornament. */}
      <div className="well relative flex flex-wrap items-center gap-x-3 gap-y-1 overflow-hidden rounded-2xl px-4 py-3 font-mono text-label uppercase tracking-[0.14em] text-dim">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cool to-transparent"
        />
        <V2TraceGlyph className="shrink-0 text-cool" />
        <span className="text-ink">4.2</span>
        {/* Each item carries the dot before it and never breaks inside, so a
            wrap cannot leave a dot alone at the end of a line. */}
        <span className="flex items-center gap-x-3 whitespace-nowrap">
          <span aria-hidden className="text-line2">
            ·
          </span>
          <time dateTime={RELEASE_DATE}>Shipped Oct 2026</time>
        </span>
        <span className="flex items-center gap-x-3 whitespace-nowrap">
          <span aria-hidden className="text-line2">
            ·
          </span>
          <span className="tabular">{RELEASE_STORIES.length} stories</span>
        </span>
        <span className="flex items-center gap-x-3 whitespace-nowrap">
          <span aria-hidden className="text-line2">
            ·
          </span>
          {/* The whole log, since July, not 4.2's share of it. */}
          <span className="tabular">{entriesLogged} log entries since July</span>
        </span>
      </div>

      {/* Each release is one section with an h2 that names it and its stories
          as h3s inside, so a reader or an answer engine asking what is in 4.2
          gets a boundary between it and the releases below. The record head
          above is 4.2's visible title; this h2 says it to the outline. */}
      <section aria-labelledby="release-4-2">
        <h2 id="release-4-2" className="sr-only">
          Suede Sing 4.2, October 2026
        </h2>
        <div className="mt-12 space-y-12">
          {RELEASE_STORIES.map((s) => (
            <StoryBlock key={s.label} story={s} />
          ))}
        </div>
      </section>

      <section aria-label="Suede Sing 4.1" className="mt-14 border-t border-line2 pt-8">
        <SectionLabel heading>Earlier: 4.1, October 2026</SectionLabel>
        <p className="mt-3 max-w-prose text-meta text-mut">
          Example drawings in every room before the microphone turns on,
          ranges you can compare at a glance, and books with covers.
        </p>
        <div className="mt-8 space-y-12">
          {RELEASE_41_STORIES.map((s) => (
            <StoryBlock key={s.label} story={s} />
          ))}
        </div>
      </section>

      <section aria-label="Suede Sing 4.0" className="mt-14 border-t border-line2 pt-8">
        <SectionLabel heading>Earlier: 4.0, October 2026</SectionLabel>
        <p className="mt-3 max-w-prose text-meta text-mut">
          The original design back, reference notes from a recorded grand
          piano, and free minutes that count only practice.
        </p>
        <div className="mt-8 space-y-12">
          {RELEASE_40_STORIES.map((s) => (
            <StoryBlock key={s.label} story={s} />
          ))}
        </div>
      </section>

      {/* 3.1 stays on the page as the previous release, shaped like the v2
          section below it: a label, a one-line summary, then its stories. */}
      <section aria-label="Suede Sing 3.1" className="mt-14 border-t border-line2 pt-8">
        <SectionLabel heading>Earlier: 3.1, September 2026</SectionLabel>
        <p className="mt-3 max-w-prose text-meta text-mut">
          A full voice curriculum, programs that plan your weeks, songs that
          score and remember you, and a pitch engine measured to the cent.
        </p>
        <div className="mt-8 space-y-12">
          {PREVIOUS_STORIES.map((s) => (
            <StoryBlock key={s.label} story={s} />
          ))}
        </div>
      </section>

      <section aria-label="Suede Sing v2" className="mt-14 border-t border-line2 pt-8">
        <SectionLabel heading>Earlier: v2, August 2026</SectionLabel>
        <p className="mt-3 max-w-prose text-meta text-mut">
          The studio rebuilt panel by panel: warmups that sing with you,{" "}
          {ACCOUNTS_OPEN
            ? "free accounts that keep your record"
            : "account backup for your record (accounts are not open yet)"}
          , a deeper library, and a calmer room around all of it.
        </p>
        <div className="mt-8 space-y-12">
          {STORIES.map((s) => (
            <StoryBlock key={s.label} story={s} />
          ))}
        </div>
      </section>

      {/* The page's one violet moment, because this surface genuinely is Pro. */}
      <section className="relative mt-14 overflow-hidden rounded-2xl border border-violet/50 bg-panel p-5 sm:p-6">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet to-transparent"
        />
        <ProChip />
        <h2 className="mt-3 text-2xl sm:text-3xl">{proHeadlineLong()}</h2>
        <p className="mt-3 max-w-prose text-mut">
          Guided practice with no daily clock, both books in full, the pro
          warmup packs, pitch analysis on every take, your range history, and
          cloud sync. v2 grew the free studio; Pro is what keeps it free.
        </p>
        <LinkButton href="/pro" variant="violet" size="md" className="mt-5">
          See what Pro adds
        </LinkButton>
      </section>

      <section aria-label="Release log" className="mt-14 border-t border-line2 pt-8">
        <SectionLabel heading>The running log</SectionLabel>
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
