import Link from "next/link";
import { SectionLabel } from "@/components/ui";
import { SITE_URL } from "@/lib/site";

/**
 * The explanatory half of a tool page.
 *
 * The practice rooms are interactive-first: a visitor who arrives ready to sing
 * gets the tool at the top and nothing in the way. But an app shell is roughly
 * a hundred words of prose, which is nothing to rank with and nothing for a
 * singer who arrived with a question rather than a warm voice. This renders
 * server-side underneath each tool: the plain answer, how to actually run the
 * exercise, what changes when you're past the beginner stage, and the questions
 * people ask about it.
 *
 * The FAQ and steps are marked up from the same strings that render, so the
 * structured data can never drift from what a reader sees.
 */

export interface GuideStep {
  title: string;
  body: string;
}

export interface GuideFaq {
  q: string;
  a: string;
}

export interface GuideLink {
  href: string;
  label: string;
  note: string;
}

export interface GuideContent {
  /** Route this guide belongs to, e.g. "/range". */
  path: string;
  /** Page entity name when the explanatory heading is not the page's H1. */
  pageName?: string;
  /** H2 above the explanatory half. */
  heading: string;
  /** The direct answer, in two or three sentences. */
  answer: string;
  /** Supporting paragraphs under the answer. */
  body: string[];
  /** Named exercise procedure. Marked up as a HowTo. */
  howTo?: {
    name: string;
    intro: string;
    steps: GuideStep[];
  };
  beginner: { heading: string; body: string; points: string[] };
  advanced: { heading: string; body: string; points: string[] };
  faq: GuideFaq[];
  related: GuideLink[];
  safety?: {
    heading: string;
    body: string;
    sources: GuideLink[];
  };
}

export function guideJsonLd(guide: GuideContent) {
  const url = `${SITE_URL}${guide.path}`;
  const graph: Record<string, unknown>[] = [
    // Without this the eight rooms emitted FAQPage and HowTo nodes floating
    // free of the site: nothing named the publisher, and nothing tied them to
    // the collection the singer pages already join. A consumer that landed on
    // one page could not resolve who stood behind the answer.
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: guide.pageName ?? guide.heading,
      description: guide.answer,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      publisher: { "@id": "https://suedeai.ai/#organization" },
      about: { "@id": `${SITE_URL}/#app` },
      mainEntity: [
        ...(guide.howTo ? [{ "@id": `${url}#howto` }] : []),
        { "@id": `${url}#faq` },
      ],
      ...(guide.safety
        ? {
            citation: guide.safety.sources.map((source) => ({
              "@type": "CreativeWork",
              name: source.label,
              url: source.href,
            })),
          }
        : {}),
      inLanguage: "en",
    },
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      isPartOf: { "@id": `${url}#webpage` },
      mainEntity: guide.faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];

  if (guide.howTo) {
    graph.push({
      "@type": "HowTo",
      "@id": `${url}#howto`,
      isPartOf: { "@id": `${url}#webpage` },
      inLanguage: "en",
      name: guide.howTo.name,
      description: guide.howTo.intro,
      // The tool is free and runs in the browser, so there is nothing to buy
      // and nothing to install; saying so explicitly is more useful to an
      // answer engine than omitting the fields.
      supply: [{ "@type": "HowToSupply", name: "A microphone" }],
      tool: [{ "@type": "HowToTool", name: "Suede Sing, in a web browser" }],
      totalTime: "PT5M",
      step: guide.howTo.steps.map((step, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: step.title,
        text: step.body,
        url: `${url}#step-${i + 1}`,
      })),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

function Prose({ children }: { children: string }) {
  return <p className="mt-4 max-w-3xl text-mut">{children}</p>;
}

export function ToolGuide({ guide }: { guide: GuideContent }) {
  return (
    <section className="mt-16 border-t border-line">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(guideJsonLd(guide)),
        }}
      />
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <SectionLabel className="mb-4">The short version</SectionLabel>
        <h2 className="max-w-3xl text-3xl">{guide.heading}</h2>
        <p className="mt-4 max-w-3xl text-lg text-ink">{guide.answer}</p>
        {guide.body.map((para) => (
          <Prose key={para.slice(0, 40)}>{para}</Prose>
        ))}

        {guide.safety && (
          <aside className="mt-8 max-w-3xl rounded-2xl border border-rec/30 bg-panel p-5 sm:p-6">
            <SectionLabel className="mb-3 border-rec/40 text-rec">
              Vocal health
            </SectionLabel>
            <h3 className="text-xl">{guide.safety.heading}</h3>
            <p className="mt-2 text-sm text-mut">{guide.safety.body}</p>
            <ul className="mt-4 space-y-2">
              {guide.safety.sources.map((source) => (
                <li key={source.href} className="text-sm text-mut">
                  <a
                    href={source.href}
                    className="font-medium text-amber-ink underline decoration-amber/40 underline-offset-4 hover:decoration-amber"
                  >
                    {source.label}
                  </a>
                  <span>. {source.note}.</span>
                </li>
              ))}
            </ul>
          </aside>
        )}

        {guide.howTo && (
          <div className="mt-12">
            <SectionLabel className="mb-4">How to do it</SectionLabel>
            <h3 className="max-w-3xl text-2xl">{guide.howTo.name}</h3>
            <p className="mt-3 max-w-3xl text-mut">{guide.howTo.intro}</p>
            <ol className="mt-6 grid gap-4 sm:grid-cols-2">
              {guide.howTo.steps.map((step, i) => (
                <li
                  key={step.title}
                  id={`step-${i + 1}`}
                  className="scroll-mt-20 rounded-2xl border border-line bg-panel p-5"
                >
                  <span className="tabular font-mono text-sm text-amber-ink">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h4 className="mt-2 text-lg font-extrabold text-ink">
                    {step.title}
                  </h4>
                  <p className="mt-1.5 text-sm text-mut">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          {[guide.beginner, guide.advanced].map((tier, i) => (
            <div
              key={tier.heading}
              className={`rounded-2xl border p-6 ${
                i === 0
                  ? "border-line bg-panel"
                  : "border-amber/40 bg-panel2/50"
              }`}
            >
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                {i === 0 ? "If you're starting out" : "If you already sing"}
              </span>
              <h3 className="mt-3 text-xl">{tier.heading}</h3>
              <p className="mt-2 text-sm text-mut">{tier.body}</p>
              <ul className="mt-4 space-y-2.5">
                {tier.points.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-2.5 text-sm text-mut"
                  >
                    <span
                      aria-hidden
                      className={`mt-0.5 font-mono ${
                        i === 0 ? "text-ok-ink" : "text-amber-ink"
                      }`}
                    >
                      ✓
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <SectionLabel className="mb-4">Questions</SectionLabel>
          <div className="grid gap-4 md:grid-cols-2">
            {guide.faq.map((item) => (
              <div
                key={item.q}
                className="rounded-2xl border border-line bg-panel p-5 sm:p-6"
              >
                <h3 className="text-lg">{item.q}</h3>
                <p className="mt-2 text-sm text-mut">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <SectionLabel className="mb-4">Where to go next</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {guide.related.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group rounded-2xl border border-line bg-panel p-5 transition-colors hover:border-amber/50"
              >
                <span className="block text-lg font-extrabold text-ink group-hover:text-amber-ink">
                  {link.label}
                </span>
                <span className="mt-1 block text-sm text-mut">{link.note}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
