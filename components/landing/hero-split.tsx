import Image from "next/image";
import Link from "next/link";
import { LinkButton } from "@/components/ui";
import { APP_NAME, APP_STORE_URL } from "@/lib/app-store";

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
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(247,240,231,0.98)_0%,rgba(247,240,231,0.94)_58%,rgba(247,240,231,0.54)_78%,rgba(247,240,231,0.20)_100%)] max-sm:bg-[linear-gradient(180deg,rgba(247,240,231,0.72)_0%,rgba(247,240,231,0.94)_46%,rgba(247,240,231,0.99)_70%)]"
      />

      <div className="animate-fadeup mx-auto w-full max-w-6xl px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32">
        <p className="font-display text-[0.78rem] font-black uppercase tracking-[0.12em] text-rec">
          A vocal training app that measures your singing voice
        </p>
        <h1
          id="hero-title"
          className="mt-3 text-[clamp(3rem,9vw,6.5rem)] font-extrabold leading-[0.95] tracking-[-0.03em]"
        >
          Suede Sing
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
