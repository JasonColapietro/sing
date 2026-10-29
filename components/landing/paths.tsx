import { rangeTestHref } from "@/lib/site";
import Link from "next/link";
import { SectionLabel } from "@/components/ui";
import { FigureFrame, TraceFigure } from "@/components/figures";

/**
 * Two starting paths, placed above the practice-room grid: a beginner and a
 * working singer need opposite entry points, and neither is obvious from a
 * list of room names.
 */

interface Step {
  href: string;
  label: string;
  note: string;
}

interface Path {
  kicker: string;
  heading: string;
  intro: string;
  steps: Step[];
  payoff: string;
  gold?: boolean;
}

const PATHS: Path[] = [
  {
    kicker: "If you've never had a lesson",
    heading: "Start with what your voice already does",
    intro:
      "You don't need to know your voice type, read music, or own anything but a microphone. Three rooms in this order answer the questions beginners arrive with.",
    steps: [
      {
        href: rangeTestHref(),
        label: "Find my vocal range",
        note: "After a few easy hums, find the lowest and highest clear notes you can sing today and get a voice-type estimate.",
      },
      {
        href: "/warmups",
        label: "Sing a guided warmup",
        note: "Follow a short pattern and get scored as you go. Quiet and easy on purpose.",
      },
      {
        href: "/studio",
        label: "Watch your pitch live",
        note: "See the note you're singing against the note you meant. That is how off-key becomes fixable.",
      },
    ],
    payoff: "Leave with your range measured and a clearer picture of your pitch.",
  },
  {
    kicker: "If you already sing",
    heading: "Go straight to what's limiting you",
    intro:
      "Look beyond the extremes: where your pitch drifts on a held note, which intervals need work, and how the same phrase sounds across takes.",
    steps: [
      {
        href: "/studio",
        label: "Watch a held note for drift",
        note: "Sustain a comfortable note and watch whether your pitch rises or falls.",
      },
      {
        href: "/ear-training",
        label: "Find your weak intervals",
        note: "Interval ID names the right interval after every miss, so you can note the ones that keep slipping. Then drill just those pairs on the piano in Tools.",
      },
      {
        href: "/recorder",
        label: "Change one thing and A/B it",
        note: "Same phrase, one variable, back to back. The comparison that shows whether a change helped.",
      },
    ],
    // /pro's wording: the per-note chart is one tally, only the range is
    // charted over time (components/landing/pro-claims.test.tsx).
    payoff:
      "Then let Pro add the detail: a per-note accuracy chart, your range tests charted over months, and every step of the coach's daily plan.",
    gold: true,
  },
];

export function StartingPaths() {
  return (
    <section className="border-t border-line">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-12">
          <div>
            <SectionLabel hairline className="mb-4">Where to start</SectionLabel>
            <h2 className="max-w-2xl text-2xl sm:text-3xl">Start where you are</h2>
            <p className="mt-3 max-w-2xl text-mut">
              Prefer a sequence? The free{" "}
              <Link href="/learn" className="text-violet-ink underline decoration-violet/40 underline-offset-2 hover:decoration-violet">
                learn-to-sing guide
              </Link>{" "}
              has a seven-day plan, and the free{" "}
              <Link href="/learn/voice" className="text-violet-ink underline decoration-violet/40 underline-offset-2 hover:decoration-violet">
                voice lessons
              </Link>{" "}
              go one small skill at a time.
            </p>
          </div>
          {/* The product near the top of the page: what a held note looks like
              in the studio, the picture behind the hero's promise. */}
          <FigureFrame caption="What the studio draws as you sing">
            <TraceFigure />
          </FigureFrame>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {PATHS.map((path) => (
            <div
              key={path.kicker}
              className={`flex flex-col rounded-2xl border p-6 sm:p-7 ${
                path.gold
                  ? "border-violet/40 bg-panel2/50"
                  : "border-line bg-panel"
              }`}
            >
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                {path.kicker}
              </span>
              <h3 className="mt-3 text-xl">{path.heading}</h3>
              <p className="mt-2 text-sm text-mut">{path.intro}</p>

              <ol className="mt-6 space-y-2.5">
                {path.steps.map((step, i) => (
                  <li key={step.href}>
                    <Link
                      href={step.href}
                      className="lift group flex gap-3 rounded-xl border border-line bg-bg/60 p-3.5 hover:border-violet/50"
                    >
                      <span
                        aria-hidden
                        className={`tabular mt-0.5 font-mono text-sm ${
                          path.gold ? "text-violet-ink" : "text-ok-ink"
                        }`}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>
                        <span className="block font-extrabold text-ink group-hover:text-violet-ink">
                          {step.label}
                        </span>
                        <span className="mt-0.5 block text-sm text-mut">
                          {step.note}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>

              <p className="mt-auto pt-6 text-sm text-mut">{path.payoff}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
