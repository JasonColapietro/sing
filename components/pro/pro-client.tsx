"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, LinkButton, SectionLabel } from "@/components/ui";
import ProVisual from "./pro-visual";
import { ProChip } from "./ui";
import {
  AnalyticsGlyph,
  CoachGlyph,
  PacksGlyph,
  SongbookGlyph,
  SyncGlyph,
  TakesGlyph,
} from "./glyphs";
import {
  confirmCheckout,
  openBillingPortal,
  PLAN_ROWS,
  PRO_PERKS,
  restorePro,
  startCheckout,
  useProState,
  type ProPlan,
} from "@/lib/pro";

const PERK_GLYPHS: Record<string, React.ComponentType> = {
  coach: CoachGlyph,
  analytics: AnalyticsGlyph,
  takes: TakesGlyph,
  songs: SongbookGlyph,
  warmups: PacksGlyph,
  history: SyncGlyph,
};

const PRO_CARD_POINTS = [
  "Adaptive coach plan, rebuilt daily",
  "Per-note accuracy + range history",
  "Pitch analysis on every take",
  "Full songbook, weekly drops",
  "Pro warmup packs + cloud sync",
];

const FREE_CARD_POINTS = [
  "All ten practice rooms",
  "Live pitch feedback + range test",
  "Recorder with A/B compare",
  "XP, streaks, achievements",
  "No ads, no signup, no trial clock",
];

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "Does the free studio stay free?",
    a: "Yes — permanently. All ten rooms, live pitch feedback, the range test, the recorder: none of it moves behind Pro. Pro only adds things that don't exist today.",
  },
  {
    q: "Do I need Pro to get better?",
    a: "No. Free covers real, daily practice. Pro is for singers who want a coach's ear on top: it finds your weak notes, plans tomorrow's session, and shows the long arc of your range.",
  },
  {
    q: "Is my voice uploaded?",
    a: "No. Pitch analysis runs on your device on both tiers. Pro's cloud sync backs up your progress numbers and takes only if you turn it on — and you can keep it off.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Anytime, in one click, no email required. You drop back to free and keep every recording, score, and streak you earned.",
  },
  {
    q: "Why does a free app sell anything?",
    a: "Suede Sing is built by one musician. Pro is what keeps the free studio free — instead of ads, trackers, or selling your data. One tier, one honest price.",
  },
];

function BillingToggle({
  billing,
  onChange,
}: {
  billing: ProPlan;
  onChange: (b: ProPlan) => void;
}) {
  const seg = (value: ProPlan, label: string, extra?: string) => (
    <button
      type="button"
      aria-pressed={billing === value}
      onClick={() => onChange(value)}
      className={`rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-[0.14em] transition-colors ${
        billing === value
          ? "bg-amber text-[#241a05]"
          : "text-mut hover:text-ink"
      }`}
    >
      {label}
      {extra && (
        <span className={billing === value ? "opacity-70" : "text-ok"}>
          {" "}
          {extra}
        </span>
      )}
    </button>
  );
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-line bg-panel p-1">
      {seg("monthly", "Monthly")}
      {seg("annual", "Annual", "−38%")}
    </div>
  );
}

function PlanPoint({ children, gold }: { children: string; gold?: boolean }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-mut">
      <span
        aria-hidden
        className={`mt-0.5 font-mono ${gold ? "text-amber-ink" : "text-ok"}`}
      >
        ✓
      </span>
      {children}
    </li>
  );
}

type Task =
  | { kind: "idle" }
  | { kind: "working" }
  | { kind: "error"; message: string };

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function longDate(iso: string | null): string | null {
  if (!iso) return null;
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return null;
  return when.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Recovers Pro on a fresh browser, where the local entitlement is gone. */
function RestorePanel() {
  const [email, setEmail] = useState("");
  const [task, setTask] = useState<Task>({ kind: "idle" });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTask({ kind: "working" });
    try {
      await restorePro(email);
      setTask({ kind: "idle" });
    } catch (error) {
      setTask({
        kind: "error",
        message: messageOf(error, "Could not restore Pro just now."),
      });
    }
  };

  return (
    <details className="rounded-2xl border border-line bg-panel px-5 py-4">
      <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.14em] text-mut">
        Already subscribed? Unlock Pro on this device
      </summary>
      <form onSubmit={submit} className="mt-4 flex flex-wrap items-center gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          aria-label="Email you paid with"
          className="min-w-[12rem] flex-1 rounded-full border border-line2 bg-bg px-4 py-2.5 text-sm text-ink placeholder:text-dim"
        />
        <Button
          type="submit"
          variant="outline"
          size="md"
          disabled={task.kind === "working"}
        >
          {task.kind === "working" ? "Checking…" : "Unlock Pro"}
        </Button>
      </form>
      {task.kind === "error" && (
        <p className="mt-3 text-sm text-rec">{task.message}</p>
      )}
      <p className="mt-3 text-xs text-dim">
        Pro unlocks per browser, since there are no accounts. Enter the email
        you paid with and it unlocks here too.
      </p>
    </details>
  );
}

