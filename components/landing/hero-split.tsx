import Image from "next/image";
import Link from "next/link";
import { LinkButton } from "@/components/ui";
import { APP_NAME, APP_STORE_URL } from "@/lib/app-store";
import { AUTHOR_NAME } from "@/lib/author";

/**
 * Split hero carried over from the iOS app's own landing page: full-bleed
 * portrait on the right under a paper scrim, copy left, oversized wordmark.
 * Both sites already share a palette (#f7f0e7 paper, brick, teal, gold), so
 * this is the one place the two landings genuinely differed — and print's
 * version is the stronger opening, so it wins.
 */
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
          priority
          sizes="(max-width: 640px) 100vw, 38vw"
          className="object-cover object-[center_24%]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-bg/15 to-ink/30" />
      </div>

      {/*
       * The portrait is the largest image on the site and nothing named the
       * person in it, so it read as stock photography — which on a page selling
       * vocal-health guidance and two books is worse than no photo at all. It
       * is the founder, and a solo-built product is a reason to trust this one,
       * not something to hide. Not aria-hidden, unlike the image itself: this
       * is the credit, and it is the only place on the landing page a name
       * appears.
       */}
      <p className="pointer-events-none absolute bottom-5 right-4 z-10 hidden sm:block sm:right-6">
        <Link
          href="/pro#author"
          className="pointer-events-auto rounded-full border border-line/60 bg-panel/80 px-3 py-1.5 font-mono text-label uppercase tracking-[0.14em] text-mut backdrop-blur-sm transition-colors hover:border-amber/50 hover:text-amber-ink"
        >
          Built by {AUTHOR_NAME}
        </Link>
      </p>
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(247,240,231,0.98)_0%,rgba(247,240,231,0.94)_58%,rgba(247,240,231,0.54)_78%,rgba(247,240,231,0.20)_100%)] max-sm:bg-[linear-gradient(180deg,rgba(247,240,231,0.72)_0%,rgba(247,240,231,0.94)_46%,rgba(247,240,231,0.99)_70%)]"
      />

      <div className="animate-fadeup mx-auto w-full max-w-6xl px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32">
        {/* The name is the kicker and the claim is the headline, which is the
            inverse of how this shipped. The h1 was `clamp(3rem, 9vw, 6.5rem)`
            — up to 104px — and it said "Suede Sing", two words that mean
            nothing to someone arriving from a search for how to find their
            vocal range. The sentence that actually explains the product sat
            above it at 12.5px. So the type scale had a 104px tier spent on a
            brand nobody knows and a 12.5px tier carrying the pitch, and the
            first legible thing on the page was the third element down.

            The name still gets a face: the nav wordmark is set in the display
            serif, and this line is the same red tape label it always was. */}
        <p className="font-mono text-label uppercase tracking-[0.16em] text-rec">
          Suede Sing
          <span className="mx-2 text-line2" aria-hidden>
            ·
          </span>
          <span className="text-dim">Free in your browser</span>
        </p>
        <h1
          id="hero-title"
          className="mt-4 max-w-[19ch] text-[clamp(2.5rem,5.6vw,4.25rem)] leading-[1.04] tracking-[-0.025em]"
        >
          Sing one note. See exactly what came out.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-mut sm:text-xl">
          Your voice has a signature. Suede Sing reads it — range, register
          transitions, breath support, resonance, vibrato — every session,
          on-device. The result is your{" "}
          <strong className="font-semibold text-ink">TonePrint</strong>, and a
          practice plan built from it.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <LinkButton href="/studio" variant="amber" size="lg">
            Open the web studio
          </LinkButton>
          <LinkButton href="/range" variant="outline" size="lg">
            Try the free range test
          </LinkButton>
          <a
            href={APP_STORE_URL}
            aria-label={`View ${APP_NAME} on the App Store`}
            className="inline-block rounded-[10px] transition-opacity hover:opacity-85 focus-visible:opacity-85"
          >
            <Image
              src="/app-store-badge.svg"
              width={168}
              height={56}
              alt="Download on the App Store"
            />
          </a>
        </div>
        <p className="mt-3 max-w-xl text-sm text-mut">
          Start here in your browser — no install required. {APP_NAME}, the
          phone companion, is optional — for when you want deeper on-device
          voice analysis.
        </p>
        <p className="mt-7 font-mono text-xs uppercase tracking-[0.14em] text-dim">
          On-device analysis
          <span className="mx-2 text-line2">·</span>No signup for the web studio
          <span className="mx-2 text-line2">·</span>
          <Link
            href="/singers"
            className="text-amber-ink underline decoration-amber/40 underline-offset-4 hover:decoration-amber"
          >
            Famous singers&apos; ranges
          </Link>
        </p>
      </div>
    </section>
  );
}
