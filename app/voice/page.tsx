import type { Metadata } from "next";
import Link from "next/link";
import { LinkButton, SectionHeading, SectionLabel } from "@/components/ui";
import { APP_NAME, APP_STORE_URL, PLAY_STORE_URL, VOICE_PAGE_PATH } from "@/lib/app-store";
import { ORG_ID, ORG_NODE } from "@/lib/organization";
import { SITE_URL } from "@/lib/site";

const TITLE = "Suede Voice: Vocal Range Test for iPhone & Android";
const DESCRIPTION =
  "Meet Suede Voice, the vocal range and singing practice app from Suede Labs AI. Get the official iPhone or Android app, or try Suede Sing in your browser.";
const PAGE_URL = `${SITE_URL}${VOICE_PAGE_PATH}`;

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: PAGE_URL,
    siteName: "Suede Sing",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [`${PAGE_URL}/opengraph-image`],
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": PAGE_URL,
      url: PAGE_URL,
      name: TITLE,
      description: DESCRIPTION,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      mainEntity: [{ "@id": `${PAGE_URL}#ios` }, { "@id": `${PAGE_URL}#android` }],
    },
    ...[
      { id: "ios", operatingSystem: "iOS 17.0 or later", store: APP_STORE_URL },
      { id: "android", operatingSystem: "Android", store: PLAY_STORE_URL },
    ].map(({ id, operatingSystem, store }) => ({
      "@type": "MobileApplication",
      "@id": `${PAGE_URL}#${id}`,
      name: `${APP_NAME}: Vocal Range Test`,
      applicationCategory: "MusicApplication",
      operatingSystem,
      url: `${PAGE_URL}#${id}`,
      installUrl: store,
      sameAs: [store],
      description: "Vocal range testing and singing practice from Suede Labs AI.",
      publisher: { "@id": ORG_ID },
      author: { "@type": "Person", name: "Jason Colapietro", url: "https://suedeai.ai/founder" },
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD", url: store },
    })),
    ORG_NODE,
  ],
};

const FEATURES = [
  { title: "Find your vocal range", body: "Run a range test to find the low and high notes you can sing. Use the result as a starting point for practice and choosing songs." },
  { title: "Give practice a direction", body: "Work through vocal exercises for warmups, pitch accuracy, breath support, and register transitions. Pick a drill and build a routine you can return to." },
  { title: "Hear your progress", body: "On iPhone, follow a live pitch trace, record takes on your device, and compare your measured range with famous singers in the range library." },
];

export default function VoicePage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      <section aria-labelledby="voice-title" className="grid items-start gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
        <div>
          <SectionLabel>Official app · Suede Labs AI</SectionLabel>
          <h1 id="voice-title" className="mt-5 text-5xl sm:text-7xl">Suede Voice</h1>
          <p className="mt-4 text-2xl text-violet-ink sm:text-3xl">Find your range. Know what to practice.</p>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-mut">
            Suede Voice: Vocal Range Test is the vocal range and singing practice
            app from Suede Labs AI, built by Jason Colapietro. It is available
            for iPhone and Android. Start with the notes you can sing, then make
            your next session count.
          </p>
          <p className="mt-5 max-w-xl text-mut">
            Prefer to start without an install? <Link href="/range" className="text-violet-ink underline underline-offset-4">Try the free vocal range test</Link> in Suede Sing, our browser studio.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-6 sm:p-8">
          <h2 className="text-2xl">Get the official app</h2>
          <p className="mt-2 text-sm text-mut">Both listings are named Suede Voice: Vocal Range Test and list Jason Colapietro as the developer.</p>
          <div id="ios" className="mt-6 scroll-mt-28">
            <h3 className="font-semibold">iPhone</h3>
            <p className="mb-3 mt-1 text-sm text-mut">iOS 17 or later. Free download with optional in-app purchases.</p>
            <LinkButton href={APP_STORE_URL} className="w-full">Download on the App Store</LinkButton>
          </div>
          <div id="android" className="mt-6 scroll-mt-28 border-t border-line pt-6">
            <h3 className="font-semibold">Android</h3>
            <p className="mb-3 mt-1 text-sm text-mut">Free download on Google Play. Check the listing for device compatibility.</p>
            <LinkButton href={PLAY_STORE_URL} variant="outline" className="w-full">Get it on Google Play</LinkButton>
          </div>
          <p className="mt-5 text-xs text-dim">Features and purchase options can differ between platforms. Each store lists the current details.</p>
        </div>
      </section>

      <section className="mt-16 border-t border-line pt-12" aria-labelledby="practice-title">
        <SectionHeading id="practice-title">A starting point for your next practice</SectionHeading>
        <div className="mt-7 grid gap-8 sm:grid-cols-3">
          {FEATURES.map(({ title, body }) => (
            <div key={title}>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-2 leading-relaxed text-mut">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14 border-t border-line pt-12" aria-labelledby="sing-and-voice">
        <SectionHeading id="sing-and-voice">How Suede Voice and Suede Sing fit together</SectionHeading>
        <p className="mt-4 max-w-3xl leading-relaxed text-mut">
          Suede Voice is the mobile app. Suede Sing is the browser studio and
          Chrome extension. Both are from Suede Labs AI. You can use the free
          browser range test, pitch studio, and warmups without installing the
          mobile app. The iPhone app adds its own practice tools, on-device
          recordings, and register analysis.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <LinkButton href="/studio" variant="outline">Open Suede Sing</LinkButton>
          <LinkButton href="/singers" variant="ghost">Explore famous vocal ranges</LinkButton>
          <LinkButton href="https://suedeai.ai/ios" variant="ghost">
            Browse all official Suede music apps
          </LinkButton>
        </div>
      </section>

      <section className="mt-14 border-t border-line pt-10" aria-labelledby="voice-support">
        <h2 id="voice-support" className="text-2xl">Questions about the app?</h2>
        <p className="mt-3 max-w-2xl text-mut">The range test measures the notes in a session. Treat a voice-type result as practice guidance; a singing teacher can help you interpret it in context.</p>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm">
          <Link href="/support" className="text-violet-ink underline underline-offset-4">Suede Voice support</Link>
          <Link href="/privacy" className="text-violet-ink underline underline-offset-4">Privacy policy</Link>
          <a href="https://suedeai.ai/founder" className="text-violet-ink underline underline-offset-4">About Jason Colapietro</a>
        </div>
      </section>
    </main>
  );
}
