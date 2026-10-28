import { rangeTestHref } from "@/lib/site";
import Image from "next/image";
import Link from "next/link";
import { LinkButton } from "@/components/ui";
import { AUTHOR_NAME } from "@/lib/author";
import { COOL } from "@/lib/chart-colors";
import { FREE_DAILY_MINUTES } from "@/lib/practice-limits";

/**
 * The settling trace (the curve family of components/v2-glyph.tsx) drawn
 * full-bleed behind the hero copy. On a phone it stays in the top band, above
 * the copy, so the line never crosses the text.
 */
function SettlingTrace() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1600 600"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36svh] w-full max-sm:h-[30svh] sm:inset-y-0 sm:h-full"
      style={{ opacity: 0.12 }}
    >
      <path
        d="M -20 420 C 160 400, 300 470, 420 330 C 560 170, 720 130, 900 190 C 1040 236, 1180 250, 1320 250"
        fill="none"
        stroke={COOL}
        strokeWidth="2"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx="1350" cy="250" r="7" fill={COOL} />
    </svg>
  );
}

/** The original paper-and-portrait presentation with current product copy. */
export function HeroSplit() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[78svh] items-end overflow-hidden"
    >
      {/* Portrait, right-anchored, behind a left-to-right paper wash */}
      <div aria-hidden="true" className="absolute inset-y-0 right-0 -z-10 w-[min(38vw,560px)] max-sm:w-full">
        <Image
          src="/founder-portrait.jpg"
          alt=""
          fill
          preload
          sizes="(max-width: 640px) 100vw, 38vw"
          className="object-cover object-[center_24%]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-bg/15 to-ink/30" />
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(247,240,231,0.98)_0%,rgba(247,240,231,0.94)_58%,rgba(247,240,231,0.54)_78%,rgba(247,240,231,0.20)_100%)] max-sm:bg-[linear-gradient(180deg,rgba(247,240,231,0.72)_0%,rgba(247,240,231,0.94)_46%,rgba(247,240,231,0.99)_70%)]"
      />
      <SettlingTrace />

      <div className="animate-fadeup relative mx-auto w-full max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-32">
        {/* Absolutely positioned in the top padding so the start buttons keep
            their place at every width. */}
        <Link
          href="/changelog"
          prefetch={false}
          className="absolute left-4 top-6 inline-flex min-h-6 items-center whitespace-nowrap gap-1.5 rounded-full border border-violet/40 bg-panel/85 px-2.5 font-mono text-label tracking-[0.08em] text-violet-ink backdrop-blur-sm transition-colors hover:border-violet sm:left-6 sm:top-20"
        >
          {/* Real spaces around the hidden dot, so the link's accessible
              name reads "v4.0 What's new", not "v4.0What's new". */}
          v4.0{" "}
          <span aria-hidden="true">·</span>{" "}
          What&apos;s new
        </Link>
        <span className="block font-mono text-label uppercase leading-normal tracking-[0.16em] text-violet-ink">
          Suede Sing
        </span>
        {/* The search term stays in the H1 (lib/on-page-seo.test.tsx), as a
            small lead-in over the display headline. */}
        <h1 id="hero-title">
          <span className="mt-1 block font-mono text-label uppercase leading-normal tracking-[0.16em] text-dim">
            Online singing practice with live pitch feedback
          </span>
          <span className="mt-4 block max-w-[19ch] text-[clamp(2.5rem,5.6vw,4.25rem)] leading-[1.04] tracking-[-0.025em]">
            Sing one note. See exactly what came out.
          </span>
        </h1>
        {/* The actions stay before the descriptive copy so a phone can reach
            the mic flow on its first screen. */}
        <div className="mt-6 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:flex-wrap min-[420px]:items-center">
          <LinkButton href={rangeTestHref({ mode: "pitch" })} variant="violet" size="lg">
            Start singing
          </LinkButton>
          <LinkButton href={rangeTestHref()} variant="outline" size="lg">
            Find my vocal range
          </LinkButton>
        </div>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-mut sm:text-xl">
          Hear a note, sing it back, and watch where your voice lands. The
          pitch meter and range test are free with no time limit; guided
          practice gives you {FREE_DAILY_MINUTES} free minutes a day.
        </p>
        <p className="mt-7 font-mono text-xs uppercase tracking-[0.14em] text-dim">
          No install
          <span className="mx-2 text-line2">·</span>No ads
          <span className="mx-2 text-line2">·</span>Audio stays on your device
        </p>
      </div>

      {/* The founder in the portrait. After the content in the source so it
          is not the first Tab stop; the focus ring sits inside the pill. */}
      <p className="pointer-events-none absolute bottom-5 right-4 z-10 hidden sm:block sm:right-6">
        <a
          href="https://suedeai.ai/founder"
          rel="author"
          className="pointer-events-auto rounded-full border border-line/60 bg-panel/80 px-3 py-1.5 font-mono text-label uppercase tracking-[0.14em] text-mut backdrop-blur-sm transition-colors hover:border-violet/50 hover:text-violet-ink focus-visible:-outline-offset-4"
        >
          Built by {AUTHOR_NAME}
        </a>
      </p>
    </section>
  );
}