export function ProClient() {
  const pro = useProState();
  const [billing, setBilling] = useState<ProPlan>("annual");
  const [justUpgraded, setJustUpgraded] = useState(false);
  const [checkout, setCheckout] = useState<Task>({ kind: "idle" });
  const [portal, setPortal] = useState<Task>({ kind: "idle" });
  const [abandoned, setAbandoned] = useState(false);

  const price = billing === "annual" ? "$2.50" : "$4";
  const priceNote =
    billing === "annual" ? "per month · $30 billed once a year" : "per month · billed monthly";
  const periodEnd = longDate(pro.currentPeriodEnd);

  // Stripe returns to /pro?checkout=success&session_id=… — confirm the
  // session with the API, then strip the query so a refresh stays clean.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const outcome = params.get("checkout");
    if (!sessionId && !outcome) return;
    window.history.replaceState({}, "", "/pro");

    if (sessionId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the session id only exists in the URL, so confirmation can only start after hydration
      setCheckout({ kind: "working" });
      confirmCheckout(sessionId)
        .then((state) => {
          setCheckout({ kind: "idle" });
          if (state.active) setJustUpgraded(true);
        })
        .catch((error: unknown) =>
          setCheckout({
            kind: "error",
            message: messageOf(
              error,
              "Payment went through, but we couldn't confirm it here. Use the unlock form below.",
            ),
          }),
        );
      return;
    }
    setAbandoned(true);
  }, []);

  const goPro = useCallback(async () => {
    setCheckout({ kind: "working" });
    setAbandoned(false);
    try {
      await startCheckout(billing);
    } catch (error) {
      setCheckout({
        kind: "error",
        message: messageOf(error, "Could not start checkout."),
      });
    }
  }, [billing]);

  const manageBilling = useCallback(async () => {
    setPortal({ kind: "working" });
    try {
      await openBillingPortal();
    } catch (error) {
      setPortal({
        kind: "error",
        message: messageOf(error, "Could not open the billing portal."),
      });
    }
  }, []);

  return (
    <main>
      {/* 1 — Hero */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="animate-fadeup">
            <SectionLabel className="mb-4 border-amber/50 text-amber-ink">
              Suede Pro — the gold channel
            </SectionLabel>
            {pro.active ? (
              <>
                <h1 className="text-4xl leading-tight sm:text-5xl">
                  You&apos;re on the
                  <br />
                  gold channel.
                </h1>
                <p className="mt-4 max-w-xl text-lg text-mut">
                  Every session now feeds your coach report: per-note accuracy,
                  range history, and tomorrow&apos;s plan. Thanks for keeping
                  the free studio free.
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <LinkButton href="/progress" variant="amber" size="lg">
                    Open your coach report
                  </LinkButton>
                  <LinkButton href="/warmups" variant="outline" size="lg">
                    Start a pro warmup
                  </LinkButton>
                </div>
                {pro.status === "past_due" && (
                  <p className="mt-5 max-w-xl rounded-xl border border-rec/40 bg-rec/10 px-3 py-2 text-sm text-rec">
                    Your last payment didn&apos;t go through. Pro stays on
                    while Stripe retries — update your card to keep it.
                  </p>
                )}
                {pro.cancelAtPeriodEnd && periodEnd && (
                  <p className="mt-5 max-w-xl rounded-xl border border-line2 bg-panel2/60 px-3 py-2 text-sm text-mut">
                    Pro is set to end on {periodEnd}. You keep everything you
                    earned when it does.
                  </p>
                )}
                <p className="mt-6 font-mono text-xs uppercase tracking-[0.14em] text-dim">
                  {pro.plan === "annual" ? "Annual plan" : "Monthly plan"}
                  {periodEnd && (
                    <>
                      <span className="mx-2 text-line2">·</span>
                      {pro.cancelAtPeriodEnd ? "Ends" : "Renews"} {periodEnd}
                    </>
                  )}
                  <span className="mx-2 text-line2">·</span>Voice stays on
                  device
                </p>
              </>
            ) : (
              <>
                <h1 className="text-4xl leading-tight sm:text-5xl">
                  Keep the free studio.
                  <br />
                  Add the coach.
                </h1>
                <p className="mt-4 max-w-xl text-lg text-mut">
                  Everything you practice with today stays free, forever. Pro
                  layers a coach on top — adaptive daily plans, per-note
                  analytics, pitch analysis on your takes, and the full
                  songbook.
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <LinkButton href="#plans" variant="amber" size="lg">
                    Go Pro — from $2.50/mo
                  </LinkButton>
                  <LinkButton href="/studio" variant="ghost" size="lg">
                    Keep practicing free
                  </LinkButton>
                </div>
                <p className="mt-6 font-mono text-xs uppercase tracking-[0.14em] text-dim">
                  Cancel anytime<span className="mx-2 text-line2">·</span>Free
                  stays free<span className="mx-2 text-line2">·</span>Voice
                  stays on device
                </p>
              </>
            )}
          </div>
          <div className="animate-fadeup">
            <ProVisual />
          </div>
        </div>
      </section>

      {/* 2 — Perks */}
      <section className="border-t border-line">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <SectionLabel className="mb-4">What gold adds</SectionLabel>
          <h2 className="max-w-2xl text-3xl">
            A coach&apos;s ear on every session
          </h2>
          <p className="mt-3 max-w-2xl text-mut">
            Free tells you how today went. Pro remembers every session, finds
            the patterns, and plans what to sing tomorrow.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PRO_PERKS.map((perk) => {
              const Glyph = PERK_GLYPHS[perk.id];
              return (
                <div
                  key={perk.id}
                  className="rounded-2xl border border-line bg-panel p-5 sm:p-6"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-amber/40 bg-panel2 text-amber-ink">
                    <Glyph />
                  </span>
                  <span className="mt-4 block font-display text-xl font-extrabold text-ink">
                    {perk.title}
                  </span>
                  <span className="mt-1 block text-sm text-mut">
                    {perk.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3 — Plans */}
      <section id="plans" className="scroll-mt-20 border-t border-line bg-panel/40">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          {justUpgraded ? (
            <div className="animate-fadeup mx-auto mb-10 max-w-2xl rounded-2xl border border-amber bg-panel p-6 text-center sm:p-8">
              <ProChip className="mx-auto" />
              <h2 className="mt-3 text-3xl">Welcome to the gold channel</h2>
              <p className="mx-auto mt-2 max-w-md text-mut">
                Your coach starts listening on your next session. Sing one
                warmup and watch the report build itself.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <LinkButton href="/warmups" variant="amber" size="md">
                  Sing your first pro warmup
                </LinkButton>
                <LinkButton href="/progress" variant="outline" size="md">
                  See your dashboard
                </LinkButton>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <SectionLabel className="mb-4">Plans</SectionLabel>
                <h2 className="max-w-2xl text-3xl">
                  One price, every gold feature
                </h2>
                <p className="mt-3 max-w-xl text-mut">
                  No tiers inside the tier. No feature roulette. Coffee money,
                  once a month — and early singers lock the founding price for
                  life.
                </p>
              </div>
              <BillingToggle billing={billing} onChange={setBilling} />
            </div>
          )}

          {checkout.kind === "working" && !justUpgraded && (
            <p className="mx-auto mt-8 max-w-2xl rounded-xl border border-amber/40 bg-panel px-4 py-3 text-center text-sm text-mut">
              Confirming your payment with Stripe…
            </p>
          )}
          {checkout.kind === "error" && (
            <p className="mx-auto mt-8 max-w-2xl rounded-xl border border-rec/40 bg-rec/10 px-4 py-3 text-center text-sm text-rec">
              {checkout.message}
            </p>
          )}
          {abandoned && (
            <p className="mx-auto mt-8 max-w-2xl rounded-xl border border-line2 bg-panel px-4 py-3 text-center text-sm text-mut">
              Checkout cancelled — nothing was charged. The free studio is
              exactly where you left it.
            </p>
          )}

          <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
            {/* Free */}
            <div className="flex flex-col rounded-2xl border border-line bg-panel p-6 sm:p-7">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-mut">
                Free
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="tabular font-mono text-4xl text-ink">$0</span>
                <span className="text-sm text-mut">forever</span>
              </div>
              <p className="mt-2 text-sm text-mut">
                The whole studio. What you&apos;re using right now.
              </p>
              <ul className="mt-5 space-y-2.5">
                {FREE_CARD_POINTS.map((point) => (
                  <PlanPoint key={point}>{point}</PlanPoint>
                ))}
              </ul>
              <div className="mt-auto pt-6">
                <LinkButton
                  href="/studio"
                  variant="outline"
                  size="md"
                  className="w-full"
                >
                  Keep practicing free
                </LinkButton>
              </div>
            </div>

            {/* Pro */}
            <div className="relative flex flex-col overflow-hidden rounded-2xl border border-amber bg-panel p-6 sm:p-7">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-soft via-amber to-amber-soft"
              />
              <span className="flex items-center gap-2">
                <ProChip />
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-amber-ink">
                  The gold channel
                </span>
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="tabular font-mono text-4xl text-ink">
                  {price}
                </span>
                <span className="text-sm text-mut">{priceNote}</span>
              </div>
              <span className="mt-2 inline-flex w-fit items-center rounded border border-amber/50 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-amber-ink">
                Founding price — locked for life
              </span>
              <p className="mt-2 text-sm text-mut">
                Everything in Free, plus the coach.
              </p>
              <ul className="mt-5 space-y-2.5">
                {PRO_CARD_POINTS.map((point) => (
                  <PlanPoint key={point} gold>
                    {point}
                  </PlanPoint>
                ))}
              </ul>
              <div className="mt-auto pt-6">
                {pro.active ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex w-full items-center justify-center gap-2 rounded-full bg-amber px-5 py-2.5 font-mono text-sm font-semibold text-[#241a05]">
                      ✓ Active — {pro.plan === "annual" ? "annual" : "monthly"}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={manageBilling}
                      disabled={portal.kind === "working"}
                    >
                      {portal.kind === "working"
                        ? "Opening Stripe…"
                        : "Manage or cancel"}
                    </Button>
                    {portal.kind === "error" && (
                      <p className="text-center text-xs text-rec">
                        {portal.message}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <Button
                      variant="amber"
                      size="md"
                      className="w-full"
                      onClick={goPro}
                      disabled={checkout.kind === "working"}
                    >
                      {checkout.kind === "working"
                        ? "Opening Stripe…"
                        : `Go Pro — ${billing === "annual" ? "$30/year" : "$4/month"}`}
                    </Button>
                    <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-dim">
                      Secure checkout by Stripe
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <p className="mx-auto mt-6 max-w-4xl text-center font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            Cancel in one click · Keep everything you earned · Founding price
            locked for life
          </p>

          {!pro.active && (
            <div className="mx-auto mt-6 max-w-4xl">
              <RestorePanel />
            </div>
          )}
        </div>
      </section>

      {/* 4 — Free vs Pro table */}
      <section className="border-t border-line">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <SectionLabel className="mb-4">Side by side</SectionLabel>
          <h2 className="max-w-2xl text-3xl">Exactly where free ends</h2>
          <p className="mt-3 max-w-2xl text-mut">
            No asterisks. If a row says free, it&apos;s free forever.
          </p>
          <div className="mt-8 w-full min-w-0 [contain:layout]">
            <div className="no-scrollbar w-full min-w-0 overflow-x-auto rounded-2xl border border-line bg-panel [contain:layout]">
              <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-line">
                    <th scope="col" className="px-4 py-3.5 font-normal">
                      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                        Feature
                      </span>
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3.5 font-mono text-[11px] uppercase tracking-[0.14em] font-normal text-mut"
                    >
                      Free
                    </th>
                    <th
                      scope="col"
                      className="bg-panel2 px-4 py-3.5 font-mono text-[11px] uppercase tracking-[0.14em] text-amber-ink"
                    >
                      Pro
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {PLAN_ROWS.map((row, i) => (
                    <tr
                      key={row.label}
                      className={
                        i < PLAN_ROWS.length - 1
                          ? "border-b border-line"
                          : undefined
                      }
                    >
                      <th
                        scope="row"
                        className="px-4 py-3 font-normal text-ink"
                      >
                        {row.label}
                      </th>
                      <td className="px-4 py-3 text-mut">{row.free}</td>
                      <td className="bg-panel2/60 px-4 py-3 text-amber-ink">
                        {row.pro}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 5 — Why paid strip */}
      <section className="border-t border-line bg-panel/40">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 sm:px-6">
          <p className="max-w-xl text-sm text-mut">
            <span className="text-ink">Pro is what keeps free free.</span> One
            musician builds this. Pro pays for it — instead of ads, trackers,
            or selling your data.
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            No ads<span className="mx-2 text-line2">·</span>No data selling
            <span className="mx-2 text-line2">·</span>No trial countdown
          </p>
        </div>
      </section>

      {/* 6 — FAQ */}
      <section className="border-t border-line">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <SectionLabel className="mb-4">Fair questions</SectionLabel>
          <h2 className="max-w-2xl text-3xl">Before you decide</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {FAQ.map((item) => (
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
      </section>

      {/* 7 — Final CTA */}
      <section className="border-t border-line">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 text-center sm:px-6">
          <h2 className="text-3xl sm:text-4xl">
            Sing free forever. Or bring in the coach.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-mut">
            Either way, your voice never leaves this device — and your practice
            never hits a paywall it didn&apos;t have yesterday.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <LinkButton href="#plans" variant="amber" size="lg">
              {pro.active ? "Manage your plan" : "Go Pro — from $2.50/mo"}
            </LinkButton>
            <LinkButton href="/studio" variant="ghost" size="lg">
              Back to the studio
            </LinkButton>
          </div>
        </div>
      </section>
    </main>
  );
}
