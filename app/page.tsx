import Link from "next/link";
import { LinkButton, SectionLabel } from "@/components/ui";
import HeroVisual from "@/components/landing/hero-visual";
import ComparisonTable from "@/components/landing/comparison";
import {
  BreathGlyph,
  EarGlyph,
  ProgressGlyph,
  RangeGlyph,
  RecorderGlyph,
  SongGlyph,
  StudioGlyph,
  ToolsGlyph,
  WarmupGlyph,
} from "@/components/landing/glyphs";

const FEATURES = [
  {
    href: "/studio",
    label: "Pitch studio",
    desc: "Sing into your mic and watch your pitch trace against target notes, live.",
    Glyph: StudioGlyph,
  },
  {
    href: "/warmups",
    label: "Warmups",
    desc: "Guided vocal warmups scored in real time as you sing along.",
    Glyph: WarmupGlyph,
  },
  {
    href: "/range",
    label: "Range test",
    desc: "Find your lowest and highest notes and get your voice type.",
    Glyph: RangeGlyph,
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

const STEPS = [
  {
    n: "01",
    title: "Enable your mic",
    desc: "Grant mic access once. Audio is analyzed on your device and never leaves it.",
  },
  {
    n: "02",
    title: "Sing the guided exercises",
    desc: "Follow the note lanes in warmups, ear training, and songs. Scoring is instant.",
  },
  {
    n: "03",
    title: "Watch your numbers grow",
    desc: "Range, accuracy, and streaks build session by session on your progress page.",
  },
];

export default function Home() {
  return (
    <main>
      {/* 1 — Hero */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="animate-fadeup">
            <SectionLabel className="mb-4">
              Free vocal studio — in the browser
            </SectionLabel>
            <h1 className="text-4xl leading-tight sm:text-5xl">
              See your voice.
              <br />
              Sing in tune.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-mut">
              Suede Sing turns your mic into a real-time vocal trainer: live
              pitch feedback, a range test, warmups, ear training, breath work,
              and song practice — all in one place, all in your browser.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <LinkButton href="/studio" variant="rec" size="lg">
                Start singing — free
              </LinkButton>
              <LinkButton href="/range" variant="outline" size="lg">
                Find your range
              </LinkButton>
            </div>
            <p className="mt-6 font-mono text-xs uppercase tracking-[0.14em] text-dim">
              No app<span className="mx-2 text-line2">·</span>No ads
              <span className="mx-2 text-line2">·</span>No signup
              <span className="mx-2 text-line2">·</span>$0
            </p>
          </div>
          <div className="animate-fadeup">
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* 2 — Feature grid */}
      <section className="border-t border-line">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <SectionLabel className="mb-4">Nine practice rooms</SectionLabel>
          <h2 className="max-w-2xl text-3xl">
            Everything a practice session needs, one tab over
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ href, label, desc, Glyph }) => (
              <Link
                key={href}
                href={href}
                className="group rounded-2xl border border-line bg-panel p-5 transition-colors hover:border-amber/50 sm:p-6"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-panel2 text-amber-ink">
                  <Glyph />
                </span>
                <span className="mt-4 block font-display text-xl text-ink group-hover:text-amber-ink">
                  {label}
                </span>
                <span className="mt-1 block text-sm text-mut">{desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3 — Comparison */}
      <section className="border-t border-line bg-panel/40">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <SectionLabel className="mb-4">Side by side</SectionLabel>
          <h2 className="max-w-2xl text-3xl">
            The whole toolkit, without the paywall
          </h2>
          <p className="mt-3 max-w-2xl text-mut">
            Most trainers do a few of these things, behind a subscription or an
            app install. Suede Sing does all of them, free, on the web.
          </p>
          <div className="mt-8">
            <ComparisonTable />
          </div>
        </div>
      </section>

      {/* 4 — How practice works */}
      <section className="border-t border-line">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <SectionLabel className="mb-4">How practice works</SectionLabel>
          <h2 className="max-w-2xl text-3xl">Three steps, no setup</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((step) => (
              <li
                key={step.n}
                className="rounded-2xl border border-line bg-panel p-5 sm:p-6"
              >
                <span className="tabular font-mono text-sm text-amber-ink">
                  {step.n}
                </span>
                <h3 className="mt-3 text-xl">{step.title}</h3>
                <p className="mt-2 text-sm text-mut">{step.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 5 — Privacy strip */}
      <section className="border-t border-line bg-panel/40">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 sm:px-6">
          <p className="max-w-xl text-sm text-mut">
            <span className="text-ink">Your voice stays yours.</span> All audio
            analysis runs on this device — nothing is recorded to a server,
            uploaded, or tied to an account.
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            On-device analysis<span className="mx-2 text-line2">·</span>Nothing
            uploaded<span className="mx-2 text-line2">·</span>No account
          </p>
        </div>
      </section>

      {/* 6 — Final CTA */}
      <section className="border-t border-line">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 text-center sm:px-6">
          <h2 className="text-3xl sm:text-4xl">
            Your mic is the only equipment
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-mut">
            Open the studio, sing one warmup, and see your pitch on screen in
            under a minute.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <LinkButton href="/studio" variant="rec" size="lg">
              Start singing — free
            </LinkButton>
            <LinkButton href="/warmups" variant="ghost" size="lg">
              Browse warmups
            </LinkButton>
          </div>
        </div>
      </section>
    </main>
  );
}
