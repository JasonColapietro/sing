/**
 * Every Pro description, swept as one class.
 *
 * The free plan has a coach: it scores every session, charts the weekly trend
 * and plans the first two steps of each day (components/progress/coach.tsx).
 * Pro adds the coach's FULL plan and the charts behind it, never "the coach".
 * Rounds 17-20 each fixed a named instance ("Pro adds the coach", "A coach's
 * ear on every session", "Your coach starts listening", "wants the record")
 * and missed a sibling, so this renders every surface that describes Pro, in
 * every plan state, and checks each sentence that mentions the coach.
 */
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { ProState } from "@/lib/pro";

vi.mock("server-only", () => ({}));

const proState = vi.hoisted(() => ({ current: null as unknown as ProState }));
vi.mock("@/lib/pro", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/pro")>()),
  useProState: () => proState.current,
}));

import { ProClient, WelcomePanel } from "./pro-client";
import { ProWhisper } from "./gate";
import { PRO_FAQ } from "@/lib/pro-shared";
import { PLAN_ROWS, PRO_PERKS } from "@/lib/pro";
import { buildLlmsFullTxt, buildLlmsTxt } from "@/lib/llms-txt";

const NONE: ProState = {
  active: false,
  plan: null,
  status: null,
  subscriptionId: null,
  paymentIntentId: null,
  customerId: null,
  email: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  proKey: null,
  since: null,
  lastVerified: null,
};

function text(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}

/** Rendered or built text of every surface that describes Pro, by name. */
function surfaces(): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  const states: Array<[string, ProState]> = [
    ["/pro (free)", NONE],
    ["/pro (lifetime)", { ...NONE, active: true, plan: "lifetime", status: "succeeded" }],
    ["/pro (monthly)", { ...NONE, active: true, plan: "monthly", status: "active" }],
  ];
  for (const [name, s] of states) {
    proState.current = s;
    out.push([name, text(renderToStaticMarkup(<ProClient />))]);
  }
  proState.current = NONE;
  for (const how of ["purchase", "pass", "restore"] as const) {
    out.push([
      `welcome (${how})`,
      text(renderToStaticMarkup(<WelcomePanel how={how} proKey="suede-pro_test" periodEnd={null} />)),
    ]);
  }
  out.push(["mic-gate whisper", text(renderToStaticMarkup(<ProWhisper />))]);
  out.push(["/pro FAQ + FAQPage", PRO_FAQ.map((f) => `${f.q} ${f.a}`).join("\n")]);
  out.push(["perks", PRO_PERKS.map((p) => `${p.title}. ${p.desc}`).join("\n")]);
  out.push(["plan table", PLAN_ROWS.map((r) => `${r.label}: ${r.free}. ${r.pro}.`).join("\n")]);
  out.push(["llms.txt", buildLlmsTxt()]);
  out.push(["llms-full.txt", buildLlmsFullTxt()]);
  // Copy that renders only after a client event (the result moment's dialog,
  // the nav menu's Pro card, the /pro JSON-LD and share card): their string
  // literals, read from source.
  for (const file of [
    "components/pro/moments.tsx",
    "components/nav.tsx",
    "app/pro/page.tsx",
    "app/pro/opengraph-image.tsx",
  ]) {
    const src = readFileSync(new URL(`../../${file}`, import.meta.url), "utf8")
      // Comments explain the rule; only the strings are read by a singer.
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    const literals = src.match(/"[^"\n]*"|`[^`]*`|>[^<>{}\n]+</g) ?? [];
    out.push([file, literals.map((l) => l.slice(1, -1)).join("\n").replace(/&apos;/g, "'")]);
  }
  return out;
}

/** Ways a sentence may name the coach on a Pro surface. */
const ALLOWED = [
  /coach's full (?:daily )?(?:practice )?plan/i,
  /full (?:daily |adaptive )?(?:coach )?plan/i,
  /full daily coach plan/i,
  /Coach plan:? (?:Free )?First two steps/i,
  /adaptive coach plan/i,
  /online vocal coach/i, // the /pro head term, in the H1 and title
  /vocal-coach|Vocal Coach, Pitch Trainer/i, // the Chrome extension's store name
  /coach report/i, // /progress's report, which free has too
  /coach-report/i,
];

const FORBIDDEN = [
  /coach's ear/i,
  /coach starts listening/i,
  /feeds your coach/i,
  /Pro adds (?:a|an|the|your)(?: online vocal)? coach(?!'s full)/i,
  /wants the record\b/i,
  /Pro (?:keeps|scores) (?:every|the)/i,
];

describe("Pro descriptions never sell the coach itself as Pro-only", () => {
  const all = surfaces();

  it("covers every surface that describes Pro", () => {
    expect(all.length).toBeGreaterThanOrEqual(14);
    for (const [name, t] of all) expect(t.length, name).toBeGreaterThan(20);
  });

  it("has no sentence from the old 'Pro is the coach' framing", () => {
    for (const [name, t] of all) {
      for (const bad of FORBIDDEN) expect(t, `${name}: ${bad}`).not.toMatch(bad);
    }
  });

  it("names the coach on a Pro surface only as the full plan, free's first steps, or the report", () => {
    const offenders: string[] = [];
    for (const [name, t] of all) {
      for (const sentence of t.split(/(?<=[.!?])\s+|\n/)) {
        if (!/coach/i.test(sentence)) continue;
        if (ALLOWED.some((ok) => ok.test(sentence))) continue;
        offenders.push(`${name}: ${sentence.trim()}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("heads What Pro adds with the full plan, under a hero that says free scores every session", () => {
    proState.current = NONE;
    const t = text(renderToStaticMarkup(<ProClient />));
    expect(t).toContain("What Pro adds The coach's full plan, and the charts behind it");
    expect(t).toContain("Free scores every session");
  });
});
