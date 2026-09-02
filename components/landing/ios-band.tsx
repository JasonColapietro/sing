import Image from "next/image";
import Link from "next/link";
import { SectionLabel } from "@/components/ui";
import { APP_NAME, APP_STORE_URL, VOICE_PAGE_PATH } from "@/lib/app-store";

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

/** What the app measures that the browser studio does not. */
const MEASURES = [
  {
    term: "H1−H2 differential",
    def: "The amplitude gap between the first two harmonics of a sustained note. Near zero reads as chest voice; +6 dB or more reads as falsetto.",
  },
  {
    term: "Passaggio mapping",
    def: "Where your voice changes mechanism, found by sweeping pitch and watching that differential invert. The app reports the note where confident chest first gives way — one boundary, not a zone.",
  },
  {
    term: "Spectral tilt",
    def: "How fast harmonic energy falls away across H1–H4, in dB per octave. A steeper slope means a lighter, more falsetto-like source.",
  },
  {
    term: "Cepstral peak prominence",
    def: "A standard clinical measure of how periodic a tone is. Higher values track with clearer, less breathy phonation.",
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
          The web studio gives you live pitch, range and guided practice, free
          with no install required. If you want more detail, {APP_NAME} — the
          optional iPhone companion — adds an analysis layer: every
          sustained note becomes a row of objective measurements, and the
          result is your TonePrint.
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
          {MEASURES.map((m) => (
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
            Analysis runs on the phone. What used to need a sound booth and a
            Praat script now runs in the background of a session you already
            wanted to record.
          </p>
        </div>
      </div>
    </section>
  );
}
