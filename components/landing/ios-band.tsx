import Image from "next/image";
import Link from "next/link";
import { SectionLabel } from "@/components/ui";
import { APP_NAME, APP_STORE_URL, VOICE_PAGE_PATH } from "@/lib/app-store";

/**
 * One strip for the phone companion: the label, one sentence, the badge and
 * one product image. The platform disclaimer lives on /voice.
 */
export function IosBand() {
  return (
    <section id="app" className="border-t border-line bg-panel/40">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-4 py-12 sm:grid-cols-[1fr_auto] sm:px-6 sm:py-14">
        <div className="max-w-2xl">
          <SectionLabel hairline className="mb-4">iPhone companion</SectionLabel>
          <h2 className="text-2xl sm:text-3xl">Also on iPhone: {APP_NAME}</h2>
          <p className="mt-3 text-mut">
            The web studio gives you live pitch and range testing with no daily
            clock;{" "}
            <Link href={VOICE_PAGE_PATH} className="text-violet-ink underline underline-offset-4">
              {APP_NAME} for iPhone and Android
            </Link>{" "}
            has its own practice tools, and the iPhone app adds register
            analysis.
          </p>
          <a
            href={APP_STORE_URL}
            aria-label={`View ${APP_NAME} on the App Store`}
            className="mt-6 inline-block rounded-[10px] transition-opacity hover:opacity-85"
          >
            <Image
              src="/app-store-badge.svg"
              width={168}
              height={56}
              alt="Download on the App Store"
            />
          </a>
        </div>
        {/* The range room, captured from this site at phone width: the
            result the app and the browser both start from. */}
        <figure className="figure mx-auto w-full max-w-[220px] overflow-hidden rounded-2xl border border-line bg-panel p-2 sm:mx-0">
          <Image
            src="/room-range.png"
            alt="Suede Sing's range room on a phone: a measured range drawn on a keyboard"
            width={390}
            height={844}
            sizes="220px"
            className="h-auto w-full rounded-xl"
          />
        </figure>
      </div>
    </section>
  );
}
