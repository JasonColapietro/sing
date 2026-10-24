import { rangeTestHref } from "@/lib/site";
import Image from "next/image";
import Link from "next/link";
import { LinkButton } from "@/components/ui";
import { APP_NAME, VOICE_PAGE_PATH } from "@/lib/app-store";
import { AUTHOR_NAME } from "@/lib/author";
import { FREE_DAILY_MINUTES } from "@/lib/practice-limits";

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

      {/* Identify the founder in the portrait using the current canonical bio.
          The focus ring sits inside the pill: outside it, it would land on the
          photo, where the red ring measured 2.7:1. */}
      <p className="pointer-events-none absolute bottom-5 right-4 z-10 hidden sm:block sm:right-6">
        <a
          href="https://suedeai.ai/founder"
          rel="author"
          className="pointer-events-auto rounded-full border border-line/60 bg-panel/80 px-3 py-1.5 font-mono text-label uppercase tracking-[0.14em] text-mut backdrop-blur-sm transition-colors hover:border-violet/50 hover:text-violet-ink focus-visible:-outline-offset-4"
        >
          Built by {AUTHOR_NAME}
        </a>
      </p>
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(247,240,231,0.98)_0%,rgba(247,240,231,0.94)_58%,rgba(247,240,231,0.54)_78%,rgba(247,240,231,0.20)_100%)] max-sm:bg-[linear-gradient(180deg,rgba(247,240,231,0.72)_0%,rgba(247,240,231,0.94)_46%,rgba(247,240,231,0.99)_70%)]"
      />

      <div className="animate-fadeup mx-auto w-full max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-32">
        {/* Keep the original portrait and display headline while carrying the
            current search intent and the direct-to-tool start actions. */}
        <h1 id="hero-title">
          <span className="block font-mono text-label uppercase leading-normal tracking-[0.16em] text-violet-ink">
            Suede Sing
            <span className="mx-2 text-line2" aria-hidden>
              ·
            </span>
            <span className="text-dim">Online singing practice with live pitch feedback</span>
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
          Practice singing in your browser with live pitch feedback, guided
          warmups, and songs in your key. Hear a note, sing it back, and see
          where your voice lands.
        </p>
        <p className="mt-5 max-w-xl text-sm text-mut">
          The pitch meter and range test are free with no time limit. Guided
          practice includes {FREE_DAILY_MINUTES} free minutes a day. Audio stays
          on your device.
        </p>
        <p className="mt-3 max-w-xl text-sm text-mut">
          Want a phone companion? Explore <Link href={VOICE_PAGE_PATH} className="text-violet-ink underline underline-offset-4">{APP_NAME}</Link> for
          deeper on-device voice analysis.
        </p>
        <p className="mt-7 font-mono text-xs uppercase tracking-[0.14em] text-dim">
          On-device analysis
          <span className="mx-2 text-line2">·</span>Free web studio
          <span className="mx-2 text-line2">·</span>
          <Link
            href="/singers"
            prefetch={false}
            className="text-violet-ink underline decoration-violet/40 underline-offset-4 hover:decoration-violet"
          >
            Famous singers&apos; ranges
          </Link>
        </p>
      </div>
    </section>
  );
}
