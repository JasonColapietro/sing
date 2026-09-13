/**
 * Mastery records and the rule they are judged by.
 *
 * The store used to be a bare array of song ids, which made the mastery gate
 * unfixable after the fact: when mastery gained a tempo floor, every record
 * already on disk had been earned under no floor at all — possibly at quarter
 * speed — and nothing could tell those apart from a clean pass at written tempo.
 * These tests are about the two properties that fixes: a record carries what it
 * was earned under, and the rule is applied when the record is read.
 *
 * Each case re-imports the module so the store's cache and the migration both
 * start cold, and installs its own localStorage so nothing leaks between cases.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const V1 = "suede-sing:mastered:v1";
const V2 = "suede-sing:mastered:v2";

function installStorage(seed: Record<string, string> = {}) {
  const store = new Map(Object.entries(seed));
  const localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  };
  vi.stubGlobal("window", {
    localStorage,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  });
  return store;
}

async function load() {
  vi.resetModules();
  return import("./favorites");
}

const clean = { tempo: 1, transpose: 0, score: 95, melody: "abcd1234" };

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe("recording", () => {
  it("stores what the run was sung at, not just the id", async () => {
    const store = installStorage();
    const { recordMastered, getMasteredRecords, isVerified } = await load();
    recordMastered("deep-river", { tempo: 1.1, transpose: -3, score: 88, melody: "feedface" });

    const [record] = getMasteredRecords();
    expect(record.id).toBe("deep-river");
    expect(record.conditions).toEqual({ tempo: 1.1, transpose: -3, score: 88, melody: "feedface" });
    expect(isVerified(record)).toBe(true);
    expect(Number.isNaN(Date.parse(record.at))).toBe(false);
    // And it is the v2 key that was written, so a rollback cannot read records
    // as ids and conclude the singer has mastered nothing.
    expect(store.has(V2)).toBe(true);
    expect(store.has(V1)).toBe(false);
  });

  it("transposition is recorded and never disqualifies", async () => {
    installStorage();
    const { recordMastered, getMastered } = await load();
    recordMastered("deep-river", { ...clean, transpose: -7 });
    expect(getMastered().has("deep-river")).toBe(true);
  });

  it("a repeat pass does not rewrite a record that already holds", async () => {
    installStorage();
    const { recordMastered, getMasteredRecords } = await load();
    recordMastered("deep-river", clean);
    const first = getMasteredRecords()[0].at;
    recordMastered("deep-river", { ...clean, score: 81 });
    expect(getMasteredRecords()).toHaveLength(1);
    expect(getMasteredRecords()[0].at).toBe(first);
    expect(getMasteredRecords()[0].conditions?.score).toBe(95);
  });
});

describe("re-evaluating the gate on read", () => {
  it("a record that no longer clears the score stops counting", async () => {
    // A record written when the bar was lower. Nothing migrates; the rule is
    // simply applied again when the record is read.
    installStorage({
      [V2]: JSON.stringify([{ id: "deep-river", at: "2026-01-01T00:00:00.000Z", conditions: { ...clean, score: 62 } }]),
    });
    const { getMastered, getMasteredRecords, masteryHolds, isVerified } = await load();
    expect(getMastered().has("deep-river")).toBe(false);
    const [record] = getMasteredRecords();
    // The record is kept, not deleted: it is evidence of a run that happened.
    expect(isVerified(record)).toBe(true);
    expect(masteryHolds(record)).toBe(false);
  });

  it("a quarter-speed pass stops counting, which is the bug this exists for", async () => {
    installStorage({
      [V2]: JSON.stringify([{ id: "deep-river", at: "2026-01-01T00:00:00.000Z", conditions: { ...clean, tempo: 0.25 } }]),
    });
    const { getMastered } = await load();
    expect(getMastered().has("deep-river")).toBe(false);
  });

  it("singing it again at tempo upgrades a record that had stopped counting", async () => {
    installStorage({
      [V2]: JSON.stringify([{ id: "deep-river", at: "2026-01-01T00:00:00.000Z", conditions: { ...clean, tempo: 0.5 } }]),
    });
    const { recordMastered, getMastered, getMasteredRecords } = await load();
    expect(getMastered().has("deep-river")).toBe(false);
    recordMastered("deep-river", clean);
    expect(getMasteredRecords()).toHaveLength(1);
    expect(getMastered().has("deep-river")).toBe(true);
  });
});

describe("migrating v1", () => {
  it("keeps what a returning singer earned, and says it cannot be verified", async () => {
    installStorage({ [V1]: JSON.stringify(["deep-river", "shenandoah"]) });
    const { getMastered, getMasteredRecords, isVerified, masteryHolds } = await load();
    expect([...getMastered()].sort()).toEqual(["deep-river", "shenandoah"]);
    for (const record of getMasteredRecords()) {
      // Honoured, because the app failing to write down the tempo is the app's
      // cost to carry, not the singer's. But never claiming to be checked.
      expect(masteryHolds(record)).toBe(true);
      expect(isVerified(record)).toBe(false);
      expect(record.conditions).toBeNull();
    }
  });

  it("does not rewrite v1, so an older tab still works", async () => {
    const store = installStorage({ [V1]: JSON.stringify(["deep-river"]) });
    const { recordMastered, getMastered } = await load();
    recordMastered("shenandoah", clean);
    expect(JSON.parse(store.get(V1)!)).toEqual(["deep-river"]);
    expect([...getMastered()].sort()).toEqual(["deep-river", "shenandoah"]);
  });

  it("a v2 record wins over the same song in v1", async () => {
    installStorage({
      [V1]: JSON.stringify(["deep-river"]),
      [V2]: JSON.stringify([{ id: "deep-river", at: "2026-01-01T00:00:00.000Z", conditions: { ...clean, tempo: 0.25 } }]),
    });
    const { getMasteredRecords, getMastered } = await load();
    expect(getMasteredRecords()).toHaveLength(1);
    // The verified record is the one that counts, so the legacy id cannot be
    // used to launder a run that today's rule rejects.
    expect(getMastered().has("deep-river")).toBe(false);
  });
});

describe("surviving bad input", () => {
  it("a truncated conditions blob costs the audit, not the unlock", async () => {
    installStorage({
      [V2]: JSON.stringify([{ id: "deep-river", at: "2026-01-01T00:00:00.000Z", conditions: { tempo: 1 } }]),
    });
    const { getMastered, getMasteredRecords, isVerified } = await load();
    expect(getMastered().has("deep-river")).toBe(true);
    expect(isVerified(getMasteredRecords()[0])).toBe(false);
  });

  it("a record with no id is dropped, and junk degrades to empty", async () => {
    installStorage({ [V2]: JSON.stringify([{ at: "2026-01-01T00:00:00.000Z" }, 7, null]) });
    const { getMasteredRecords } = await load();
    expect(getMasteredRecords()).toEqual([]);

    installStorage({ [V2]: "{not json" });
    const second = await load();
    expect(second.getMasteredRecords()).toEqual([]);
  });

  it("server rendering sees nothing rather than throwing", async () => {
    vi.unstubAllGlobals();
    const { getMasteredRecords } = await load();
    expect(getMasteredRecords()).toEqual([]);
  });
});

describe("auditing against the song as it is now", () => {
  it("reports a mastery earned on a melody that has since changed", async () => {
    installStorage({
      [V2]: JSON.stringify([
        { id: "deep-river", at: "2026-01-01T00:00:00.000Z", conditions: { ...clean, melody: "00000000" } },
        { id: "shenandoah", at: "2026-01-01T00:00:00.000Z", conditions: { ...clean, melody: "currentfp" } },
        { id: "legacy-song", at: "", conditions: null },
      ]),
    });
    const { staleMasteries } = await load();
    const songs = [{ id: "deep-river", notes: [] }, { id: "shenandoah", notes: [] }, { id: "legacy-song", notes: [] }];
    const stale = staleMasteries(songs, () => "currentfp");
    // Reported, not revoked — whether a transcription fix should cost a singer
    // their unlock is a product decision, and this is what makes it takeable.
    expect(stale.map((r) => r.id)).toEqual(["deep-river"]);
    // A record with no stored fingerprint cannot be stale; it is unverifiable,
    // which is a different thing and must not be conflated with drift.
    expect(stale.some((r) => r.id === "legacy-song")).toBe(false);
  });

  it("a song no longer in the catalogue is not reported as drifted", async () => {
    installStorage({
      [V2]: JSON.stringify([{ id: "withdrawn", at: "2026-01-01T00:00:00.000Z", conditions: clean }]),
    });
    const { staleMasteries } = await load();
    expect(staleMasteries([], () => "anything")).toEqual([]);
  });
});

describe("the melody fingerprint", () => {
    it("changes with the melody and not with its presentation", async () => {
        const { melodyFingerprint } = await import("./lib");
        const base = {
            id: "x", slug: "x", title: "X", origin: "", publicDomain: "", bpm: 90, beatsPerBar: 4,
            defaultKeyRootMidi: 60, form: "phrase", defaultLoops: 4, genre: "folk", era: "Traditional",
            language: "English", tags: [],
            notes: [
                { midi: 60, startBeat: 0, durBeats: 1, lyric: "Twin", wordEnd: false },
                { midi: 62, startBeat: 1, durBeats: 1, lyric: "kle" },
            ],
        } as never as Parameters<typeof melodyFingerprint>[0];
        const original = melodyFingerprint(base);

        // Fixing a syllable break or a lyric line must not invalidate anyone's
        // mastery: that is presentation, not the melody they sang.
        const relyriced = { ...base, notes: base.notes.map((n) => ({ ...n, lyric: "la", wordEnd: true, line: 1 })) };
        expect(melodyFingerprint(relyriced as never)).toBe(original);

        // A corrected pitch, a moved onset or a changed duration is different
        // content, and a past mastery was earned on the old one.
        for (const mutate of [
            (n: { midi: number }) => ({ ...n, midi: n.midi + 1 }),
            (n: { startBeat: number }) => ({ ...n, startBeat: n.startBeat + 0.5 }),
            (n: { durBeats: number }) => ({ ...n, durBeats: n.durBeats * 2 }),
        ]) {
            const changed = { ...base, notes: base.notes.map(mutate as never) };
            expect(melodyFingerprint(changed as never)).not.toBe(original);
        }

        // A dropped note changes it, including when the remaining notes match a
        // prefix — the note count is part of the canonical form.
        expect(melodyFingerprint({ ...base, notes: [base.notes[0]] } as never)).not.toBe(original);
    });

    it("is stable and distinct across the real songbook", async () => {
        const { melodyFingerprint } = await import("./lib");
        const { ALL_SONGS } = await import("./data");
        const prints = ALL_SONGS.map((song) => melodyFingerprint(song));
        expect(prints.every((print) => /^[0-9a-f]{8}$/.test(print))).toBe(true);
        // Recomputing gives the same answer, which is what a stored fingerprint
        // depends on. Collisions are possible in principle for a 32-bit change
        // detector; the songbook has none, and a collision would cost a missed
        // drift report rather than a wrong mastery.
        expect(ALL_SONGS.map((song) => melodyFingerprint(song))).toEqual(prints);
        expect(new Set(prints).size).toBe(ALL_SONGS.length);
    });
});
