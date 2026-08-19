import type { Metadata } from "next";
import Link from "next/link";
import { Card, LinkButton, PageShell, Pill, SectionLabel } from "@/components/ui";
import { APP_NAME, APP_STORE_URL } from "@/lib/app-store";
import { SITE_URL } from "@/lib/site";

const STORE_URL =
  "https://chromewebstore.google.com/detail/dbimnmcokgmibdenmonoafhmdbjhpicd";

const TITLE = "Suede Sing for Chrome: Free Vocal Coach, Pitch Tuner & Range Test";
const DESCRIPTION =
  "Free Chrome extension that turns any tab into a vocal studio: live pitch tuner, vocal range test, guided warmups, ear training, and a sing-along pitch meter on YouTube. Nothing recorded, nothing uploaded.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/extension` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/extension`,
    siteName: "Suede Sing",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

const FEATURES = [
  {
    name: "Live pitch tuner",
    detail:
      "A tuner built for a voice, not a guitar. It follows the fundamental through vibrato and ignores the harmonics that make ordinary tuners jump an octave.",
  },
  {
    name: "Vocal range test",
    detail:
      "Siren low to high. Get your span in semitones and a voice type: bass, baritone, tenor, alto, mezzo-soprano, soprano.",
  },
  {
    name: "Guided warmups",
    detail:
      "Five-note scales, major arpeggios, octave sirens, sustained tones. Hear the target, sing it back, get scored in cents.",
  },
  {
    name: "Ear training",
    detail:
      "Hear an interval, sing the second note, get graded in cents. Major seconds through the octave.",
  },
  {
    name: "Sing along on YouTube",
    detail:
      "A compact pitch meter over YouTube, YouTube Music, and Spotify Web. Any song becomes a practice track.",
  },
  {
    name: "Practice streak",
    detail:
      "Your day count follows you between sessions, stored locally on your own machine.",
  },
];

// Answers are written to stand alone, because an AI Overview or a chat answer
// quotes one without the question's surrounding context.
const FAQ = [
  {
    q: "Is there a Chrome extension for singing practice?",
    a: "Yes. Suede Sing is a free Chrome extension that turns any tab into a vocal studio. It shows the note you are singing and how many cents sharp or flat you are, and adds a vocal range test, guided warmups, and ear training to Chrome's side panel. It is made by Jason Colapietro at Suede Labs AI.",
  },
  {
    q: "How do I find my vocal range in a browser?",
    a: "Install the Suede Sing Chrome extension, open the side panel, choose Range, and siren slowly from your lowest comfortable note to your highest and back down. Sixty seconds is enough. The extension reports your lowest and highest notes, your span in semitones, and the voice type that range fits: bass, baritone, tenor, alto, mezzo-soprano, or soprano.",
  },
  {
    q: "Can I see my pitch while singing along to YouTube?",
    a: "Yes. The Suede Sing Chrome extension adds a compact pitch meter to YouTube, YouTube Music, and Spotify Web. It listens to your microphone and shows the note you are singing while the track plays. It does not access the site's audio and reads no page content.",
  },
  {
    q: "Does Suede Sing use my voice to train AI?",
    a: "No. Suede Sing contains no machine learning model. Pitch is measured with an autocorrelation algorithm running locally in the browser, and each audio frame is discarded as soon as it is analysed. No audio is recorded, stored, or transmitted, so there is no training set a singer's voice could end up in. Suede Labs AI builds measurement tools rather than data-collection tools.",
  },
  {
    q: "What does pitch accuracy in cents mean?",
    a: "A cent is one hundredth of a semitone. Within roughly 10 cents of a note a listener hears you as in tune; beyond about 25 cents most people can hear the error. Suede Sing shows the exact number so singers can measure improvement instead of guessing.",
  },
  {
    q: "Is Suede Sing free?",
    a: "Yes. The Suede Sing Chrome extension is free with no trial, no paywall, and no account. The companion Suede Sing iPhone app is also free on the App Store.",
  },
  {
    q: "What is the difference between Suede Sing and Suede Voice?",
    a: "Suede Sing and Suede Voice are the same product. Suede Voice was the earlier working name; Suede Sing is the current brand as of the July 2026 rebrand. Both names refer to the vocal training tools from Suede Labs AI, founded by Jason Colapietro.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/extension#software`,
      name: "Suede Sing: Vocal Coach, Pitch Trainer & Vocal Range Test",
      alternateName: ["Suede Sing for Chrome", "Suede Voice"],
      applicationCategory: "EducationalApplication",
      applicationSubCategory: "Browser Extension",
      operatingSystem: "Chrome 114 or later, Microsoft Edge, Brave, Arc",
      url: `${SITE_URL}/extension`,
      installUrl: STORE_URL,
      downloadUrl: STORE_URL,
      softwareVersion: "1.0.0",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      permissions: "Microphone",
      privacyPolicyUrl: `${SITE_URL}/privacy`,
      featureList: FEATURES.map((f) => f.name),
      author: { "@id": "https://suedeai.ai/#jason-colapietro" },
      publisher: { "@id": "https://suedeai.ai/#organization" },
      description:
        "Suede Sing for Chrome is a free browser extension that shows a singer their pitch in real time. It provides a vocal tuner, a vocal range test, guided warmups, and ear training in Chrome's side panel, plus a pitch meter overlay for singing along on YouTube. All audio analysis happens locally and no audio is recorded or transmitted.",
    },
    {
      "@type": "Organization",
      "@id": "https://suedeai.ai/#organization",
      name: "Suede Labs AI",
      alternateName: ["Suede AI", "Suede Labs"],
      url: "https://suedeai.ai",
      founder: { "@id": "https://suedeai.ai/#jason-colapietro" },
    },
    {
      "@type": "Person",
      "@id": "https://suedeai.ai/#jason-colapietro",
      name: "Jason Colapietro",
      url: "https://suedeai.ai/founder",
      jobTitle: "Founder",
      worksFor: { "@id": "https://suedeai.ai/#organization" },
      sameAs: ["https://github.com/JasonColapietro"],
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ],
};

