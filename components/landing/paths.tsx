import Link from "next/link";
import { SectionLabel } from "@/components/ui";

/**
 * Two starting paths, placed above the ten-room grid.
 *
 * The grid presents ten rooms as ten equal choices, which is the right shape
 * for someone who already knows what they want and the wrong shape for a first
 * visit — a beginner and a working singer need opposite starting points and
 * neither is obvious from a list of names. This names both, in order, with the
 * payoff stated so the next click is a decision rather than a guess.
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
      "You don't need to know your voice type, read music, or own anything but a microphone. Three rooms in this order answer the questions beginners actually arrive with.",
    steps: [
      {
        href: "/range",
        label: "Test your range",
        note: "Two minutes. You get your lowest and highest notes and the voice type they suggest.",
      },
      {
        href: "/warmups",
        label: "Sing a guided warmup",
        note: "Follow a short pattern and get scored as you go. Quiet and easy on purpose.",
      },
      {
        href: "/studio",
        label: "Watch your pitch live",
        note: "See the note you're singing against the note you meant — which is how off-key becomes fixable.",
      },
    ],
    payoff:
      "Fifteen minutes in, you know your range, your voice type, and whether you tend to sit under the note.",
  },
  {
    kicker: "If you already sing",
    heading: "Go straight to what's actually limiting you",
    intro:
      "The interesting numbers aren't the extremes. They're where tone drifts on a held note, which intervals you round off, and what the voice does through the passaggio.",
    steps: [
      {
        href: "/studio",
        label: "Hunt the drift",
        note: "Sustain long notes and watch for a slow sag — usually support showing up as a pitch problem.",
      },
      {
        href: "/ear-training",
        label: "Find your weak intervals",
        note: "Most trained ears have a distinct slippery set. Drill those instead of the whole twelve.",
      },
      {
        href: "/recorder",
        label: "Change one thing and A/B it",
        note: "Same phrase, one variable, back to back. The comparison that shows whether a change helped.",
      },
    ],
    payoff:
      "Then let the coach keep score: Pro charts per-note accuracy and range history, and plans tomorrow around your weak notes.",
    gold: true,
  },
];

export function StartingPaths() {
  return (
    <section className="border-t border-line">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <SectionLabel className="mb-4">Where to start</SectionLabel>
        <h2 className="max-w-2xl text-3xl">
          Two ways in, depending on where you&apos;re starting
        </h2>
        <p className="mt-3 max-w-2xl text-mut">
          Everything below is free and open right now. These are just the two
          orders that waste the least time.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {PATHS.map((path) => (
            <div
              key={path.kicker}
              className={`flex flex-col rounded-2xl border p-6 sm:p-7 ${
                path.gold
                  ? "border-amber/40 bg-panel2/50"
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
                      className="group flex gap-3 rounded-xl border border-line bg-bg/60 p-3.5 transition-colors hover:border-amber/50"
                    >
                      <span
                        aria-hidden
                        className={`tabular mt-0.5 font-mono text-sm ${
                          path.gold ? "text-amber-ink" : "text-ok-ink"
                        }`}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>
                        <span className="block font-display font-extrabold text-ink group-hover:text-amber-ink">
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
