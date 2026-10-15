import Image from "next/image";
import Link from "next/link";
import { SectionLabel } from "@/components/ui";
import { APP_NAME, APP_STORE_URL, VOICE_PAGE_PATH } from "@/lib/app-store";
import { FREE_DAILY_MINUTES } from "@/lib/practice-limits";

const SHOTS = [
  {
    src: "/shot-01-start-the-session.png",
    alt: "Suede Voice iPhone app: starting a practice session",
    caption: "Start a session",
  },
  {
    src: "/shot-02-hear-it-sing-it-back.png",
    alt: "Suede Voice iPhone app: hearing a reference note and singing it back",
    caption: "Hear it, sing it back",
  },
  {
    src: "/shot-05-track-the-work.png",
    alt: "Suede Voice iPhone app: progress tracking across sessions",
    caption: "Track the work",
  },
];

/** Keep these capabilities aligned with the current /voice companion page. */
const FEATURES = [
  {
    term: "Find your vocal range",
    def: "Find the low and high notes you can sing. Use the result as a starting point for practice and choosing songs.",
  },
  {
    term: "Give practice a direction",
    def: "Work through vocal exercises for warmups, pitch accuracy, breath support, and register transitions. Pick a drill and build a routine you can return to.",
  },
  {
    term: "Hear your progress",
    def: "On iPhone, follow a live pitch trace, record takes on your device, and compare your measured range with famous singers in the range library.",
  },
  {
    term: "Register analysis on iPhone",
    def: "The iPhone app has its own practice tools, recorder and register analysis. Features and purchase options can differ between platforms; each store lists the current details.",
  },
];

export function IosBand() {
  return (
    <section id="app" className="border-t border-line bg-panel/40">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <SectionLabel className="mb-4">{APP_NAME} — optional iPhone companion</SectionLabel>
        <h2 className="max-w-2xl text-2xl sm:text-3xl">
          Keep the browser studio. Add deeper analysis on iPhone.
        </h2>
        <p className="mt-3 max-w-2xl text-mut">
          The web studio gives you live pitch and range testing with no daily
          clock, plus {FREE_DAILY_MINUTES} free minutes of guided practice a day.
          No install is required. {APP_NAME}, the optional phone companion,
          has its own practice tools; the iPhone app adds register analysis.
        </p>

        {/* The source captures are 268x582; rendering them any larger just
            upscales a small PNG into a blurry one, so they cap at native size. */}
        <ul className="mt-8 grid justify-items-center gap-6 sm:grid-cols-3">
          {SHOTS.map((s) => (
            <li key={s.src} className="w-full max-w-[268px]">
              <div className="overflow-hidden rounded-2xl border border-line bg-panel">
                <Image
                  src={s.src}
                  alt={s.alt}
                  width={268}
                  height={582}
                  sizes="268px"
                  className="h-auto w-full"
                />
              </div>
              <p className="mt-2 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                {s.caption}
              </p>
            </li>
          ))}
        </ul>

        <dl className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2">
          {FEATURES.map((m) => (
            <div key={m.term}>
              <dt className="text-base font-extrabold text-ink">
                {m.term}
              </dt>
              <dd className="mt-1 text-sm text-mut">{m.def}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-9 flex flex-wrap items-center gap-4">
          <Link href={VOICE_PAGE_PATH} className="text-violet-ink underline underline-offset-4">
            Explore Suede Voice for iPhone and Android
          </Link>
          <a
            href={APP_STORE_URL}
            aria-label={`View ${APP_NAME} on the App Store`}
            className="inline-block rounded-[10px] transition-opacity hover:opacity-85"
          >
            <Image
              src="/app-store-badge.svg"
              width={168}
              height={56}
              alt="Download on the App Store"
            />
          </a>
          <p className="max-w-sm text-xs text-dim">
            The phone companion is optional. Keep practicing in the browser,
            or explore the app&apos;s own tools and purchase options.
          </p>
        </div>
      </div>
    </section>
  );
}
