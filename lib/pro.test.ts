import { afterEach, describe, expect, it, vi } from "vitest";
import {
  confirmCheckout,
  isCheckoutSessionId,
  isDefinitiveRejection,
  NETWORK_ERROR_MESSAGE,
  pendingCheckout,
  PLAN_ROWS,
  PRICING,
  PRO_PERKS,
  ProApiError,
  redeemCode,
  rememberPendingCheckout,
  restorePro,
  startCheckout,
} from "./pro";
import { PRICING as SHARED_PRICING } from "./pro-shared";
import { ATLAS_CONTENTS } from "./atlas-data";
import { BOOK_CONTENTS } from "./book-data";
import { PRO_SONGS, SONGS } from "@/components/songs/data";
import { PRO_PACKS } from "@/components/warmups/exercises";
import { FREE_DAILY_MINUTES } from "./practice-limits";

describe("PRICING", () => {
  it("re-exports the shared price rather than keeping a second copy", () => {
    // A local copy here is how the page and the Stripe checkout drift apart:
    // this module is what every client-side upgrade CTA reads.
    expect(PRICING).toBe(SHARED_PRICING);
  });
});

describe("Pro sales copy", () => {
  const claims = [
    ...PRO_PERKS.map((p) => `${p.title} ${p.desc}`),
    ...PLAN_ROWS.map((r) => `${r.label} ${r.free} ${r.pro}`),
  ];

  it("promises no content cadence the catalog cannot keep", () => {
    // Songs and chapters are checked-in arrays. "New songs every week" is a
    // promise only a weekly deploy could keep, and a subscriber falsifies it in
    // ten seconds by opening the library twice.
    const cadence = /\bweekly\b|\bevery week\b|\beach week\b|\bevery month\b|\bdrops\b/i;
    expect(claims.filter((c) => cadence.test(c))).toEqual([]);
  });

  it("never sells the paid catalog by a number smaller than the free one", () => {
    // The original rule was "quote no song count at all", because the Pro
    // songbook was six titles against twenty free ones and any bare number
    // argued against buying. The songbook is now entirely free, which turns the
    // count from a liability into the strongest thing this row can say — so the
    // rule is no longer "say nothing", it is "any number you say must be the
    // whole catalogue, and there must be no Pro-only catalogue to compare it
    // against". If a genuinely Pro song ever lands, this fails and the copy has
    // to be reconsidered rather than quietly inheriting a number that has
    // stopped being true.
    const quoted = claims.flatMap((c) =>
      [...c.matchAll(/\b(\d+)\s+songs\b/gi)].map((m) => Number(m[1])),
    );
    if (PRO_SONGS.length > 0) {
      expect(quoted).toEqual([]);
    } else {
      for (const n of quoted) expect(n).toBe(SONGS.length);
    }
  });

  it("sells the warmup packs as the technique packs that ship", () => {
    // PRO_PACKS is one belt-prep, one head-voice and one mix pack, keyed to no
    // genre and no voice type. "Genre and voice-type routines" sold packs that
    // never existed, on the page a buyer reads before paying.
    expect(claims.filter((c) => /\bgenres?\b|voice-type routines/i.test(c))).toEqual([]);
    const warmups = PRO_PERKS.find((p) => p.id === "warmups")!;
    const exercises = PRO_PACKS.reduce((n, p) => n + p.exercises.length, 0);
    expect(warmups.desc).toContain(`${PRO_PACKS.length} extra sets`);
    expect(warmups.desc).toContain(`${exercises} exercises`);
  });

  it("never sells a song's free score record as a Pro feature", () => {
    // Every singer's song summary shows their personal best and a sparkline of
    // past scores, and library cards show the best score. Pro's addition is
    // the song notes in the per-note accuracy chart, not the score history.
    const songHistory = /scoring history|song history|month one against month six/i;
    expect(claims.filter((c) => songHistory.test(c))).toEqual([]);
  });

  it("sells the per-note chart as one tally, not a trend over time", () => {
    // 'Accuracy by note' adds up every kept session, one bar per note with no
    // time axis (components/progress/pro-charts.tsx), and the score trend by
    // week is on everyone's /progress. A per-note "trend" is a view Pro does
    // not draw.
    const perNoteTrend = /per-note[^.]*\b(trends?|over time)\b/i;
    expect(claims.filter((c) => perNoteTrend.test(c))).toEqual([]);
    const analytics = PLAN_ROWS.find((r) => r.label === "Vocal analytics")!;
    expect(analytics.free).toMatch(/trend/);
  });

  it("names every record that a sync leaves in the browser", () => {
    // The ear and breath paths' stars come from their own browser keys
    // (components/ear/lib.ts, components/breath/store.ts), which neither the
    // backup file nor Pro sync carries, so a second device shows them unplayed.
    const sync = PRO_PERKS.find((p) => p.id === "history")!;
    expect(sync.desc).toContain(
      "Song mastery, ear-training and breath path stars, and your place in a program stay in the browser where you earned them.",
    );
  });

  it("says songs share the free daily minutes when it calls them free", () => {
    // Songs are guided practice, so on the free plan they run on the daily
    // allowance. "All 26 songs are free" with no cap beside it read as
    // unlimited, and left out the one thing Pro changes about them.
    const songs = PRO_PERKS.find((p) => p.id === "songs")!;
    expect(songs.desc).toContain(`${FREE_DAILY_MINUTES} free minutes a day`);
    expect(`${songs.title} ${songs.desc}`).toMatch(/no daily limit|lifts that limit/i);
  });

  it("describes each book's free tier by its actual free-chapter count", () => {
    // The `free` flags on the checked-in chapter arrays are the source of
    // truth; this copy is the only place the counts are restated by hand.
    // "first N" is only honest when the free chapters really are the opening
    // run. The Measured Voice now samples chapters 1, 8 and 12 — the two that
    // teach a reader to take an honest measurement and to spot a bad one — so
    // calling that "the first 3 chapters" would send a buyer looking for
    // chapters 2 and 3 and find them locked.
    const describe_ = (entries: Array<{ free: boolean; order: number }>) => {
      const free = entries.filter((c) => c.free).map((c) => c.order).sort((a, b) => a - b);
      const contiguousFromOne = free.every((order, i) => order === i + 1);
      if (free.length === 1) return "Contents + first chapter";
      return contiguousFromOne
        ? `Contents + first ${free.length} chapters`
        : `Contents + ${free.length} chapters`;
    };
    const expected: Record<string, string> = {
      "The Measured Voice (book)": describe_(BOOK_CONTENTS),
      "The Voice Atlas (book)": describe_(ATLAS_CONTENTS),
    };
    for (const [label, free] of Object.entries(expected)) {
      const row = PLAN_ROWS.find((r) => r.label === label);
      expect(row, `missing PLAN_ROWS entry: ${label}`).toBeDefined();
      expect(row?.free).toBe(free);
    }
  });
});

