"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, LinkButton, SectionLabel } from "@/components/ui";
import ProVisual from "./pro-visual";
import { ProChip } from "./ui";
import {
  AnalyticsGlyph,
  CoachGlyph,
  PacksGlyph,
  BookGlyph,
  SongbookGlyph,
  SyncGlyph,
  TakesGlyph,
} from "./glyphs";
import {
  clearPendingCheckout,
  confirmCheckout,
  openBillingPortal,
  pendingCheckout,
  PLAN_ROWS,
  PRO_PERKS,
  redeemCode,
  rememberPendingCheckout,
  restorePro,
  startCheckout,
  useProState,
} from "@/lib/pro";
import {
  formatPrice,
  PRICING,
  PRO_FAQ,
  type CheckoutPlan,
} from "@/lib/pro-shared";
import {
  PRO_EXERCISES,
  PRO_PACK_COUNT,
  TOTAL_CHAPTERS,
  TOTAL_WORDS,
} from "@/lib/pro-inventory";
import { UnlockStack } from "./unlock-stack";

const PERK_GLYPHS: Record<string, React.ComponentType> = {
  coach: CoachGlyph,
  analytics: AnalyticsGlyph,
  takes: TakesGlyph,
  songs: SongbookGlyph,
  warmups: PacksGlyph,
  book: BookGlyph,
  history: SyncGlyph,
};

/**
 * Numbers first, feature names second.
 *
 * This list used to open with "Adaptive coach plan, rebuilt daily" — a phrase
 * a stranger can neither verify nor weigh before paying, and the kind of claim
 * every app on the internet makes. The counts underneath it are the part that
 * survives scrutiny, and they are checked against the shipped data on every
 * build by lib/pro-inventory.test.ts.
 */
const PRO_CARD_POINTS = [
  `${TOTAL_WORDS.toLocaleString("en-US")} words across ${TOTAL_CHAPTERS} chapters — both books, in full`,
  "Both PDFs, downloadable and yours to keep",
  `${PRO_EXERCISES} pro warmup exercises in ${PRO_PACK_COUNT} packs`,
  "Pitch analysis on every recorded take",
  "Per-note accuracy and your range charted over months",
  "Adaptive coach plan, rebuilt daily",
  "Continuous cloud sync across devices",
];

const FREE_CARD_POINTS = [
  "All ten practice rooms, 3 minutes of guided practice a day",
  "Live pitch feedback + range test, unlimited",
  "Recorder with A/B compare",
  "XP, streaks, achievements",
  "No ads, no signup, no trial clock",
];


function PlanPoint({ children, gold }: { children: string; gold?: boolean }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-mut">
      <span
        aria-hidden
        className={`mt-0.5 font-mono ${gold ? "text-violet-ink" : "text-ok-ink"}`}
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
  /** `ref` is the checkout session id, shown only when someone has paid and confirmation still failed. */
  | { kind: "error"; message: string; ref?: string };

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

/** The key a Pro owner uses to unlock access in another browser. */
function ProKeyRow({ proKey }: { proKey: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(proKey);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — the key is selectable on screen either way
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-line bg-panel2/50 px-3 py-2.5 text-left">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-dim">
          Your Pro key
        </span>
        <button
          type="button"
          onClick={copy}
          className="font-mono text-[10px] uppercase tracking-[0.14em] text-violet-ink underline decoration-violet/50 underline-offset-4 hover:decoration-violet"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <code className="mt-1.5 block truncate font-mono text-xs text-mut">
        {proKey}
      </code>
      <p className="mt-1.5 text-xs text-dim">
        Unlocks Pro in another browser. Worth keeping somewhere safe.
      </p>
    </div>
  );
}

/** Turns a comp code into a 30-day pass. No card, no checkout. */
function RedeemPanel() {
  const [code, setCode] = useState("");
  const [task, setTask] = useState<Task>({ kind: "idle" });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTask({ kind: "working" });
    try {
      await redeemCode(code);
      setTask({ kind: "idle" });
    } catch (error) {
      setTask({
        kind: "error",
        message: messageOf(error, "Could not redeem that code just now."),
      });
    }
  };

  return (
    <details className="rounded-2xl border border-line bg-panel px-5 py-4">
      <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.14em] text-mut">
        Have a code? Start a 30-day pass
      </summary>
      <form onSubmit={submit} className="mt-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          required
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Your code"
          aria-label="Your comp code"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={64}
          className="min-w-[12rem] flex-1 rounded-full border border-line2 bg-bg px-4 py-2.5 font-mono text-sm uppercase tracking-[0.08em] text-ink placeholder:normal-case placeholder:tracking-normal placeholder:text-dim"
        />
        <Button
          type="submit"
          variant="violet"
          size="md"
          disabled={task.kind === "working"}
        >
          {task.kind === "working" ? "Checking…" : "Start my 30 days"}
        </Button>
      </form>
      {task.kind === "error" && (
        <p className="mt-3 text-sm text-rec">{task.message}</p>
      )}
      <p className="mt-3 text-xs text-dim">
        Every Pro feature for 30 days. No card, no charge, and it ends by itself
        — there&apos;s nothing to cancel.
      </p>
    </details>
  );
}