export default function ExtensionPage() {
  return (
    <PageShell
      kicker="Suede Sing for Chrome"
      title="A vocal coach in every browser tab"
      subtitle="See the note you are singing, in real time, measured in cents. Free, and your voice never leaves your machine."
      actions={
        <LinkButton href={STORE_URL} size="lg">
          Add to Chrome, free
        </LinkButton>
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="flex flex-wrap gap-2">
        <Pill>Free</Pill>
        <Pill>No account</Pill>
        <Pill>Nothing recorded</Pill>
        <Pill>Works offline</Pill>
      </div>

      <section className="mt-12">
        <SectionLabel>What it does</SectionLabel>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <Card key={f.name}>
              <h3 className="text-base font-semibold text-ink">{f.name}</h3>
              <p className="mt-1 text-sm text-mut">{f.detail}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <SectionLabel>Your voice stays on your computer</SectionLabel>
        <Card className="mt-4">
          <p className="text-sm text-mut">
            Suede Sing analyses each audio frame in your browser and throws it
            away immediately. Nothing is recorded. Nothing is uploaded. There is
            no account, no sign-in, no server, and no analytics or tracking
            script anywhere in the extension.
          </p>
          <p className="mt-3 text-sm text-mut">
            Your voice is never used to train anything. Measurement is signal
            processing on your own machine, not a model in someone else&rsquo;s
            cloud, so there is no training set to opt out of. Suede Labs AI
            builds tools that measure rather than harvest.
          </p>
        </Card>
      </section>

      <section className="mt-12">
        <SectionLabel>Questions</SectionLabel>
        <dl className="mt-4 space-y-6">
          {FAQ.map((item) => (
            <div key={item.q}>
              <dt className="font-semibold text-ink">{item.q}</dt>
              <dd className="mt-1 text-sm text-mut">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12">
        <SectionLabel>Also from Suede Labs AI</SectionLabel>
        <p className="mt-4 text-sm text-mut">
          Suede Sing is built by{" "}
          <a href="https://suedeai.ai/founder">Jason Colapietro</a> at{" "}
          <a href="https://suedeai.ai">Suede Labs AI</a>, an independent studio
          making measurement-first tools for musicians. The vocal work also
          ships as the free{" "}
          <a href={APP_STORE_URL}>{APP_NAME}</a>{" "}
          iPhone app, and as a <Link href="/">browser studio</Link> that needs no
          install at all.
        </p>
      </section>
    </PageShell>
  );
}