describe("a dropped connection on the buy, unlock and pass paths", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("says so in plain words instead of the browser's 'Failed to fetch'", async () => {
    vi.stubGlobal("fetch", () => Promise.reject(new TypeError("Failed to fetch")));
    await expect(startCheckout("lifetime")).rejects.toThrow(NETWORK_ERROR_MESSAGE);
    await expect(restorePro("key")).rejects.toThrow(NETWORK_ERROR_MESSAGE);
    await expect(redeemCode("code")).rejects.toThrow(NETWORK_ERROR_MESSAGE);
    expect(NETWORK_ERROR_MESSAGE).not.toMatch(/fetch|load failed/i);
  });

  it("still passes the server's own error through when the request lands", async () => {
    vi.stubGlobal("fetch", () =>
      Promise.resolve(new Response(JSON.stringify({ error: "That code has expired." }), { status: 400 })),
    );
    await expect(redeemCode("code")).rejects.toThrow("That code has expired.");
  });
});

describe("the checkout session id parked between Stripe and Pro", () => {
  const PENDING = "suede-sing:pro:pending-checkout";

  function stubStorage(initial: Record<string, string> = {}, blocked = false) {
    const stored = new Map(Object.entries(initial));
    const deny = () => {
      throw new DOMException("The operation is insecure.", "SecurityError");
    };
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => (blocked ? deny() : (stored.get(key) ?? null)),
        setItem: (key: string, value: string) => (blocked ? deny() : void stored.set(key, value)),
        removeItem: (key: string) => (blocked ? deny() : void stored.delete(key)),
      },
    });
    return stored;
  }

  function answer(status: number, body: Record<string, unknown>) {
    return () => Promise.resolve(new Response(JSON.stringify(body), { status }));
  }

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("takes only what /api/entitlement accepts as a Checkout Session id", () => {
    expect(isCheckoutSessionId("cs_test_a1B2c3")).toBe(true);
    expect(isCheckoutSessionId("cs_live_" + "a".repeat(200))).toBe(true);
    for (const bad of ["bogus123", "", "sub_123", "pi_123", "cs_test_a1-b2", "cs_" + "a".repeat(253), null, undefined, 42]) {
      expect(isCheckoutSessionId(bad), String(bad)).toBe(false);
    }
  });

  it("drops a parked value that is not a session id instead of confirming it on every visit", () => {
    const stored = stubStorage({ [PENDING]: "bogus123" });
    expect(pendingCheckout()).toBeNull();
    expect(stored.has(PENDING)).toBe(false);
    stubStorage({ [PENDING]: "cs_test_parked" });
    expect(pendingCheckout()).toBe("cs_test_parked");
  });

  it("says whether the id was parked, so /pro knows when the address is the only copy", () => {
    const stored = stubStorage();
    expect(rememberPendingCheckout("cs_test_ok")).toBe(true);
    expect(stored.get(PENDING)).toBe("cs_test_ok");
    stubStorage({}, true);
    expect(rememberPendingCheckout("cs_test_blocked")).toBe(false);
    expect(pendingCheckout()).toBeNull();
  });

  it("stops at a refusal a retry cannot change, and unparks the id", async () => {
    const stored = stubStorage({ [PENDING]: "cs_test_refused" });
    const fetch = vi.fn(
      answer(400, { error: "Provide a checkout session id, subscription id, or payment intent id." }),
    );
    vi.stubGlobal("fetch", fetch);
    const error = await confirmCheckout("cs_test_refused").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ProApiError);
    expect((error as ProApiError).status).toBe(400);
    expect(isDefinitiveRejection(error)).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(stored.has(PENDING)).toBe(false);
  });

  // A 403 is what a firewall's challenge in front of the API looks like: it
  // says nothing about the id, and a paid buyer's id must survive it.
  it.each([403, 429, 502])("retries a %i and keeps the id parked for the next visit", async (status) => {
    vi.useFakeTimers();
    const stored = stubStorage({ [PENDING]: "cs_test_busy" });
    const fetch = vi.fn(answer(status, { error: "Try again in a moment." }));
    vi.stubGlobal("fetch", fetch);
    const settled = confirmCheckout("cs_test_busy").catch((e: unknown) => e);
    await vi.runAllTimersAsync();
    const error = await settled;
    expect(isDefinitiveRejection(error)).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(stored.get(PENDING)).toBe("cs_test_busy");
  });

  it("never reads a dropped connection, or an error from in front of the API, as a refusal", () => {
    expect(isDefinitiveRejection(new Error(NETWORK_ERROR_MESSAGE))).toBe(false);
    expect(isDefinitiveRejection(new Error("Provide a checkout session id"))).toBe(false);
    for (const status of [401, 403, 404, 405, 408, 413, 429, 500, 502, 503]) {
      expect(isDefinitiveRejection(new ProApiError("not about the id", status)), String(status)).toBe(false);
    }
    expect(isDefinitiveRejection(new ProApiError("Expected a JSON body.", 400))).toBe(true);
  });
});