/** Recovers Pro on a fresh browser, where the local entitlement is gone. */
function RestorePanel() {
  const [key, setKey] = useState("");
  const [task, setTask] = useState<Task>({ kind: "idle" });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTask({ kind: "working" });
    try {
      await restorePro(key);
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
        Already have Pro? Unlock it on this device
      </summary>
      <form onSubmit={submit} className="mt-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          required
          value={key}
          onChange={(event) => setKey(event.target.value)}
          placeholder="suede-pro_…"
          aria-label="Your Pro key"
          autoComplete="off"
          spellCheck={false}
          className="min-w-[12rem] flex-1 rounded-full border border-line2 bg-bg px-4 py-2.5 font-mono text-sm text-ink placeholder:text-dim"
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
        Pro unlocks per browser, since there are no accounts. Paste the Pro key
        from the browser where you bought or subscribed. Lost it? Email
        hey@suedeai.ai and we&apos;ll send a new one.
      </p>
    </details>
  );
}

export function ProClient() {
  const pro = useProState();
  const [billing, setBilling] = useState<CheckoutPlan>("monthly");
  const [justUpgraded, setJustUpgraded] = useState(false);
  const [checkout, setCheckout] = useState<Task>({ kind: "idle" });
  const [portal, setPortal] = useState<Task>({ kind: "idle" });
  const [abandoned, setAbandoned] = useState(false);

  const lifetimePurchase = billing === "lifetime";
  const subscriptionPlan = pro.plan === "monthly" || pro.plan === "annual";
  const showPurchaseOptions = !pro.active;
  const price = formatPrice(PRICING[billing].amount);
  const priceUnit = lifetimePurchase ? "one time" : "per month";
  const priceNote = lifetimePurchase
    ? "One payment. Lifetime Pro. No renewal."
    : `Keep the ${formatPrice(PRICING.monthly.amount)} monthly price while your subscription remains active. Cancel anytime.`;
  const plansBlurb = `Early Access is ${formatPrice(PRICING.monthly.amount)} a month. Keep that monthly price while your subscription remains active. Or pay ${formatPrice(PRICING.lifetime.amount)} once for lifetime access. Both unlock the same Pro tier; lifetime never renews.`;
  const periodEnd = longDate(pro.currentPeriodEnd);

  // Stripe returns to /pro?checkout=success&session_id=… — confirm the
  // session with the API, then strip the query so a refresh stays clean.
  //
  // The id is parked in storage before the query is stripped, and a parked one
  // resumes on the next load. Confirmation is the step between "charged" and
  // "has Pro", and it used to get exactly one attempt against an id that no
  // longer existed anywhere once it failed.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("session_id");
    const outcome = params.get("checkout");
    const sessionId = fromUrl ?? pendingCheckout();
    if (fromUrl || outcome) window.history.replaceState({}, "", "/pro");
    if (!sessionId && !outcome) return;

    if (sessionId) {
      rememberPendingCheckout(sessionId);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the session id only exists in the URL, so confirmation can only start after hydration
      setCheckout({ kind: "working" });
      confirmCheckout(sessionId)
        .then((state) => {
          if (state.active) {
            setCheckout({ kind: "idle" });
            setJustUpgraded(true);
            return;
          }
          // Stripe answered, and the answer wasn't "active" — retrying
          // won't change that, so stop and hand over something support can act on.
          clearPendingCheckout();
          setCheckout({
            kind: "error",
            message:
              "Your payment went through, but Stripe doesn't show active Pro access yet. Give it a minute and reload. If it sticks, email hey@suedeai.ai with this reference and we'll sort it out.",
            ref: sessionId,
          });
        })
        .catch(() =>
          // Deliberately not the API's message. Whatever Stripe's outage
          // sounded like, the thing this person needs to read is that the
          // charge is safe, the retry is automatic, and support has a handle.
          setCheckout({
            kind: "error",
            message:
              "Your payment went through, but we couldn't confirm it here. Reload this page and we'll try again. Nothing is lost. If it keeps failing, email hey@suedeai.ai with this reference.",
            ref: sessionId,
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
            <SectionLabel className="mb-4 border-violet/50 text-violet-ink">
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
                  <LinkButton href="/progress" variant="violet" size="lg">
                    Open your coach report
                  </LinkButton>
                  <LinkButton href="/warmups" variant="outline" size="lg">
                    Start a pro warmup
                  </LinkButton>
                </div>
                {subscriptionPlan && pro.status === "past_due" && (
                  <p className="mt-5 max-w-xl rounded-xl border border-rec/40 bg-rec/10 px-3 py-2 text-sm text-rec">
                    Your last payment didn&apos;t go through. Pro stays on
                    while Stripe retries — update your card to keep it.
                  </p>
                )}
                {subscriptionPlan && pro.cancelAtPeriodEnd && periodEnd && (
                  <p className="mt-5 max-w-xl rounded-xl border border-line2 bg-panel2/60 px-3 py-2 text-sm text-mut">
                    Pro is set to end on {periodEnd}. You keep everything you
                    earned when it does.
                  </p>
                )}
                <p className="mt-6 font-mono text-xs uppercase tracking-[0.14em] text-dim">
                  {pro.plan === "lifetime"
                    ? "Lifetime access"
                    : pro.plan === "annual"
                      ? "Annual plan"
                      : "Monthly plan"}
                  {subscriptionPlan && periodEnd && (
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
                  The studio and the range test stay free, and free accounts
                  get three minutes of guided practice a day. Pro removes the
                  clock and layers a coach on top — adaptive daily plans,
                  per-note analytics, pitch analysis on your takes, and the
                  full songbook.
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <LinkButton href="#plans" variant="violet" size="lg">
                    Go Pro
                  </LinkButton>
                  <LinkButton href="/studio" variant="ghost" size="lg">
                    Keep practicing free
                  </LinkButton>
                </div>
                <p className="mt-6 font-mono text-xs uppercase tracking-[0.14em] text-dim">
                  Keep the monthly price while the subscription remains active
                  <span className="mx-2 text-line2">·</span>Lifetime never
                  renews<span className="mx-2 text-line2">·</span>Voice stays
                  on device
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
          <h2 className="max-w-2xl text-2xl sm:text-3xl">
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
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-violet/40 bg-panel2 text-violet-ink">
                    <Glyph />
                  </span>
                  <span className="mt-4 block text-xl font-extrabold text-ink">
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
            <div className="animate-fadeup mx-auto mb-10 max-w-2xl rounded-2xl border border-violet bg-panel p-6 text-center sm:p-8">
              <ProChip className="mx-auto" />
              <h2 className="mt-3 text-2xl sm:text-3xl">Welcome to the gold channel</h2>
              <p className="mx-auto mt-2 max-w-md text-mut">
                Your coach starts listening on your next session. Sing one
                warmup and watch the report build itself.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <LinkButton href="/warmups" variant="violet" size="md">
                  Sing your first pro warmup
                </LinkButton>
                <LinkButton href="/progress" variant="outline" size="md">
                  See your dashboard
                </LinkButton>
              </div>
              {pro.proKey && <ProKeyRow proKey={pro.proKey} />}
            </div>
          ) : (
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <SectionLabel className="mb-4">Plans</SectionLabel>
                <h2 className="max-w-2xl text-2xl sm:text-3xl">
                  One tier. Coach, analytics, songbook, two books.
                </h2>
                <p className="mt-3 max-w-xl text-mut">{plansBlurb}</p>
              </div>
            </div>
          )}

          {checkout.kind === "working" && !justUpgraded && (
            <p className="mx-auto mt-8 max-w-2xl rounded-xl border border-violet/40 bg-panel px-4 py-3 text-center text-sm text-mut">
              Confirming your payment with Stripe…
            </p>
          )}
          {checkout.kind === "error" && (
            <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-rec/40 bg-rec/10 px-4 py-3 text-center text-sm text-rec">
              <p>{checkout.message}</p>
              {checkout.ref && (
                <p className="mt-2 font-mono text-[11px] break-all text-rec/80">
                  {checkout.ref}
                </p>
              )}
            </div>
          )}
          {abandoned && (
            <p className="mx-auto mt-8 max-w-2xl rounded-xl border border-line2 bg-panel px-4 py-3 text-center text-sm text-mut">
              Checkout cancelled — nothing was charged. The free studio is
              exactly where you left it.
            </p>
          )}

          {showPurchaseOptions && (
            <div
              role="group"
              aria-label="Purchase option"
              className="mx-auto mt-10 flex w-fit items-center gap-1 rounded-full border border-line bg-panel p-1"
            >
              {(["monthly", "lifetime"] as const).map((plan) => {
                const on = billing === plan;
                return (
                  <button
                    key={plan}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setBilling(plan)}
                    className={`rounded-full px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
                      on
                        ? "bg-violet text-[#241a05]"
                        : "text-mut hover:text-ink"
                    }`}
                  >
                    {plan === "monthly"
                      ? `Monthly · ${formatPrice(PRICING.monthly.amount)}`
                      : `Lifetime · ${formatPrice(PRICING.lifetime.amount)} once`}
                  </button>
                );
              })}
            </div>
          )}

          {showPurchaseOptions && (
            <p className="mx-auto mt-3 w-fit max-w-full rounded-xl border border-violet/40 bg-violet/10 px-3 py-2 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-violet-ink">
              Founding offer: $79 lifetime is limited to the first 10 members.
            </p>
          )}

          <div
            className={`mx-auto grid max-w-4xl gap-4 sm:grid-cols-2 ${
              showPurchaseOptions ? "mt-6" : "mt-10"
            }`}
          >
            {/* Free */}
            <div className="flex flex-col rounded-2xl border border-line bg-panel p-6 sm:p-7">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-mut">
                Free
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="tabular font-mono text-3xl text-mut">$0</span>
                <span className="text-sm text-mut">the whole studio</span>
              </div>
              <p className="mt-2 text-sm text-mut">
                Every practice room, open right now.
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

            {/* Pro — deliberately the louder card: this is the recommendation,
                not a second option of equal weight. Roomier sides only, so both
                cards' CTAs still land on the same baseline. */}
            <div className="relative flex flex-col overflow-hidden rounded-2xl border border-violet bg-panel bg-[radial-gradient(460px_200px_at_50%_-10%,color-mix(in_oklab,var(--color-violet)_16%,transparent),transparent_62%)] px-7 py-6 ring-1 ring-violet/30 sm:px-8 sm:py-7">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet via-violet to-violet"
              />
              <span className="mb-3 inline-flex w-fit items-center rounded bg-violet px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#241a05]">
                {pro.active ? "Your Pro access" : "Early Access"}
              </span>
              <span className="flex items-center gap-2">
                <ProChip />
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-violet-ink">
                  The gold channel
                </span>
              </span>
              {pro.active ? (
                <>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-mono text-4xl text-violet-ink sm:text-5xl">
                      {pro.plan === "lifetime"
                        ? "Lifetime"
                        : pro.plan === "annual"
                          ? "Annual"
                          : "Monthly"}
                    </span>
                    <span className="text-sm text-mut">your plan</span>
                  </div>
                  <p className="mt-1.5 text-sm text-mut">
                    {pro.plan === "lifetime"
                      ? "No subscription. No renewal. Yours for life."
                      : "Manage or cancel it below."}
                  </p>
                </>
              ) : (
                <>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="tabular font-mono text-5xl text-violet-ink sm:text-6xl">
                      {price}
                    </span>
                    <span className="text-sm text-mut">{priceUnit}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-mut">{priceNote}</p>
                </>
              )}
              <span className="mt-3 inline-flex w-fit items-center rounded border border-violet/50 px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.14em] text-violet-ink">
                {pro.active ? "Pro unlocked" : "Early Access price"}
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
                    <div className="flex w-full items-center justify-center gap-2 rounded-full bg-violet px-5 py-2.5 font-mono text-sm font-semibold text-[#241a05]">
                      {pro.status === "trialing"
                        ? "✓ Active: free pass"
                        : `✓ Active: ${
                            pro.plan === "lifetime"
                              ? "lifetime"
                              : pro.plan === "annual"
                                ? "annual"
                                : "monthly"
                          }`}
                    </div>
                    {pro.status === "trialing" && periodEnd && (
                      <p className="text-center text-xs text-dim">
                        Runs through {periodEnd}, then ends on its own.
                      </p>
                    )}
                    {subscriptionPlan && (
                      <>
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
                      </>
                    )}
                    {pro.proKey && !justUpgraded && (
                      <ProKeyRow proKey={pro.proKey} />
                    )}
                  </div>
                ) : (
                  <>
                    <Button
                      variant="violet"
                      size="md"
                      className="w-full"
                      onClick={goPro}
                      disabled={checkout.kind === "working"}
                    >
                      {checkout.kind === "working"
                        ? "Opening Stripe…"
                        : lifetimePurchase
                          ? `Get lifetime Pro: ${price} once`
                          : `Go Pro: ${price}/month`}
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
            Monthly price stays while subscription is active · Lifetime never
            renews · Keep everything you earned
          </p>

          {!pro.active && (
            <div className="mx-auto mt-6 grid max-w-4xl gap-3">
              <RedeemPanel />
              <RestorePanel />
            </div>
          )}
        </div>
      </section>

      {/* 3b — What the money buys, itemised. Directly under the buy card so a
              monthly subscriber and a lifetime buyer can both answer "what do
              I actually get today?" before leaving for Checkout. */}
      <UnlockStack />

      {/* 4 — Free vs Pro table */}
      <section className="border-t border-line">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <SectionLabel className="mb-4">Side by side</SectionLabel>
          <h2 className="max-w-2xl text-2xl sm:text-3xl">Exactly where free ends</h2>
          <p className="mt-3 max-w-2xl text-mut">
            No asterisks. If a row says free, it costs nothing.
          </p>
          {/*
            * Below sm this renders as stacked rows, not a scrolling table.
            *
            * The table is `min-w-[560px]` inside a `no-scrollbar` scroller, so
            * on a 375px phone about 217px sat off-screen — the whole Pro
            * column and part of Free — with the scrollbar suppressed, no fade,
            * and no swipe cue. The heading directly above it says "Exactly
            * where free ends" and "No asterisks", while the reader could not
            * see the column that answers it. A three-column comparison is also
            * the worst possible thing to ask someone to scroll horizontally:
            * the label scrolls away with the values.
            */}
          <dl className="mt-8 space-y-3 sm:hidden">
            {PLAN_ROWS.map((row) => (
              <div
                key={row.label}
                className="overflow-hidden rounded-xl border border-line bg-panel"
              >
                <dt className="border-b border-line px-4 py-2.5 text-sm text-ink">
                  {row.label}
                </dt>
                <dd className="flex items-baseline gap-3 px-4 py-2.5 text-sm">
                  <span className="w-10 shrink-0 font-mono text-label uppercase tracking-[0.1em] text-dim">
                    Free
                  </span>
                  <span className="text-mut">{row.free}</span>
                </dd>
                <dd className="flex items-baseline gap-3 bg-panel2/60 px-4 py-2.5 text-sm">
                  <span className="w-10 shrink-0 font-mono text-label uppercase tracking-[0.1em] text-violet-ink">
                    Pro
                  </span>
                  <span className="text-violet-ink">{row.pro}</span>
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 hidden w-full min-w-0 [contain:layout] sm:block">
            <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-line bg-panel [contain:layout]">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-line">
                    <th scope="col" className="px-4 py-3.5 font-normal">
                      <span className="font-mono text-label uppercase tracking-[0.1em] text-dim">
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
                      className="bg-panel2 px-4 py-3.5 font-mono text-[11px] uppercase tracking-[0.14em] text-violet-ink"
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
                      <td className="bg-panel2/60 px-4 py-3 text-violet-ink">
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
          <div className="max-w-xl">
            <h2 className="text-sm text-ink">Pro is what keeps free free.</h2>
            <p className="mt-1 text-sm text-mut">
              One musician builds this —{" "}
              <a
                href="https://jasoncolapietro.com"
                rel="author"
                className="text-violet-ink hover:underline"
              >
                Jason Colapietro
              </a>{" "}
              (Johnny Suede). Pro pays for it — instead of ads, trackers, or
              selling your data.
            </p>
          </div>
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
          <h2 className="max-w-2xl text-2xl sm:text-3xl">Before you decide</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {PRO_FAQ.map((item) => (
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
            The studio costs nothing. Pro adds the coach.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-mut">
            Either way, your voice never leaves this device — and your practice
            never hits a paywall it didn&apos;t have yesterday.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <LinkButton href="#plans" variant="violet" size="lg">
              {pro.active
                ? subscriptionPlan
                  ? "Manage your plan"
                  : "Your Pro access"
                : "Go Pro"}
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
