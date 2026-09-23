import type { Metadata } from "next";
import Link from "next/link";
import { DEFAULT_OG_IMAGE, withCanonicalOpenGraph } from "@/lib/og";
import { ORG_PUBLISHER_NODE } from "@/lib/organization";
import { SINGERS } from "@/lib/singers";
import { SITE_URL } from "@/lib/site";
import {
  VOCAL_LEARNING_FAQ,
  VOCAL_LEARNING_PATHS,
} from "@/lib/vocal-learning";
import { Card, LinkButton, PageShell, SectionLabel } from "@/components/ui";

const TITLE = "Learn to Sing: Free Vocal Training Guide and Practice Plan";
const DESCRIPTION =
  "Learn to sing with a free vocal training plan: test your range, improve pitch, warm up, train breath control, understand voice types, and practice songs.";

export const metadata: Metadata = withCanonicalOpenGraph({
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

const WEEK = [
  {
    day: "Day 1",
    focus: "Baseline",
    body: "Take the range test, then hold three comfortable notes in the pitch studio. Save the result; today is a measurement, not an audition.",
    links: [
      { href: "/range", label: "Vocal range test" },
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
    links: [{ href: "/breath", label: "Breath and sustain training" }],
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
    body: "Practice one verse or chorus. Slow the difficult phrase, choose breaths, and transpose if the melody sits outside your comfortable band.",
    links: [{ href: "/songs", label: "Song practice" }],
  },
  {
    day: "Day 6",
    focus: "Listen back",
    body: "Record two takes of the same section. Compare pitch, timing, tone, and the end of each phrase; keep one specific change for next week.",
    links: [
      { href: "/recorder", label: "Take recorder" },
      { href: "/analyze", label: "Voice spectrogram" },
    ],
  },
  {
    day: "Day 7",
    focus: "Rest and review",
    body: "Rest from demanding singing. Review the week's scores and recordings, then choose one skill—not five—to carry into the next week.",
    links: [{ href: "/progress", label: "Practice progress" }],
  },
] as const;

const FUNDAMENTALS = [
  {
    title: "Range is not voice type",
    body: "Vocal range is the distance between your lowest and highest repeatable notes. Voice type also considers where the voice is comfortable—its tessitura—plus timbre, weight, and transition points. The range test gives you a useful estimate; the voice-type guide explains why the label stays provisional.",
    links: [
      { href: "/range", label: "Measure your range" },
      {
        href: "/atlas/vocal-range-by-voice-type",
        label: "Compare all eight voice types",
      },
    ],
  },
  {
    title: "Pitch is a loop between ear and voice",
    body: "Singing in tune is not only hearing the right note and not only producing it. You hear a target, coordinate the voice, listen to the result, and adjust. Real-time cents feedback makes that loop visible; ear games train it without turning every note into a guess.",
    links: [
      { href: "/studio", label: "See your pitch live" },
      { href: "/ear-training", label: "Train pitch matching" },
    ],
  },
  {
    title: "A warmup prepares; training changes",
    body: "A vocal warmup gets the voice ready for today's demand. Training repeats a focused task across days until coordination becomes more reliable. Use warmups before range, volume, and song work; use your scores and recordings to decide what the next session should train.",
    links: [
      { href: "/warmups", label: "Warm up" },
      { href: "/book", label: "Read the structured training manual" },
    ],
  },
  {
    title: "Register words describe coordination, not rank",
    body: "Chest voice, head voice, falsetto, mixed voice, and passaggio name different setups or transition ideas. None makes one singer better than another. Learn the vocabulary, then use gentle sirens and pitch feedback to notice what your own voice does without forcing a label onto every sound.",
    links: [
      { href: "/glossary", label: "Define the vocal terms" },
      { href: "/analyze", label: "See your voice's harmonics" },
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
          url: `${SITE_URL}${path.href}`,
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
      subtitle="Start with your voice as it is today. Test it, train one skill at a time, apply that skill to a song, and listen back. Every tool below runs in the browser."
      actions={
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/range" size="lg">
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
          <SectionLabel>A repeatable session</SectionLabel>
          <h2 className="mt-3 text-2xl">The 20-minute beginner vocal workout</h2>
          <p className="mt-3 max-w-3xl text-mut">
            A useful session has four jobs: prepare the voice, train one skill,
            use it in music, and collect evidence. Twenty focused minutes beats
            an hour of singing everything at full volume.
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
            The singer library collects cited ranges, voice types, highest and
            lowest notes, and technique notes for {SINGERS.length} singers. Use it for
            context, not as a target: another singer&apos;s recorded extreme says
            nothing about the note your voice should force today.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <LinkButton href="/singers">Browse famous vocal ranges</LinkButton>
            <LinkButton href="/range" variant="outline">
              Compare with my range
            </LinkButton>
            <LinkButton href="/atlas" variant="ghost">
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

        <p className="max-w-3xl text-xs leading-relaxed text-dim">
          Vocal training is not medical care. Stop if singing hurts or your
          voice becomes less coordinated as you continue. Persistent hoarseness,
          pain, sudden loss of range, or other worrying changes belong with a
          qualified clinician, not an online exercise.
        </p>
      </div>
    </PageShell>
  );
}
