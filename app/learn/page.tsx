import type { Metadata } from "next";
import Link from "next/link";
import { BOOK_CONTENTS, BOOK_TITLE } from "@/lib/book-data";
import { DEFAULT_OG_IMAGE, withCanonicalOpenGraph } from "@/lib/og";
import { ORG_PUBLISHER_NODE } from "@/lib/organization";
import { SINGERS } from "@/lib/singers";
import { SITE_URL, rangeTestHref } from "@/lib/site";
import { FREE_DAILY_MINUTES } from "@/lib/practice-limits";
import { CATALOG_LESSON_COUNT } from "@/lib/voice-lessons";
import {
  VOCAL_LEARNING_FAQ,
  VOCAL_LEARNING_PATHS,
} from "@/lib/vocal-learning";
import { SafetyLine } from "@/components/learn/safety-note";
import { Card, LinkButton, PageShell, SectionLabel } from "@/components/ui";
import { routeKeywords } from "@/lib/keywords";

const TITLE = "Learn to Sing: Free Vocal Training Guide";
const DESCRIPTION =
  "Learn to sing with a free vocal training plan: test your range, improve pitch, warm up, train breath control and practice songs.";

export const metadata: Metadata = withCanonicalOpenGraph({
  keywords: routeKeywords("/learn"),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/learn` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
});

const FREE_BOOK_CHAPTERS = BOOK_CONTENTS.filter((c) => c.free).length;

const WEEK = [
  {
    day: "Day 1",
    focus: "Baseline",
    // Warm first, as every program's range day does: a cold voice
    // under-reports at both ends. The Morning reset is about four minutes,
    // inside the free daily allowance.
    body: "Warm up for about four minutes with the Morning reset (hums, lip trills, a small siren), then take the range test and hold three comfortable notes in the pitch studio. The test saves your result; today is a measurement, not an audition.",
    links: [
      { href: "/warmups?routine=morning", label: "Morning reset warmup" },
      { href: rangeTestHref(), label: "Vocal range test" },
      { href: "/studio", label: "Pitch studio" },
    ],
  },
  {
    day: "Day 2",
    focus: "Pitch",
    body: "Match single notes, then sing small intervals. Keep the sound easy enough that you can listen while you sing.",
    links: [
      { href: "/ear-training", label: "Ear training" },
      { href: "/studio", label: "Live pitch feedback" },
    ],
  },
  {
    day: "Day 3",
    focus: "Breath",
    body: "Run one breathing drill and the sustain test. Aim for an even note from beginning to end, not the longest possible time.",
    links: [
      { href: "/breath", label: "Breath and sustain training" },
      { href: "/learn/voice/room-check/breathe-low", label: "Breathe Low lessons" },
    ],
  },
  {
    day: "Day 4",
    focus: "Coordination",
    body: "Use a short warmup: hums or lip trills, a five-note scale, then a gentle siren through the middle of the voice.",
    links: [{ href: "/warmups", label: "Guided vocal warmups" }],
  },
  {
    day: "Day 5",
    focus: "Song",
    // Warm before song work, as the fundamentals below say. The warm-up goes
    // in the pitch studio, which has no clock, so a free singer's guided
    // minutes are left for the song itself.
    body: "Warm up first with a few minutes of easy hums and lip trills in the pitch studio, which has no practice timer, so your guided minutes go to the song. Then practice one verse or chorus. Slow the difficult phrase and choose breaths. Songs open fitted to the range you measured on Day 1; shift the key a semitone at a time if the melody still sits outside your comfortable band.",
    links: [
      { href: "/studio", label: "Pitch studio" },
      { href: "/songs", label: "Song practice" },
    ],
  },
  {
    day: "Day 6",
    focus: "Listen back",
    body: "After the same short warm-up, record two takes of the same section. Compare pitch, timing, tone, and the end of each phrase; keep one specific change for next week.",
    links: [
      { href: "/recorder", label: "Take recorder" },
      { href: "/analyze", label: "Voice spectrogram" },
    ],
  },
  {
    day: "Day 7",
    focus: "Rest and review",
    body: "Rest from demanding singing. Review the week's scores and recordings, then choose one skill, not five, to carry into the next week, or start a multi-week program that plans the next weeks day by day.",
    links: [
      { href: "/progress", label: "Practice progress" },
      { href: "/programs", label: "Multi-week practice programs" },
    ],
  },
] as const;

const FUNDAMENTALS = [
  {
    title: "Range is not voice type",
    body: "Vocal range is the distance between your lowest and highest repeatable notes. Voice type also considers where the voice is comfortable (its tessitura), plus timbre, weight, and transition points. The range test gives you a useful estimate; the voice-type guide explains why the label stays provisional.",
    links: [
      { href: rangeTestHref(), label: "Measure your range" },
      {
        href: "/atlas/vocal-range-by-voice-type",
        label: "Compare all eight voice types",
      },
      { href: "/learn/voice/room-check/your-range", label: "Free lessons: Your Range" },
    ],
  },
  {
    title: "Pitch is a loop between ear and voice",
    body: "Singing in tune is not only hearing the right note and not only producing it. You hear a target, coordinate the voice, listen to the result, and adjust. Real-time cents feedback makes that loop visible; ear games train it without turning every note into a guess.",
    links: [
      { href: "/studio", label: "See your pitch live" },
      { href: "/ear-training", label: "Train pitch matching" },
      { href: "/learn/voice/steady-tone/land-the-note", label: "Free lessons: Land the Note" },
    ],
  },
  {
    title: "A warmup prepares; training changes",
    body: "A vocal warmup gets the voice ready for today's demand. Training repeats a focused task across days until coordination becomes more reliable. Use warmups before range, volume, and song work; use your scores and recordings to decide what the next session should train.",
    links: [
      { href: "/warmups", label: "Warm up" },
      { href: "/learn/voice", label: "Follow the free voice course" },
      {
        href: "/book",
        label: `${BOOK_TITLE} (${FREE_BOOK_CHAPTERS} ${FREE_BOOK_CHAPTERS === 1 ? "chapter" : "chapters"} free)`,
      },
    ],
  },
  {
    title: "Register words describe coordination, not rank",
    body: "Chest voice, head voice, falsetto, mixed voice, and passaggio name different setups or transition ideas. None makes one singer better than another. Learn the vocabulary, then use gentle sirens and pitch feedback to notice what your own voice does without forcing a label onto every sound.",
    links: [
      { href: "/glossary", label: "Define the vocal terms" },
      { href: "/analyze", label: "See your voice's harmonics" },
      {
        href: "/learn/voice/two-registers/chest-head-falsetto",
        label: "Free lessons: Chest, Head, Falsetto",
      },
    ],
  },
] as const;

export default function LearnPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}/learn#page`,
        name: TITLE,
        description: DESCRIPTION,
        url: `${SITE_URL}/learn`,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        publisher: { "@id": ORG_PUBLISHER_NODE["@id"] },
        mainEntity: { "@id": `${SITE_URL}/learn#paths` },
      },
      ORG_PUBLISHER_NODE,
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Suede Sing",
            item: `${SITE_URL}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Learn to sing",
            item: `${SITE_URL}/learn`,
          },
        ],
      },
      {
        "@type": "ItemList",
        "@id": `${SITE_URL}/learn#paths`,
        name: "Vocal training paths",
        numberOfItems: VOCAL_LEARNING_PATHS.length,
        itemListElement: VOCAL_LEARNING_PATHS.map((path, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: path.title,
          description: path.need,
          // The page, not the scroll position: the range card links #start.
          url: `${SITE_URL}${path.href.split("#")[0]}`,
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: VOCAL_LEARNING_FAQ.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };

  return (
    <PageShell
      kicker="Free vocal training guide"
      title="Learn to sing with a plan you can hear and measure"
      subtitle="To learn to sing, start from your voice as it is today: test your range, train one skill at a time, use that skill in a song, and listen back. Every tool below runs in the browser."
      actions={
        <div className="flex flex-wrap gap-2">
          <LinkButton href={rangeTestHref()} size="lg">
            Test my vocal range
          </LinkButton>
          <LinkButton href="/warmups" variant="outline" size="lg">
            Start a warmup
          </LinkButton>
        </div>
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="space-y-8">
        <Card>
          <SectionLabel>Start here</SectionLabel>
          <h2 className="mt-3 text-2xl">Choose the problem you want to solve</h2>
          <p className="mt-3 max-w-3xl text-mut">
            This is the map for learning to sing, not another practice room.
            Each path below opens the part of Suede Sing built for that job, so
            a beginner can move from explanation to a real exercise without
            hunting through the site.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VOCAL_LEARNING_PATHS.map((path) => (
              <Link
                key={path.href}
                href={path.href}
                className="lift group rounded-2xl border border-line bg-panel2 p-5 hover:border-violet/50"
              >
                <h3 className="text-lg text-ink group-hover:text-violet-ink">
                  {path.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-mut">
                  {path.need}
                </p>
                <span className="mt-4 block text-sm text-violet-ink">
                  {path.action} →
                </span>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl">What is free?</h2>
          <p className="mt-3 max-w-3xl text-mut">
            The range test, pitch studio, recorder, and tools are free without a
            practice timer. Guided practice includes {FREE_DAILY_MINUTES} minutes a day
            shared across warmups, ear training, breath, and song practice.
            {" "}<Link href="/pro" className="text-violet-ink underline underline-offset-4">Pro</Link>{" "}
            removes that guided-practice cap. This guide and all{" "}
            {CATALOG_LESSON_COUNT} voice lessons are free to read.
          </p>
        </Card>

        <Card>
          <SectionLabel>A repeatable session</SectionLabel>
          <h2 className="mt-3 text-2xl">An example 20-minute practice plan</h2>
          <p className="mt-3 max-w-3xl text-mut">
            A useful session has four jobs: prepare the voice, train one skill,
            use it in music, and listen back. This is an adaptable example, not a
            required duration or a promise of results. Shorten it to suit your
            experience and comfort; do not push through discomfort to finish a timer.
          </p>
          <ol className="mt-6 grid gap-4 md:grid-cols-4">
            {[
              ["5 min", "Warm up", "Hums, lip trills, and easy scales in the middle of your voice."],
              ["5 min", "Train", "One target only: pitch, breath, a register transition, or timing."],
              ["7 min", "Apply", "One verse or chorus, slowed down and moved to a comfortable key if needed."],
              ["3 min", "Listen", "Record one take, name one improvement and one next step."],
            ].map(([time, title, body]) => (
              <li key={title} className="rounded-xl border border-line bg-panel2 p-4">
                <span className="font-mono text-xs text-violet-ink">{time}</span>
                <h3 className="mt-2 text-lg">{title}</h3>
                <p className="mt-2 text-sm text-mut">{body}</p>
              </li>
            ))}
          </ol>
        </Card>

        <Card>
          <SectionLabel>First week</SectionLabel>
          <h2 className="mt-3 text-2xl">A seven-day learn-to-sing plan</h2>
          <p className="mt-3 max-w-3xl text-mut">
            Each day introduces one variable. That makes your recordings and
            scores interpretable: if everything changes at once, nothing tells
            you what worked.
          </p>
          <ol className="mt-5 divide-y divide-line/60">
            {WEEK.map((day) => (
              <li key={day.day} className="grid gap-3 py-5 first:pt-0 last:pb-0 md:grid-cols-[6rem_9rem_1fr]">
                <span className="font-mono text-xs uppercase tracking-[0.12em] text-dim">
                  {day.day}
                </span>
                <h3 className="text-base text-ink">{day.focus}</h3>
                <div>
                  <p className="text-sm leading-relaxed text-mut">{day.body}</p>
                  <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    {day.links.map((link) => (
                      <Link key={link.href} href={link.href} className="text-violet-ink hover:underline">
                        {link.label} →
                      </Link>
                    ))}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <section aria-labelledby="fundamentals" className="space-y-4">
          <div className="max-w-3xl">
            <SectionLabel>Vocal fundamentals</SectionLabel>
            <h2 id="fundamentals" className="mt-3 text-2xl">
              Four distinctions that prevent wasted practice
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {FUNDAMENTALS.map((item) => (
              <Card key={item.title}>
                <h3 className="text-xl">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-mut">{item.body}</p>
                <p className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                  {item.links.map((link) => (
                    <Link key={link.href} href={link.href} className="text-violet-ink hover:underline">
                      {link.label} →
                    </Link>
                  ))}
                </p>
              </Card>
            ))}
          </div>
        </section>

        <Card>
          <SectionLabel>Reference</SectionLabel>
          <h2 className="mt-3 text-2xl">Look up a voice, then test your own</h2>
          <p className="mt-3 max-w-3xl text-mut">
            The singer library collects cited ranges, catalog voice-type labels,
            and highest and lowest notes for {SINGERS.length} singers; The Voice
            Atlas, part of Suede Pro, adds a technique note for each. Use it for
            context, not as a target: another singer&apos;s recorded extreme says
            nothing about the note your voice should force today.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <LinkButton href="/singers" prefetch={false}>
              Browse famous vocal ranges
            </LinkButton>
            <LinkButton href={rangeTestHref()} variant="outline">
              Compare with my range
            </LinkButton>
            <LinkButton href="/atlas" prefetch={false} variant="ghost">
              Read The Voice Atlas
            </LinkButton>
          </div>
        </Card>

        <Card>
          <SectionLabel>Questions</SectionLabel>
          <h2 className="mt-3 text-2xl">Vocal training FAQ</h2>
          <div className="mt-5 divide-y divide-line/60">
            {VOCAL_LEARNING_FAQ.map((item) => (
              <section key={item.question} className="py-5 first:pt-0 last:pb-0">
                <h3 className="text-lg">{item.question}</h3>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-mut">
                  {item.answer}
                </p>
              </section>
            ))}
          </div>
        </Card>

        <SafetyLine />
      </div>
    </PageShell>
  );
}
