"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  revalidatePro,
  startCheckout,
  useProState,
} from "@/lib/pro";
import {
  formatPrice,
  isPlanOnSale,
  PORTAL_RETURN_PARAM,
  PRICING,
  PRO_FAQ,
  proHeadline,
  SOLD_OUT_PLANS,
  type CheckoutPlan,
} from "@/lib/pro-shared";
import { SITE_URL } from "@/lib/site";
import { SUPPORT_EMAIL } from "@/lib/organization";
import {
  PRO_EXERCISES,
  PRO_PACK_COUNT,
  PRO_PACKS_HREF,
  PRO_PROGRAM_NAMES,
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
  // First because it is what a singer arriving from the free-practice wall
  // came for, and the wall's button promised it.
  "No daily limit on guided practice: warmups, ear training, breath and songs",
  `${TOTAL_WORDS.toLocaleString("en-US")} words across ${TOTAL_CHAPTERS} chapters — both books, in full`,
  "Both PDFs, downloadable and yours to keep",
  `${PRO_EXERCISES} pro warmup exercises in ${PRO_PACK_COUNT} packs`,
  // Week 1 of each is free on /programs (the table below says so); the rest
  // is a Pro benefit the card never named. "In full", like the books above,
  // and kept short: on a phone each extra line pushes the buy button further
  // down. The names go in parentheses because one has a colon of its own.
  `${PRO_PROGRAM_NAMES.length === 2 ? "Both" : "All"} Pro programs in full (${new Intl.ListFormat("en", { type: "conjunction" }).format(PRO_PROGRAM_NAMES)})`,
  "Pitch analysis on every recorded take",
  "Per-note accuracy and your range charted over months",
  "Adaptive coach plan, rebuilt daily",
  "Continuous cloud sync across devices",
];

const FREE_CARD_POINTS = [
  "All ten practice rooms, 5 minutes of guided practice a day",
  "Live pitch feedback + range test, unlimited",
  "Recorder with A/B compare",
  "XP, streaks, achievements",
  "No ads, and no trial that expires",
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

/**
 * Brings the plans section into view. Every message about a purchase or an
 * unlock (confirming, the welcome panel with the Pro key, an error, a
 * cancelled checkout) renders there, while the buttons that lead to those
 * moments sit at the top of the page or several screens further down. The
 * section's top does not move as its contents change, so scrolling before
 * React commits the new message still lands on it.
 */
function revealPlans() {
  requestAnimationFrame(() =>
    document.getElementById("plans")?.scrollIntoView({ block: "start" }),
  );
}

/** Opens the "Already have Pro?" form before a link's own jump reaches it. */
function openRestore() {
  const details = document.getElementById("restore");
  if (details instanceof HTMLDetailsElement) details.open = true;
}

/** How Pro just arrived in this browser, which decides what the welcome says. */
export type Welcome = "purchase" | "restore" | "pass";

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
      {/* The whole key, wrapped, and one tap selects it: when the clipboard
          is blocked this is the only way to copy it, and a truncated key
          cannot be copied by hand. */}
      <code className="mt-1.5 block select-all break-all font-mono text-xs text-mut">
        {proKey}
      </code>
      <p className="mt-1.5 text-xs text-dim">
        Save this now. Pro lives in this browser, and this key unlocks it in
        any other browser, or in this one after its data is cleared. Lost it?
        Email {SUPPORT_EMAIL}.
      </p>
      {/* A mailto link: the singer's own mail app, nothing sent anywhere. */}
      <a
        href={`mailto:?subject=${encodeURIComponent("My Suede Pro key")}&body=${encodeURIComponent(`${proKey}\n\nUnlock at ${SITE_URL}/pro#restore`)}`}
        className="mt-2 inline-block font-mono text-[10px] uppercase tracking-[0.14em] text-violet-ink underline decoration-violet/50 underline-offset-4 hover:decoration-violet"
      >
        Email it to myself
      </a>
    </div>
  );
}

/** Turns a comp code into a 30-day pass. No card, no checkout. */
function RedeemPanel({ onUnlocked }: { onUnlocked: () => void }) {
  const [code, setCode] = useState("");
  const [task, setTask] = useState<Task>({ kind: "idle" });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTask({ kind: "working" });
    try {
      await redeemCode(code);
      setTask({ kind: "idle" });
      // This panel unmounts the moment the pass is stored, taking the form
      // with it. Without a confirmation the singer saw their code vanish and
      // sales copy slide into its place.
      onUnlocked();
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
function RestorePanel({ onUnlocked }: { onUnlocked: () => void }) {
  const [key, setKey] = useState("");
  const [task, setTask] = useState<Task>({ kind: "idle" });
  const panel = useRef<HTMLDetailsElement>(null);

  // "Already have Pro?" on every locked book and Atlas chapter, and the
  // emailed Pro key, all point at /pro#restore. The panel is in the server
  // HTML whenever Pro is inactive, so the browser's own hash scroll finds it,
  // but it would stay closed. Open it and bring it into view, on arrival and
  // on a same-page jump. Set through the DOM rather than a controlled `open`
  // prop, so no state is set in an effect and the singer can still close it.
  useEffect(() => {
    const reveal = () => {
      const details = panel.current;
      if (window.location.hash !== "#restore" || !details) return;
      details.open = true;
      requestAnimationFrame(() => details.scrollIntoView({ block: "start" }));
    };
    reveal();
    window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTask({ kind: "working" });
    try {
      await restorePro(key);
      setTask({ kind: "idle" });
      // Same as a redeemed pass: the form unmounts once Pro is stored, so the
      // confirmation has to come from the page.
      onUnlocked();
    } catch (error) {
      setTask({
        kind: "error",
        message: messageOf(error, "Could not restore Pro just now."),
      });
    }
  };

  return (
    <details
      id="restore"
      ref={panel}
      className="scroll-mt-20 rounded-2xl border border-line bg-panel px-5 py-4"
    >
      {/* "In this browser", as the cap wall's link to here says: Pro unlocks
          per browser (the note below), so a second browser on the same
          device needs the key too. */}
      <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.14em] text-mut">
        Already have Pro? Unlock it in this browser
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
        Pro unlocks per browser. Paste the Pro key
        from the browser where you bought or subscribed. Lost it?
        Email {SUPPORT_EMAIL} and we&apos;ll send a new one.
      </p>
    </details>
  );
}

/**
 * What the plans section says the moment Pro arrives in this browser: after a
 * checkout, a restored Pro key or a redeemed pass. The restore and redeem
 * forms unmount as soon as Pro is stored, so without this a singer saw their
 * input vanish and sales copy take its place.
 */
export function WelcomePanel({
  how,
  proKey,
  periodEnd,
}: {
  how: Welcome;
  proKey: string | null;
  /** The pass's end date, already formatted for reading. */
  periodEnd: string | null;
}) {
  const panel = useRef<HTMLDivElement>(null);
  // The button that unlocked Pro unmounts with its form, which drops keyboard
  // and screen-reader focus to the top of the document. Hand it to the
  // confirmation instead; revealPlans does the scrolling.
  useEffect(() => {
    panel.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div
      ref={panel}
      role="status"
      tabIndex={-1}
      className="animate-fadeup mx-auto mb-10 max-w-2xl rounded-2xl border border-violet bg-panel p-6 text-center outline-none sm:p-8"
    >
      <ProChip className="mx-auto" />
      {how === "restore" ? (
        <>
          {/* Someone who already paid, on a new or cleared browser. The
              "Already have Pro?" links that bring them here sit on locked
              book and Atlas chapters, so the way back to both books comes
              first; nobody is welcomed to something they already own. */}
          <h2 className="mt-3 text-2xl sm:text-3xl">
            Pro is unlocked on this browser
          </h2>
          <p className="mx-auto mt-2 max-w-md text-mut">
            Everything Pro includes is open here now: both books in full, the
            pro warmup packs, and no daily limit on guided practice. Keep your
            Pro key for the next browser.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <LinkButton href="/book" variant="violet" size="md">
              Read The Measured Voice
            </LinkButton>
            <LinkButton href="/atlas" variant="outline" size="md">
              Read The Voice Atlas
            </LinkButton>
          </div>
          {/* The key the singer just pasted, so it can follow the books. */}
          {proKey && <ProKeyRow proKey={proKey} />}
        </>
      ) : (
        <>
          <h2 className="mt-3 text-2xl sm:text-3xl">
            {how === "pass"
              ? "Your 30-day pass is on"
              : "Welcome to the gold channel"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-mut">
            {how === "pass"
              ? `Every Pro feature is open in this browser${periodEnd ? ` until ${periodEnd}` : " for 30 days"}, and the pass ends by itself. `
              : ""}
            Your coach starts listening on your next session. Sing one
            warmup and watch the report build itself.
          </p>
          {/* A new key, and the line telling the buyer to save it, come
              before the next-step buttons. Below them, on a 375x667 phone,
              the save line sat under the tab bar while "Sing your first pro
              warmup" led away from the only credential for the purchase. */}
          {proKey && <ProKeyRow proKey={proKey} />}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <LinkButton href={PRO_PACKS_HREF} variant="violet" size="md">
              Sing your first pro warmup
            </LinkButton>
            <LinkButton href="/progress" variant="outline" size="md">
              See your dashboard
            </LinkButton>
          </div>
        </>
      )}
    </div>
  );
}

export function ProClient() {
  const pro = useProState();
  const [billing, setBilling] = useState<CheckoutPlan>("lifetime");
  const [welcome, setWelcome] = useState<Welcome | null>(null);
  const justUpgraded = welcome !== null;
  const [checkout, setCheckout] = useState<Task>({ kind: "idle" });
  const [portal, setPortal] = useState<Task>({ kind: "idle" });
  const [abandoned, setAbandoned] = useState(false);
  // Between the buy tap and Stripe's page. Kept apart from `checkout`, whose
  // "working" state means a payment is being confirmed: before a card has
  // been entered, nobody should read that a payment is being confirmed.
  const [opening, setOpening] = useState(false);

  // A 30-day pass is a trialing subscription that ends on its own (see
  // app/api/redeem). It is not a plan with renewals or anything to cancel,
  // and its holder is the free singer most ready to keep Pro for life.
  const onPass = pro.active && pro.status === "trialing";
  const lifetimePurchase = billing === "lifetime";
  const subscriptionPlan =
    !onPass && (pro.plan === "monthly" || pro.plan === "annual");
  const showPurchaseOptions = !pro.active || onPass;
  // Someone was charged and confirmation failed. Until that is sorted, the
  // page must not offer them a second $79 button under "your payment went
  // through".
  const paidButUnconfirmed = checkout.kind === "error" && Boolean(checkout.ref);
  const price = formatPrice(PRICING[billing].amount);
  const priceUnit = lifetimePurchase ? "one time" : "per month";
  const priceNote = lifetimePurchase
    ? "One payment. Lifetime Pro. No renewal."
    : `Keep the ${formatPrice(PRICING.monthly.amount)} monthly price while your subscription remains active. Cancel anytime.`;
  const plansBlurb = `Early Access is ${formatPrice(PRICING.lifetime.amount)} once for lifetime access, with no renewal. The ${formatPrice(PRICING.monthly.amount)} monthly plan is sold out; existing monthly subscribers keep their price and can manage or cancel any time.`;
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
    // Back from the Stripe billing portal: a cancellation or a card update
    // just changed the subscription, so re-check now rather than within the
    // usual 12-hour window. useProState re-renders the plan line from it.
    if (params.get(PORTAL_RETURN_PARAM)) {
      window.history.replaceState({}, "", "/pro");
      void revalidatePro({ force: true });
      return;
    }
    const fromUrl = params.get("session_id");
    const outcome = params.get("checkout");
    const sessionId = fromUrl ?? pendingCheckout();
    if (fromUrl || outcome) window.history.replaceState({}, "", "/pro");
    if (!sessionId && !outcome) return;

    // Stripe returns to the top of the page, where the hero's buttons lead
    // away, while every message about the purchase renders in the plans
    // section several screens down: revealPlans at each of those moments.
    if (sessionId) {
      rememberPendingCheckout(sessionId);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the session id only exists in the URL, so confirmation can only start after hydration
      setCheckout({ kind: "working" });
      revealPlans();
      confirmCheckout(sessionId)
        .then((state) => {
          if (state.active) {
            setCheckout({ kind: "idle" });
            setWelcome("purchase");
            revealPlans();
            return;
          }
          // Stripe answered, and the answer wasn't "active". For a card
          // Checkout that came back to the success URL that is definitive (a
          // refund, a dispute, a mismatch or a bogus id), so a reload will not
          // change it; say so, and hand over something support can act on.
          clearPendingCheckout();
          setCheckout({
            kind: "error",
            message:
              `Stripe doesn't show a completed Pro purchase for this checkout, so reloading won't change it. If you were charged, please don't buy again: email ${SUPPORT_EMAIL} with this reference and we'll sort it out.`,
            ref: sessionId,
          });
          revealPlans();
        })
        .catch(() => {
          // Deliberately not the API's message. Whatever Stripe's outage
          // sounded like, the thing this person needs to read is that the
          // charge is safe, the retry is automatic, and support has a handle.
          // The parked id survives this branch, so "reload" really retries.
          setCheckout({
            kind: "error",
            message:
              `Your payment went through, but we couldn't confirm it here. Reload this page and we'll try again. Nothing is lost. If it keeps failing, email ${SUPPORT_EMAIL} with this reference.`,
            ref: sessionId,
          });
          revealPlans();
        });
      return;
    }
    setAbandoned(true);
    revealPlans();
  }, []);

  // Back from Stripe's page via the browser's back button, the page can come
  // out of the back/forward cache with the button still reading "Opening
  // Stripe…" and disabled.
  useEffect(() => {
    const onShow = (event: PageTransitionEvent) => {
      if (event.persisted) setOpening(false);
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  const goPro = useCallback(async () => {
    setOpening(true);
    setCheckout({ kind: "idle" });
    setAbandoned(false);
    try {
      await startCheckout(billing);
    } catch (error) {
      setOpening(false);
      setCheckout({
        kind: "error",
        message: messageOf(error, "Could not start checkout."),
      });
    }
  }, [billing]);

  /**
   * The buy button and what sits under it, for a free singer and for a pass
   * holder alike.
   */
  const buyControls = (label: string) => (
    <>
      {paidButUnconfirmed ? (
        <p
          role="alert"
          className="rounded-lg border border-rec/40 bg-rec/10 px-3 py-2 text-center text-sm text-rec"
        >
          A payment from this browser hasn&apos;t been confirmed yet. If you
          were charged, don&apos;t buy again: follow the note above, or
          email {SUPPORT_EMAIL} with its reference.
        </p>
      ) : (
        <Button
          variant="violet"
          size="md"
          className="w-full"
          onClick={goPro}
          disabled={opening || checkout.kind === "working"}
        >
          {opening
            ? "Opening Stripe…"
            : checkout.kind === "working"
              ? "Confirming payment…"
              : label}
        </Button>
      )}
      {checkout.kind === "error" && !checkout.ref && (
        // A failed checkout start, repeated beside the button: the
        // page-level notice sits above the plans, off-screen on a phone, so
        // a failed tap otherwise looks like nothing happened. Confirmation
        // errors carry a ref and are answered by the alert above instead.
        <p
          role="alert"
          className="mt-3 rounded-lg border border-rec/40 bg-rec/10 px-3 py-2 text-center text-sm text-rec"
        >
          {checkout.message}
        </p>
      )}
      {/* What a buyer should know before paying, not after: Pro unlocks per
          browser, and the key is how it follows them. The buy links (this
          page's hero, the free-practice wall) land here, an owner's too when
          they hit the wall on a second browser, so while Pro is off here the
          note opens the unlock form instead of leaving them a second $79
          button.
          A pass holder has no unlock form on the page, so for them it stays
          plain text. */}
      <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-dim">
        Secure checkout by Stripe
        <span className="mx-1.5 text-line2">·</span>
        {pro.active ? (
          "Your Pro key unlocks other browsers"
        ) : (
          // A plain <a>, not next/link: the hash jump scrolls to the form and
          // RestorePanel's hashchange listener opens it. The click opens it
          // too, for when the address already ends in #restore and no
          // hashchange fires.
          <a
            href="#restore"
            onClick={openRestore}
            className="underline decoration-line2 underline-offset-4 hover:text-ink"
          >
            Your Pro key unlocks other browsers
          </a>
        )}
      </p>
    </>
  );

  // A restored key or a redeemed pass unlocks Pro without leaving the page,
  // and the form that did it unmounts at that moment. Answer it with the same
  // welcome a checkout gets, worded for how Pro arrived.
  const unlockedBy = useCallback((how: Welcome) => {
    setWelcome(how);
    revealPlans();
  }, []);

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
                  range history, and tomorrow&apos;s plan.
                  {/* A pass holder has paid nothing, so is not thanked for paying. */}
                  {onPass
                    ? " Your pass ends on its own; lifetime Pro is below if you want to keep it."
                    : " Thanks for keeping the free studio free."}
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <LinkButton href="/progress" variant="violet" size="lg">
                    Open your coach report
                  </LinkButton>
                  <LinkButton href={PRO_PACKS_HREF} variant="outline" size="lg">
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
                  {onPass
                    ? "30-day pass"
                    : pro.plan === "lifetime"
                      ? "Lifetime access"
                      : pro.plan === "annual"
                        ? "Annual plan"
                        : "Monthly plan"}
                  {onPass && periodEnd && (
                    <>
                      <span className="mx-2 text-line2">·</span>
                      Ends {periodEnd}
                    </>
                  )}
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
                  Keep the free studio.{" "}
                  <br />
                  Add an online vocal coach.
                </h1>
                {/* On a phone the buttons come straight after the headline and
                    the paragraph follows them. In reading order a four-line
                    headline and a nine-line paragraph put the price button
                    under the tab bar on a 375×667 screen. Wider screens
                    keep the paragraph first; nothing in it is focusable, so
                    tab order is the same either way. */}
                <div className="flex flex-col">
                  <p className="order-2 mt-5 max-w-xl text-lg text-mut sm:order-1 sm:mt-4">
                    Suede Pro is the vocal coaching layer on top of Suede Sing:
                    adaptive daily plans, per-note accuracy from the warmups
                    and songs you sing, and pitch analysis on your takes. The
                    pitch meter, range test and recorder stay free with no
                    daily limit. The free plan includes five minutes of guided
                    practice a day, and Pro removes that clock.
                  </p>
                  <div className="order-1 mt-6 flex flex-wrap items-center gap-3 sm:order-2 sm:mt-7">
                    {/* Straight to the buy card, with the price on the button:
                        on a phone the price was otherwise first seen about four
                        screens down. */}
                    <LinkButton href="#buy" variant="violet" size="lg">
                      {`Get lifetime Pro: ${formatPrice(PRICING.lifetime.amount)} once`}
                    </LinkButton>
                    <LinkButton href="/studio" variant="ghost" size="lg">
                      Keep practicing free
                    </LinkButton>
                  </div>
                </div>
                <p className="mt-6 font-mono text-xs uppercase tracking-[0.14em] text-dim">
                  {proHeadline()}
                  <span className="mx-2 text-line2">·</span>Monthly plan sold
                  out<span className="mx-2 text-line2">·</span>Voice stays on
                  device
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
          {/* "Charts", not "keeps": the free record stores the same sessions
              and range tests (progress says "older sessions are stored — Pro
              shows all of them"). What Pro adds is the view across them. */}
          <p className="mt-3 max-w-2xl text-mut">
            Free tells you how today went. Pro charts the months behind it,
            finds the patterns, and plans what to sing tomorrow.
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
          {welcome ? (
            <WelcomePanel how={welcome} proKey={pro.proKey} periodEnd={periodEnd} />
          ) : (
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <SectionLabel className="mb-4">Plans</SectionLabel>
                <h2 className="max-w-2xl text-2xl sm:text-3xl">
                  One tier. Coach, analytics, no daily limit, two books.
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
                    disabled={!isPlanOnSale(plan)}
                    onClick={() => {
                      if (isPlanOnSale(plan)) setBilling(plan);
                    }}
                    className={`rounded-full px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
                      on
                        ? "bg-brand text-white"
                        : isPlanOnSale(plan)
                          ? "text-mut hover:text-ink"
                          : "cursor-not-allowed text-dim line-through decoration-dim/60"
                    }`}
                  >
                    {plan === "monthly"
                      ? `Monthly · ${formatPrice(PRICING.monthly.amount)}/mo`
                      : `Lifetime · ${formatPrice(PRICING.lifetime.amount)} once`}
                  </button>
                );
              })}
              {SOLD_OUT_PLANS.includes("monthly") && (
                <span className="rounded-full border border-line2 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-dim">
                  Monthly: Sold out
                </span>
              )}
            </div>
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
                cards' CTAs still land on the same baseline. First on a phone,
                and the `#buy` target the buy links land on (this page's hero
                and final CTA, the free-practice wall, the first-result
                modal), so the price and its button arrive without scrolling
                past the Free card. */}
            <div
              id="buy"
              className="relative order-first flex scroll-mt-20 flex-col overflow-hidden rounded-2xl border border-violet bg-panel bg-[radial-gradient(460px_200px_at_50%_-10%,color-mix(in_oklab,var(--color-violet)_16%,transparent),transparent_62%)] px-7 py-6 ring-1 ring-violet/30 sm:order-none sm:px-8 sm:py-7"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet via-violet to-violet"
              />
              <span className="mb-3 inline-flex w-fit items-center rounded bg-brand px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
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
                      {onPass
                        ? "Pass"
                        : pro.plan === "lifetime"
                          ? "Lifetime"
                          : pro.plan === "annual"
                            ? "Annual"
                            : "Monthly"}
                    </span>
                    <span className="text-sm text-mut">your plan</span>
                  </div>
                  <p className="mt-1.5 text-sm text-mut">
                    {onPass
                      ? "Free for 30 days, with nothing to cancel. Keep Pro for life below."
                      : pro.plan === "lifetime"
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
                    <div className="flex w-full items-center justify-center gap-2 rounded-full bg-brand px-5 py-2.5 font-mono text-sm font-semibold text-white">
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
                    {onPass && (
                      <div className="mt-2">
                        {buyControls(
                          lifetimePurchase
                            ? `Keep Pro for life: ${price} once`
                            : `Go Pro: ${price}/month`,
                        )}
                      </div>
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
                  buyControls(
                    lifetimePurchase
                      ? `Get lifetime Pro: ${price} once`
                      : `Go Pro: ${price}/month`,
                  )
                )}
              </div>
            </div>
          </div>

          <p className="mx-auto mt-6 max-w-4xl text-center font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            Monthly plan sold out · Existing subscribers keep their price ·
            Lifetime never renews · Keep everything you earned
          </p>

          {!pro.active && (
            <div className="mx-auto mt-6 grid max-w-4xl gap-3">
              <RedeemPanel onUnlocked={() => unlockedBy("pass")} />
              <RestorePanel onUnlocked={() => unlockedBy("restore")} />
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
            <LinkButton
              href={pro.active && !onPass ? "#plans" : "#buy"}
              variant="violet"
              size="lg"
            >
              {onPass
                ? "Keep Pro for life"
                : pro.active
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
