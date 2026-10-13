import { describe, expect, it } from "vitest";
import {
  FREE_WEEKS,
  PROGRAMS,
  addDays,
  cappedDaySeconds,
  chapterStartIndex,
  countsFromDay,
  dayMinutes,
  dayNeedsPro,
  drillPreset,
  EAR_PITCH_GAME,
  EAR_RECOGNITION_GAMES,
  EAR_ROUTINE_ID,
  EAR_ROUTINE_NAME,
  EAR_SEC,
  freePlanCalendarDays,
  isRestDay,
  itemDoneOn,
  itemStepHref,
  itemSteps,
  itemsDoneOn,
  matchDay,
  nextRangeTestDay,
  itemEvidence,
  itemHref,
  itemIsPro,
  itemLabel,
  itemSeconds,
  markDayDone,
  programById,
  programMinutesRange,
  programReadings,
  programToday,
  reconcileProgress,
  repeatChoices,
  repeatFortnight,
  repeatFrom,
  reviveProgress,
  sessionsForRun,
  startProgram,
  sustainAttemptSessions,
  withReadings,
  type Program,
  type ProgramDay,
  type ProgramItem,
} from "./programs";
import { routineById, isFreeExercise, stepExercise } from "@/components/warmups/routines";
import { ALL_EXERCISES, computeRootLadder, descentWalk, ladderWalk, tooWideForRange } from "@/components/warmups/exercises";
import {
  breathRoutineById,
  drillPresetFromQuery,
  isBreathDrillId,
  type BreathStep,
} from "@/components/breath/routines";
import { GAME_NAMES } from "@/components/ear/lib";
import { earRoutineById, earRoutineSeconds } from "@/components/ear/routines";
import { SONGS } from "@/components/songs/data";
import { BAND_ORDER, bandForSong } from "@/components/songs/lib";
import type { SessionLog } from "./progress-shape";
import { buildContract } from "@/contracts/suede-vocal";
import { BOOK_CONTENTS } from "./book-data";
import { FREE_DAILY_SEC } from "./free-cap";

const allItems = (p: Program) => p.days.flatMap((d) => d.items);

let n = 0;
function session(day: string, type: SessionLog["type"], detail?: string, time = "12:00:00"): SessionLog {
  n += 1;
  return { id: `s${n}`, type, date: `${day}T${time}.000Z`, day, durationSec: 60, detail, xp: 1 };
}

/** Every item's evidence, one session each, logged at `time` UTC on `day`. */
function sessionsForDay(d: ProgramDay, day: string, time = "12:00:00"): SessionLog[] {
  return d.items.flatMap((item) => itemEvidence(item).map((e) => session(day, e.type, e.details?.[0], time)));
}

/** The sessions that would make every item of a program day done on `day`. */
function sessionsFor(d: ProgramDay, day: string): SessionLog[] {
  return d.items.flatMap((item) =>
    itemEvidence(item).map((e) => session(day, e.type, e.details?.[0])),
  );
}

describe("program data", () => {
  it("has unique ids and four to six programs", () => {
    expect(PROGRAMS.length).toBeGreaterThanOrEqual(4);
    expect(PROGRAMS.length).toBeLessThanOrEqual(6);
    expect(new Set(PROGRAMS.map((p) => p.id)).size).toBe(PROGRAMS.length);
    for (const p of PROGRAMS) expect(programById(p.id)).toBe(p);
    expect(programById("nope")).toBeNull();
  });

  it("spans days to weeks, and each program's weeks match its calendar", () => {
    for (const p of PROGRAMS) {
      expect(p.days.length, p.id).toBe(p.weeks * 7);
    }
    const lengths = PROGRAMS.map((p) => p.weeks);
    expect(Math.min(...lengths)).toBe(1);
    expect(Math.max(...lengths)).toBeGreaterThanOrEqual(6);
    // The book's plan is the longest: twelve weeks.
    expect(Math.max(...lengths)).toBe(12);
  });

  it("resolves every id it names", () => {
    for (const p of PROGRAMS) {
      for (const item of allItems(p)) {
        switch (item.kind) {
          case "routine":
            expect(routineById(item.id), `${p.id}: routine ${item.id}`).not.toBeNull();
            break;
          case "exercise":
            expect(ALL_EXERCISES.some((e) => e.id === item.id), `${p.id}: exercise ${item.id}`).toBe(true);
            expect(item.reps).toBeGreaterThan(0);
            break;
          case "breath":
            expect(breathRoutineById(item.id), `${p.id}: breath ${item.id}`).not.toBeNull();
            break;
          case "drill":
            expect(isBreathDrillId(item.id)).toBe(true);
            // A day's own setting is for the drill it names.
            expect(drillPreset(item).drill, `${p.id}: drill ${item.id}`).toBe(item.id);
            break;
          case "song":
            expect(SONGS.some((s) => s.slug === item.slug), `${p.id}: song ${item.slug}`).toBe(true);
            break;
        }
        // Every item has something in the log that can mark it done.
        expect(itemEvidence(item).length, JSON.stringify(item)).toBeGreaterThan(0);
        expect(itemLabel(item).title).not.toBe("");
      }
    }
  });

  it("names the focus routines the S9b slice added", () => {
    const named = new Set(PROGRAMS.flatMap((p) => allItems(p).flatMap((i) => (i.kind === "routine" ? [i.id] : []))));
    for (const id of ["vibrato", "recovery", "high-notes", "mix"]) expect(named.has(id), id).toBe(true);
  });

  it("keeps each practice day at about 10 to 20 minutes, except a Pro program's free week", () => {
    for (const p of PROGRAMS) {
      p.days.forEach((d, i) => {
        if (isRestDay(d)) {
          expect(dayMinutes(d)).toBe(0);
          return;
        }
        // A Pro program's free week is sized to the free plan's five guided
        // minutes instead; the next test holds it to that.
        if (p.pro && !dayNeedsPro(p, i)) return;
        const m = dayMinutes(d);
        expect(m, `${p.id} day ${i + 1} "${d.title}"`).toBeGreaterThanOrEqual(10);
        expect(m, `${p.id} day ${i + 1} "${d.title}"`).toBeLessThanOrEqual(20);
      });
      const { min, max } = programMinutesRange(p);
      expect(min).toBeLessThanOrEqual(max);
    }
  });

  it("has a rest day in every week of the longer programs and none on day 1", () => {
    for (const p of PROGRAMS) {
      expect(isRestDay(p.days[0])).toBe(false);
      if (p.weeks < 2) continue;
      for (let w = 0; w < p.weeks; w++) {
        expect(p.days.slice(w * 7, w * 7 + 7).some(isRestDay), `${p.id} week ${w + 1}`).toBe(true);
      }
    }
  });

  it("opens week 1 of a Pro program to everyone: free content only, inside the free cap", () => {
    for (const p of PROGRAMS.filter((p) => p.pro)) {
      for (let i = 0; i < FREE_WEEKS * 7; i++) {
        const d = p.days[i];
        expect(dayNeedsPro(p, i), `${p.id} day ${i + 1}`).toBe(false);
        for (const item of d.items) expect(itemIsPro(item), `${p.id} day ${i + 1}: ${JSON.stringify(item)}`).toBe(false);
        expect(cappedDaySeconds(d), `${p.id} day ${i + 1}`).toBeLessThanOrEqual(FREE_DAILY_SEC);
        if (!isRestDay(d)) expect(cappedDaySeconds(d), `${p.id} day ${i + 1}`).toBeGreaterThanOrEqual(90);
      }
      expect(dayNeedsPro(p, FREE_WEEKS * 7)).toBe(true);
      expect(p.days.slice(FREE_WEEKS * 7).flatMap((d) => d.items).some(itemIsPro), p.id).toBe(true);
    }
    for (const p of PROGRAMS.filter((p) => !p.pro)) {
      p.days.forEach((_, i) => expect(dayNeedsPro(p, i)).toBe(false));
    }
  });

  it("counts only warmups, breath, ear and songs against the free cap", () => {
    const d: ProgramDay = { title: "", items: [{ kind: "range" }, { kind: "recorder" }] };
    expect(cappedDaySeconds(d)).toBe(0);
    const w: ProgramDay = { title: "", items: [{ kind: "drill", id: "sustain" }, { kind: "range" }] };
    expect(cappedDaySeconds(w)).toBeGreaterThan(0);
    expect(cappedDaySeconds(w)).toBeLessThan(dayMinutes(w) * 60);
  });

  it("follows the book: its chapters, and the range tests and recorded takes where the book puts them", () => {
    const p = programById("measured-voice-12w")!;
    expect(p.weeks).toBe(12);
    expect(p.pro).toBe(true);
    const chapters = p.chapters!;
    expect(chapters.map((c) => c.slug)).toEqual([
      "weeks-1-2-baseline",
      "weeks-3-4-middle",
      "weeks-5-6-passaggio",
      "weeks-7-8-top",
      "weeks-9-10-bottom",
      "weeks-11-12-songs",
    ]);
    for (const c of chapters) {
      const book = BOOK_CONTENTS.find((b) => b.slug === c.slug);
      expect(book?.title, c.slug).toBe(c.title);
    }
    // Chapter 13's rules and before-week-1 record (chapter 19 reads its
    // sentence back), and chapter 10's transition, which weeks 5 to 8 work
    // on and test against: both read before the week that needs them.
    expect(p.readFirst?.map((r) => [r.before, r.slug])).toEqual([
      ["day 1", "how-the-program-works"],
      ["week 5", "finding-your-break"],
    ]);
    for (const r of p.readFirst!) {
      const book = BOOK_CONTENTS.find((b) => b.slug === r.slug);
      expect(book?.title, r.slug).toBe(r.title);
    }
    // Every week has exactly one chapter.
    for (let w = 1; w <= p.weeks; w++) {
      expect(chapters.filter((c) => w >= c.fromWeek && w <= c.toWeek), `week ${w}`).toHaveLength(1);
    }
    const on = (kind: ProgramItem["kind"]) =>
      p.days.flatMap((d, i) => (d.items.some((x) => x.kind === kind) ? [i + 1] : []));
    // Week 1, the end of week 6, the start of week 12.
    expect(on("range")).toEqual([1, 42, 78]);
    // Day 1's baseline, five onsets in weeks 3 and 4 (ch. 15, "run the
    // recorder and listen back"), a siren in weeks 5 and 6 (ch. 16, "twice
    // across the two weeks"), one top-note take in each of weeks 7 and 8
    // (ch. 17, "one take a week"), two phrases of the song in each session
    // of weeks 9 and 10 that sings it (ch. 18, "record every attempt"), the
    // week-11 working copy (ch. 19), and week 12's take.
    expect(on("recorder")).toEqual([1, 18, 25, 30, 37, 43, 50, 57, 60, 64, 67, 71, 78]);
    // Three or four sessions a week, and five only where a check-in is added.
    for (let w = 0; w < p.weeks; w++) {
      const sessions = p.days.slice(w * 7, w * 7 + 7).filter((d) => !isRestDay(d)).length;
      expect(sessions, `week ${w + 1}`).toBeGreaterThanOrEqual(3);
      expect(sessions, `week ${w + 1}`).toBeLessThanOrEqual(5);
    }
    expect(isRestDay(p.days.at(-1)!)).toBe(false);
  });

  it("names the take each weeks 3-10 recording is for, as chapters 15 to 18 describe it", () => {
    const p = programById("measured-voice-12w")!;
    const takes = (day: number) =>
      p.days[day - 1].items.filter((i) => i.kind === "recorder").map((i) => itemLabel(i).meta);
    // Chapter 15: "One note in your middle, sung five times: short, clean, a
    // full stop and a fresh breath between each. Then run the recorder and
    // listen back." After the held note, so the onsets are sung warm.
    for (const d of [18, 25]) {
      expect(takes(d), `day ${d}`).toEqual([expect.stringMatching(/^Recorder · one middle note, five short clean onsets/)]);
      const items = p.days[d - 1].items;
      const rec = items.findIndex((i) => i.kind === "recorder");
      expect(items.slice(0, rec).some((i) => i.kind === "exercise" && i.id === "sustained-hold"), `day ${d}`).toBe(true);
    }
    // Chapter 16: "record a single siren"; chapter 17: "a short ascending
    // pattern through the transition to a comfortable top note".
    for (const d of [30, 37]) expect(takes(d), `day ${d}`).toEqual([expect.stringMatching(/^Recorder · one slow ng siren/)]);
    for (const d of [43, 50]) expect(takes(d), `day ${d}`).toEqual([expect.stringMatching(/^Recorder · a short ascending pattern through your transition to a comfortable top note/)]);
    // Chapter 18: "Choose two phrases: the longest one, and one that dips
    // low … record every attempt", then "A/B the take in the recorder against
    // one from earlier in the week". After the song, so the phrases are sung
    // warm and known; the week's second session has the first's take to A/B.
    for (const d of [57, 60, 64, 67]) {
      expect(takes(d), `day ${d}`).toEqual([expect.stringMatching(/^Recorder · the longest phrase of your song and one that dips low/)]);
      const items = p.days[d - 1].items;
      const rec = items.findIndex((i) => i.kind === "recorder");
      expect(items[rec - 1].kind, `day ${d}`).toBe("song");
      expect(items.at(-1), `day ${d}`).toEqual({ kind: "routine", id: "cooldown" });
    }
    for (const d of [57, 64]) expect(takes(d)[0], `day ${d}`).toMatch(/then listen back · about \d+ min$/);
    for (const d of [60, 67]) expect(takes(d)[0], `day ${d}`).toMatch(/then A\/B it with this week's first take · about \d+ min$/);
    // Day 1's take is the one week 12 is compared against, and the browser
    // can clear its recordings: the row asks for a downloaded copy.
    expect(takes(1)).toEqual([expect.stringMatching(/^Recorder · a verse and a chorus of a song you know, then download a copy to keep · about \d+ min$/)]);
    // Week 12 opens on the other half: the same song, compared with day 1's.
    const week12 = p.days.findIndex((d) => d.title === "Where you are now") + 1;
    expect(week12).toBe(78);
    expect(takes(week12)).toEqual([expect.stringMatching(/^Recorder · the same verse and chorus as day 1, then compare it with that take · about \d+ min$/)]);
    // A take that names nothing is still a verse and a chorus.
    expect(itemLabel({ kind: "recorder" }).meta).toMatch(/^Recorder · a verse and a chorus · about \d+ min$/);
    expect(p.measures).toMatch(/chapters 16 and 17/);
    expect(p.measures).toMatch(/weeks 9 and 10 are for the listening back and A\/B chapter 18 asks for/);
  });

  it("works one song in the last four weeks and runs one sustain test a week, as chapters 18 and 19 ask", () => {
    const p = programById("measured-voice-12w")!;
    const weekDays = (w: number) => p.days.slice((w - 1) * 7, w * 7);
    // Sustain attempts an item asks for: a lone drill is one, and a breath
    // set runs every attempt its sustain steps name.
    const sustainAttempts = (i: ProgramItem): number => {
      if (i.kind === "drill") return i.id === "sustain" ? 1 : 0;
      if (i.kind !== "breath") return 0;
      return breathRoutineById(i.id)!.steps.reduce((n, s) => n + (s.drill === "sustain" ? s.attempts : 0), 0);
    };
    // Weeks 9 and 10: "Run one sustain test a week", and phrase work in a song.
    // The breath sets each end on sustains, so they count too.
    for (const w of [9, 10]) {
      const items = weekDays(w).flatMap((d) => d.items);
      expect(items.reduce((n, i) => n + sustainAttempts(i), 0), `week ${w}`).toBe(1);
      expect(items.some((i) => i.kind === "song"), `week ${w}`).toBe(true);
    }
    // Weeks 11 and 12: "One song. Not three, not a set." The same one weeks 9
    // and 10 phrased.
    const songs = (from: number, to: number) =>
      new Set(
        p.days
          .slice((from - 1) * 7, to * 7)
          .flatMap((d) => d.items.flatMap((i) => (i.kind === "song" ? [i.slug] : []))),
      );
    expect([...songs(11, 12)]).toHaveLength(1);
    expect(songs(9, 12)).toEqual(songs(11, 12));
    expect(p.days.some((d) => d.items.filter((i) => i.kind === "song").length > 1)).toBe(false);
  });

  it("trains the ear every session of weeks 3 and 4, as chapter 15 asks", () => {
    // "Three or four minutes a session, every session."
    const p = programById("measured-voice-12w")!;
    const days = p.days.slice(14, 28).filter((d) => !isRestDay(d));
    expect(days.length).toBeGreaterThan(0);
    for (const d of days) {
      const ear = d.items.filter((i) => i.kind === "ear");
      expect(ear, d.title).toHaveLength(1);
      // After the warmup, never on a cold voice.
      const at = d.items.findIndex((i) => i.kind === "ear");
      expect(d.items.slice(0, at).some((i) => i.kind === "routine"), d.title).toBe(true);
    }
    const ear: ProgramItem = { kind: "ear" };
    expect(itemIsPro(ear)).toBe(false);
    expect(itemLabel(ear).title).toBe("Quick ear");
    expect(itemLabel(ear).meta).toBe("Ear · Higher or lower, Interval ID and pitch match · about 4 min");
    expect(cappedDaySeconds({ title: "", items: [ear] })).toBe(EAR_SEC);
    // The link starts a real workout, and the row's name and length are that
    // workout's: pitch match plus a recognition game, as the item promises.
    const routine = earRoutineById(EAR_ROUTINE_ID)!;
    expect(routine.name).toBe(EAR_ROUTINE_NAME);
    expect(earRoutineSeconds(routine)).toBe(EAR_SEC);
    const games = routine.steps.map((st) => GAME_NAMES[st.game]);
    expect(games).toContain(EAR_PITCH_GAME);
    expect(games.some((g) => EAR_RECOGNITION_GAMES.includes(g))).toBe(true);
    // Chapter 15's "three or four minutes a session".
    expect(EAR_SEC).toBeGreaterThanOrEqual(180);
    expect(EAR_SEC).toBeLessThanOrEqual(240 + 4 * routine.steps.length);
  });

  it("runs weeks 9 and 10's breath at longer counts than weeks 1 and 2, for four or five minutes, as chapter 18 asks", () => {
    // "four or five minutes: the breath drills chapter fourteen describes, run
    // with the exhale counts a beat or two longer than you used in weeks 1 and 2."
    const p = programById("measured-voice-12w")!;
    const breathSteps = (d: ProgramDay): BreathStep[] =>
      d.items.flatMap((i) =>
        i.kind === "drill" ? [drillPreset(i)] : i.kind === "breath" ? breathRoutineById(i.id)!.steps : [],
      );
    const sides = (days: ProgramDay[]) => days.flatMap(breathSteps).flatMap((s) => (s.drill === "box" ? [s.side] : []));
    const caps = (days: ProgramDay[]) => days.flatMap(breathSteps).flatMap((s) => (s.drill === "farinelli" ? [s.cap] : []));
    const early = p.days.slice(0, 14);
    const late = p.days.slice(56, 70).filter((d) => !isRestDay(d));
    expect(late.length).toBe(8);
    // Longer than weeks 1 and 2 ran most days: four-count sides, a climb to eight.
    expect(Math.min(...sides(late))).toBeGreaterThan(Math.min(...sides(early)));
    expect(Math.min(...caps(late))).toBeGreaterThan(Math.min(...caps(early)));
    for (const d of late) {
      // Every session has the square and the climb, at a count past weeks 1-2's.
      expect(sides([d]).length, d.title).toBeGreaterThan(0);
      expect(caps([d]).length, d.title).toBeGreaterThan(0);
      // Four or five minutes of it, the weekly sustain test aside.
      const sec = d.items
        .filter((i) => (i.kind === "drill" && i.id !== "sustain") || i.kind === "breath")
        .reduce((n, i) => n + itemSeconds(i), 0);
      expect(sec / 60, d.title).toBeGreaterThanOrEqual(4);
      expect(sec / 60, d.title).toBeLessThanOrEqual(5);
    }
    // The card says which setting to pick on the drill's setup card.
    const box = late[0].items.find((i) => i.kind === "drill" && i.id === "box")!;
    expect(itemLabel(box).meta).toBe("Breath · 1 min · 5s sides");
    const climb = late[0].items.find((i) => i.kind === "drill" && i.id === "farinelli")!;
    expect(itemLabel(climb).meta).toBe("Breath · Top count 10");
  });

  it("takes the sustain test last among a session's breath drills, once or twice at most, as chapter 14 asks", () => {
    // "The sustain test last, once or twice, not more."
    const p = programById("measured-voice-12w")!;
    p.days.forEach((d, n) => {
      const steps = d.items.flatMap((i): BreathStep[] =>
        i.kind === "drill" ? [drillPreset(i)] : i.kind === "breath" ? breathRoutineById(i.id)!.steps : [],
      );
      const label = `day ${n + 1} "${d.title}"`;
      const attempts = steps.reduce((k, s) => k + (s.drill === "sustain" ? s.attempts : 0), 0);
      expect(attempts, label).toBeLessThanOrEqual(2);
      const first = steps.findIndex((s) => s.drill === "sustain");
      if (first >= 0) expect(steps.slice(first).every((s) => s.drill === "sustain"), label).toBe(true);
    });
  });

  it("takes The Measured Voice's retests the way day 1 took the baseline: nothing sung before the warmup, one sustain after the range test", () => {
    // Chapter 16 retests under "the same ones you used in week 1, or the two
    // results are not comparable"; chapter 13's sustain test is "one number".
    // A check-in's sustain reading is the longest hold of its day, so a second
    // attempt, or one sung cold before the warmup, is a different measurement.
    const p = programById("measured-voice-12w")!;
    const steps = (i: ProgramItem): BreathStep[] =>
      i.kind === "drill" ? [drillPreset(i)] : i.kind === "breath" ? breathRoutineById(i.id)!.steps : [];
    const voiced = (s: BreathStep) => s.drill === "sustain" || s.drill === "cue";
    const checks = p.days.filter((d) => d.items.some((i) => i.kind === "range"));
    expect(checks.map((d) => d.title)).toEqual(["Your baseline", "Halfway check-in", "Where you are now"]);
    for (const d of checks) {
      const at = d.items.findIndex((i) => i.kind === "range");
      expect(d.items.slice(0, at).flatMap(steps).some(voiced), d.title).toBe(false);
      const attempts = d.items.flatMap(steps).reduce((k, s) => k + (s.drill === "sustain" ? s.attempts : 0), 0);
      expect(attempts, d.title).toBe(1);
      expect(d.items.findIndex((i) => i.kind === "drill" && i.id === "sustain"), d.title).toBeGreaterThan(at);
    }
  });

  it("keeps weeks 2 to 6 off both ends of the range and out of the full-range sets, as chapters 14 to 16 ask", () => {
    // "Starting in the middle and only reaching the edges in weeks 7 through
    // 9 is the whole point of the sequence." Chapter 14 stays "in the middle
    // of your range", chapter 15 keeps almost everything inside the middle
    // block, and chapter 16 warms up on "the lightest warmup pack you have,
    // staying entirely below your transition". The Quick and Daily sets run a
    // twelfth from the bottom of the measured range on every rep.
    // The Mix builder pack runs its ng glide at about half a second a whole
    // step and its scales and leaps to two semitones under the measured top,
    // against chapter 16's two seconds a whole step and "slides and sustained
    // patterns rather than agility or staccato".
    const p = programById("measured-voice-12w")!;
    const items = p.days.slice(7, 42).flatMap((d) => d.items);
    for (const id of ["quick", "daily", "full", "range", "agility", "high-notes", "mix"]) {
      expect(items.some((i) => i.kind === "routine" && i.id === id), id).toBe(false);
    }
    // Hoo descent opens on the measured top for a range under 16 semitones: a
    // bounded descending step starts on its top rung, and an octave pattern
    // fitted to a narrow range has no headroom left. Weeks 1 to 6 stay off it.
    expect(
      p.days.slice(0, 42).flatMap((d) => d.items).some((i) => i.kind === "exercise" && i.id === "hoo-four-note"),
    ).toBe(false);
  });

  it("keeps every single exercise in weeks 1 to 6 off both ends of the measured range", () => {
    // Chapter 14: "Stay in the middle of your range … Do not chase the top";
    // chapter 16 aims every exercise at "the four or five semitones either
    // side" of the transition, with the slide "a five-note descending scale
    // that starts above your transition". A program row opens its exercise
    // bounded, so a descending ladder starts on its top rung and a climbing
    // one on its bottom rung. From 16 semitones up, every rep stays at least
    // five semitones under the measured top: under that no ladder has the
    // room. From 8 up (wider than any of these patterns), no rep starts under
    // the measured low. Hoo descent failed the first at 16-24 semitones; the
    // octave Lip-trill arpeggio failed both.
    const p = programById("measured-voice-12w")!;
    for (const d of [29, 32, 36, 39]) expect(p.days[d - 1].title, `day ${d}`).toBe("Slides across the break");
    expect(p.days[1].title).toBe("Box breath, a gentle middle");
    expect(p.days[3].title).toBe("The climb to eight");
    const seen = new Set<string>();
    p.days.slice(0, 42).forEach((day, i) => {
      for (const item of day.items) {
        if (item.kind !== "exercise") continue;
        seen.add(item.id);
        const ex = ALL_EXERCISES.find((e) => e.id === item.id)!;
        const maxOff = Math.max(...ex.buildSteps(0).flat());
        for (let span = 8; span <= 30; span++) {
          const low = 45;
          const high = low + span;
          const fitted = computeRootLadder(ex, low, high);
          const down = ex.ladder === "down";
          const walked = down ? [...fitted].reverse() : fitted;
          for (let rep = 0; rep < item.reps; rep++) {
            const { root } = down ? descentWalk(walked, rep) : ladderWalk(walked, rep);
            const at = `day ${i + 1} ${item.id} span ${span} rep ${rep + 1}`;
            expect(root, at).toBeGreaterThanOrEqual(low);
            if (span >= 16) expect(high - (root + maxOff), at).toBeGreaterThanOrEqual(5);
          }
        }
      }
    });
    // The walk covers the slides, week 1's gentle middle and its lip trill.
    for (const id of ["descending-five", "ng-siren-fifth", "straw-scale", "morning-lip-trill"]) {
      expect(seen.has(id), id).toBe(true);
    }
    expect(seen.has("lip-trill-scale")).toBe(false);
  });

  it("opens weeks 7 and 8 on the middle-voice on-ramp, as chapter 17 asks", () => {
    // "The middle-voice work from the earlier blocks is your on-ramp … five or
    // six minutes of it in the Warmups packs before anything goes above the
    // transition. A cold voice at the top of your range is where the trouble is."
    const p = programById("measured-voice-12w")!;
    const days = p.days.slice(42, 56).filter((d) => !isRestDay(d));
    const items = days.flatMap((d) => d.items);
    for (const id of ["quick", "daily"]) {
      expect(items.some((i) => i.kind === "routine" && i.id === id), id).toBe(false);
    }
    const top = new Set(["high-notes", "head-voice-builder"]);
    for (const d of days) {
      const at = d.items.findIndex((i) => i.kind === "routine" && top.has(i.id));
      if (at < 0) continue;
      // The weeks 3-4 middle work first: the Morning reset and the five-note scale.
      const before = d.items.slice(0, at);
      expect(before.some((i) => i.kind === "routine" && i.id === "morning"), d.title).toBe(true);
      expect(before.some((i) => i.kind === "exercise" && i.id === "five-note-scale"), d.title).toBe(true);
    }
  });

  it("schedules chapter 15's own work in weeks 3 and 4: the five-note pattern and a held note", () => {
    const p = programById("measured-voice-12w")!;
    const items = p.days.slice(14, 28).flatMap((d) => d.items);
    const has = (id: string) => items.some((i) => i.kind === "exercise" && i.id === id);
    expect(has("five-note-scale")).toBe(true);
    expect(has("sustained-hold")).toBe(true);
  });

  it("opens chapter 16's sessions on breath, as it asks: box breathing, then the lightest pack", () => {
    const p = programById("measured-voice-12w")!;
    const sessions = p.days.slice(28, 42).filter((d) => d.title === "Slides across the break");
    expect(sessions).toHaveLength(4);
    for (const d of sessions) {
      expect(d.items[0]).toEqual({ kind: "drill", id: "box" });
      expect(d.items[1]).toEqual({ kind: "routine", id: "morning" });
    }
  });

  it("runs chapter 16's ng sirens at the slowest tempo and says so on the row", () => {
    // "Slow enough that a whole step takes about two seconds"; at 1x the
    // room's glide covers one in about half a second.
    const p = programById("measured-voice-12w")!;
    const sirens = p.days
      .slice(28, 42)
      .flatMap((d) => d.items)
      .filter((i): i is Extract<ProgramItem, { kind: "exercise" }> => i.kind === "exercise" && i.id === "ng-siren-fifth");
    expect(sirens.length).toBeGreaterThan(0);
    for (const item of sirens) {
      expect(item.tempo).toBe(0.5);
      expect(itemLabel(item).meta).toMatch(/· set Adjust to 0\.5×$/);
      expect(itemSeconds(item)).toBeGreaterThan(itemSeconds({ ...item, tempo: undefined }));
    }
  });

  it("counts the calendar days a program takes on the free plan's daily allowance", () => {
    const base: Program = { id: "t", name: "t", tagline: "", measures: "", weeks: 1, pro: false, days: [] };
    const calendarDays = (...days: ProgramDay[]) => freePlanCalendarDays({ ...base, days });
    // A rest day is one calendar day, and so is a day outside the cap.
    expect(calendarDays({ title: "Rest day", items: [] })).toBe(1);
    expect(calendarDays({ title: "Check in", items: [{ kind: "range" }, { kind: "recorder" }] })).toBe(1);
    // The cap is checked where a piece starts, so a piece begun with time left
    // runs to its end: two that together pass the allowance still fit one day,
    // and a third, begun once it is spent, waits for the next.
    const piece: ProgramItem = { kind: "exercise", id: "hoo-four-note", reps: 30 };
    const sec = cappedDaySeconds({ title: "", items: [piece] });
    expect(sec).toBeLessThan(FREE_DAILY_SEC);
    expect(2 * sec).toBeGreaterThanOrEqual(FREE_DAILY_SEC);
    expect(calendarDays({ title: "", items: [piece, piece] })).toBe(1);
    expect(calendarDays({ title: "", items: [piece, piece, piece] })).toBe(2);
    // Days add up, and nothing carries from one program day into the next.
    expect(calendarDays({ title: "", items: [piece] }, { title: "", items: [piece] })).toBe(2);
    // A routine stops between its steps, not only at its end: it takes the
    // same days as its steps sung one by one, and more than one.
    const full: ProgramItem = { kind: "routine", id: "full" };
    expect(calendarDays({ title: "", items: [full] })).toBe(calendarDays({ title: "", items: itemSteps(full) }));
    expect(calendarDays({ title: "", items: [full] })).toBeGreaterThan(1);
    // A Pro program's free week fits the allowance as written.
    for (const p of PROGRAMS.filter((p) => p.pro)) {
      expect(freePlanCalendarDays({ ...p, days: p.days.slice(0, FREE_WEEKS * 7) }), p.id).toBe(FREE_WEEKS * 7);
    }
    // The free programs do not, which /programs says before one is started.
    for (const p of PROGRAMS.filter((p) => !p.pro)) {
      expect(freePlanCalendarDays(p), p.id).toBeGreaterThan(p.days.length);
    }
  });

  it("gates Pro content: a free program starts nothing behind the paywall", () => {
    for (const p of PROGRAMS) {
      const pro = allItems(p).some(itemIsPro);
      if (!p.pro) expect(pro, p.id).toBe(false);
    }
    const mix = programById("mix-4w")!;
    expect(mix.pro).toBe(true);
    expect(allItems(mix).some((i) => i.kind === "routine" && i.id === "mix")).toBe(true);
    // Free exercises named directly must be in the free catalogue.
    for (const p of PROGRAMS.filter((p) => !p.pro)) {
      for (const i of allItems(p)) if (i.kind === "exercise") expect(isFreeExercise(i.id)).toBe(true);
    }
  });

  it("only names songs a new singer can open: free and in the first band", () => {
    for (const p of PROGRAMS) {
      for (const i of allItems(p)) {
        if (i.kind !== "song") continue;
        const s = SONGS.find((x) => x.slug === i.slug)!;
        expect(bandForSong(s), s.slug).toBe(BAND_ORDER[0]);
      }
    }
  });

  it("ends the Mix and Measured Voice days that work the voice on the cool-down", () => {
    // The quiet days, built only from the morning and recovery sets, are a
    // cool-down already; every other paid day ends on the real one.
    const gentle = new Set(["morning", "recovery"]);
    const worksVoice = (d: ProgramDay) =>
      d.items.some(
        (i) => i.kind === "song" || i.kind === "exercise" || (i.kind === "routine" && !gentle.has(i.id)),
      );
    for (const id of ["mix-4w", "measured-voice-12w"]) {
      const p = programById(id)!;
      let ended = 0;
      p.days.forEach((d, i) => {
        const label = `${id} day ${i + 1} "${d.title}"`;
        const last = d.items.at(-1);
        const endsCool = last?.kind === "routine" && last.id === "cooldown";
        // Nothing but the last item may be the cool-down.
        expect(d.items.slice(0, -1).some((x) => x.kind === "routine" && x.id === "cooldown"), label).toBe(false);
        if (isRestDay(d) || !dayNeedsPro(p, i)) {
          // The free week is sized to the free plan's five guided minutes.
          expect(endsCool, label).toBe(false);
          return;
        }
        expect(endsCool, label).toBe(worksVoice(d));
        if (endsCool) {
          ended++;
          expect(dayMinutes(d), label).toBeLessThanOrEqual(20);
        }
      });
      expect(ended, id).toBeGreaterThan(0);
    }
  });

  it("keeps every program's calendar where saved progress expects it", () => {
    // Saved progress is a list of completed day indexes, so the days, and
    // which of them are rest days, stay put.
    const rests = (id: string) => programById(id)!.days.flatMap((d, i) => (isRestDay(d) ? [i] : []));
    expect(programById("mix-4w")!.days).toHaveLength(28);
    // Week 4 closes on the check-in.
    expect(rests("mix-4w")).toEqual([3, 6, 10, 13, 17, 20, 24]);
    expect(programById("measured-voice-12w")!.days).toHaveLength(84);
    expect(rests("measured-voice-12w")).toEqual(
      Array.from({ length: 12 }, (_, w) => [2, 5, 6].map((d) => w * 7 + d))
        .flat()
        // Weeks 6 and 12 close on a session instead of a rest.
        .filter((i) => i !== 41 && i !== 83),
    );
  });

  it("warms up before every range test, and records after it, as chapters 8 and 14 ask", () => {
    const sings = (i: ProgramItem) => i.kind === "routine" || i.kind === "exercise";
    for (const p of PROGRAMS) {
      p.days.forEach((d, n) => {
        const at = d.items.findIndex((i) => i.kind === "range");
        if (at < 0) return;
        const label = `${p.id} day ${n + 1} "${d.title}"`;
        // "Do not skip this to get a 'true' cold reading."
        expect(d.items.slice(0, at).some(sings), label).toBe(true);
        // The take is sung after the test, "without warming up further".
        const rec = d.items.findIndex((i) => i.kind === "recorder");
        if (rec >= 0) expect(rec, label).toBeGreaterThan(at);
      });
    }
    // Readings a program compares are taken after the same warmup, and the
    // same breath work: three minutes of exhale training before one check-in's
    // sustain and none before another's is a different measurement.
    const breathes = (i: ProgramItem) => i.kind === "breath" || i.kind === "drill";
    const warmupBeforeRange = (d: ProgramDay) =>
      JSON.stringify(
        d.items.slice(0, d.items.findIndex((i) => i.kind === "range")).filter((i) => sings(i) || breathes(i)),
      );
    const checks = (id: string) => programById(id)!.days.filter((d) => d.items.some((i) => i.kind === "range"));
    // And with the same number of sustain attempts, since a check-in's
    // reading is the longest hold of its day.
    const attempts = (d: ProgramDay) =>
      d.items
        .flatMap((i): BreathStep[] =>
          i.kind === "drill" ? [drillPreset(i)] : i.kind === "breath" ? breathRoutineById(i.id)!.steps : [],
        )
        .reduce((k, s) => k + (s.drill === "sustain" ? s.attempts : 0), 0);
    for (const id of ["foundations-2w", "high-notes-6w", "mix-4w", "measured-voice-12w"]) {
      expect(new Set(checks(id).map(warmupBeforeRange)).size, id).toBe(1);
      expect(new Set(checks(id).map(attempts)).size, id).toBe(1);
    }
  });

  it("puts a range test at day 1 and at the end of each two weeks of the high-notes program", () => {
    const p = programById("high-notes-6w")!;
    const withRange = p.days.flatMap((d, i) => (d.items.some((x) => x.kind === "range") ? [i + 1] : []));
    expect(withRange).toEqual([1, 14, 28, 42]);
  });

  it("promises practice, not outcomes the app cannot measure", () => {
    const forbidden =
      /\badd(?:s|ing)?\s+(?:\w+\s+)?(?:notes?|semitones?|range)\b|\bfix(?:es|ed)?\b|\bheal|\bcure|\bguarantee|\bno strain|strain[- ]free|\bsafe\b|\bunlock your\b|\bextend your range\b/i;
    for (const p of PROGRAMS) {
      const copy = [p.name, p.tagline, p.measures, ...p.days.map((d) => d.title)].join(" \n ");
      expect(copy, p.id).not.toMatch(forbidden);
    }
  });

  it("refers a voice that hurts to a doctor who can examine the vocal folds, in the site's own words", () => {
    // Every card's measures line is in /programs' server HTML, so a referral
    // there reads as the site's safety advice and must say what the rest of
    // the site says, not a bare "a doctor".
    const referrals = PROGRAMS.filter((p) => /\bdoctor\b/i.test(p.measures));
    expect(referrals.map((p) => p.id)).toEqual(["recovery-week"]);
    for (const p of referrals) {
      expect(p.measures, p.id).toContain("a doctor who can examine the vocal folds, such as an ENT or laryngologist");
    }
  });

  it("deep-links every item with a relative URL into its room", () => {
    const hrefs = PROGRAMS.flatMap((p) => allItems(p).map(itemHref));
    for (const h of hrefs) expect(h).toMatch(/^\/(warmups|breath|range|songs|recorder|ear-training)(\?|$)/);
    expect(itemHref({ kind: "routine", id: "quick" })).toBe("/warmups?routine=quick");
    // With its rep count, so the room stops after the reps the row names.
    expect(itemHref({ kind: "exercise", id: "vibrato-hold", reps: 4 })).toBe("/warmups?exercise=vibrato-hold&reps=4");
    expect(itemHref({ kind: "breath", id: "daily" })).toBe("/breath?routine=daily");
    expect(itemHref({ kind: "drill", id: "sustain" })).toBe("/breath?drill=sustain");
    expect(itemHref({ kind: "range" })).toBe("/range?mode=range#start");
    expect(itemHref({ kind: "recorder" })).toBe("/recorder");
    expect(itemHref({ kind: "ear" })).toBe("/ear-training?routine=quick");
    // A drill with a preset carries it, so the breath room opens on the day's counts.
    expect(itemHref({ kind: "drill", id: "box", preset: { drill: "box", side: 5, minutes: 1 } })).toBe(
      "/breath?drill=box&side=5&minutes=1",
    );
    for (const item of PROGRAMS.flatMap(allItems)) {
      if (item.kind !== "drill" || !item.preset) continue;
      const q = new URLSearchParams(itemHref(item).split("?")[1]);
      expect(drillPresetFromQuery(item.id, q), itemHref(item)).toEqual(item.preset);
    }
    expect(itemHref({ kind: "song", slug: "ode-to-joy" })).toBe("/songs?song=ode-to-joy");
    // Every exercise row's link carries the count its meta line names, and a
    // count the warmups room honours (a whole number from 1 to 30), so the
    // exercise stops itself there instead of running as the endless walk.
    for (const item of PROGRAMS.flatMap(allItems)) {
      if (item.kind !== "exercise") continue;
      const q = new URLSearchParams(itemHref(item).split("?")[1]);
      expect(q.get("exercise")).toBe(item.id);
      expect(Number(q.get("reps")), itemHref(item)).toBe(item.reps);
      expect(Number.isInteger(item.reps) && item.reps >= 1 && item.reps <= 30, itemHref(item)).toBe(true);
      expect(itemLabel(item).meta).toContain(`${item.reps} reps`);
    }
  });
});

describe("item completion from the log", () => {
  const today = "2026-09-24";

  it("counts a warmup routine only when every one of its exercises was sung that day", () => {
    const item: ProgramItem = { kind: "routine", id: "quick" };
    const titles = routineById("quick")!.steps.map((s) => stepExercise(s).title);
    const all = titles.map((t) => session(today, "warmup", t));
    expect(itemDoneOn(item, all, today)).toBe(true);
    expect(itemDoneOn(item, all.slice(1), today)).toBe(false);
    // Yesterday's work does not count for today.
    expect(itemDoneOn(item, titles.map((t) => session("2026-09-23", "warmup", t)), today)).toBe(false);
    // Same titles under another activity type do not count.
    expect(itemDoneOn(item, titles.map((t) => session(today, "song", t)), today)).toBe(false);
  });

  it("counts a breath set by its drills, a drill by its title, and the range test by type", () => {
    const set: ProgramItem = { kind: "breath", id: "quick" };
    const drills = ["Box breathing", "Farinelli drill", "Sustain test"].map((d) => session(today, "breath", d));
    expect(itemDoneOn(set, drills, today)).toBe(true);
    expect(itemDoneOn(set, drills.slice(0, 2), today)).toBe(false);
    expect(itemDoneOn({ kind: "drill", id: "sustain" }, [drills[2]], today)).toBe(true);
    expect(itemDoneOn({ kind: "drill", id: "sustain" }, [drills[0]], today)).toBe(false);
    expect(itemDoneOn({ kind: "range" }, [session(today, "range", "Range test")], today)).toBe(true);
    expect(itemDoneOn({ kind: "range" }, [], today)).toBe(false);
  });

  it("counts ear training once pitch match and a recognition game are logged, as chapter 15 pairs them", () => {
    const ear: ProgramItem = { kind: "ear" };
    const game = (detail: string, type: SessionLog["type"] = "ear") => session(today, type, detail);
    // The titles the ear room logs its games under.
    expect(EAR_PITCH_GAME).toBe(GAME_NAMES["pitch-match"]);
    expect(EAR_RECOGNITION_GAMES).toEqual([GAME_NAMES.interval, GAME_NAMES["higher-lower"]]);
    expect(itemDoneOn(ear, [game("Pitch match"), game("Interval ID")], today)).toBe(true);
    expect(itemDoneOn(ear, [game("Higher or lower"), game("Pitch match")], today)).toBe(true);
    // One game is not the three minutes the row asks for.
    expect(itemDoneOn(ear, [game("Pitch match")], today)).toBe(false);
    expect(itemDoneOn(ear, [game("Interval ID")], today)).toBe(false);
    expect(itemDoneOn(ear, [game("Interval ID"), game("Higher or lower")], today)).toBe(false);
    expect(itemDoneOn(ear, [game("Pitch match"), game("Pitch match")], today)).toBe(false);
    expect(itemDoneOn(ear, [game("Pitch match", "warmup"), game("Interval ID")], today)).toBe(false);
    // Quick ear plays all three, so it ticks the row by itself.
    expect(itemDoneOn(ear, ["Higher or lower", "Interval ID", "Pitch match"].map((d) => game(d)), today)).toBe(true);
  });

  it("counts a song by its title", () => {
    const s = SONGS.find((x) => x.slug === "ode-to-joy")!;
    expect(itemDoneOn({ kind: "song", slug: s.slug }, [session(today, "song", s.title)], today)).toBe(true);
    expect(itemDoneOn({ kind: "song", slug: s.slug }, [session(today, "song", "Other")], today)).toBe(false);
  });
});

/** Start a program at midnight UTC of `day`, so that day's fixtures count. */
const begin = (id: string, day: string) => startProgram(id, day, new Date(`${day}T00:00:00Z`));

describe("advancing through a program", () => {
  const program = programById("foundations-2w")!;
  const d0 = "2026-09-21";

  it("starts on day 1 with nothing done", () => {
    const p = begin(program.id, d0);
    const r = reconcileProgress(program, p, [], d0);
    expect(r).toBe(p);
    expect(programToday(program, r, d0)).toEqual({ status: "todo", index: 0, completed: 0 });
  });

  it("completes a day from the log, then holds the next until tomorrow", () => {
    const p = begin(program.id, d0);
    const sessions = sessionsFor(program.days[0], d0);
    const r = reconcileProgress(program, p, sessions, d0);
    expect(r.done).toEqual([{ index: 0, day: d0 }]);
    expect(programToday(program, r, d0)).toEqual({ status: "done-today", index: 0, completed: 1 });
    // Idempotent: nothing new, same object back.
    expect(reconcileProgress(program, r, sessions, d0)).toBe(r);
  });

  it("never completes two days on one calendar day, however much was sung", () => {
    const p = begin(program.id, d0);
    const sessions = [...sessionsFor(program.days[0], d0), ...sessionsFor(program.days[1], d0), ...sessionsFor(program.days[2], d0)];
    const r = reconcileProgress(program, p, sessions, d0);
    expect(r.done.map((d) => d.index)).toEqual([0]);
    // And a manual mark on the same day is refused too.
    expect(markDayDone(program, r, d0)).toBe(r);
  });

  it("rolls over at midnight: the next day opens on the next local day", () => {
    const p = begin(program.id, d0);
    const r = reconcileProgress(program, p, sessionsFor(program.days[0], d0), d0);
    const tomorrow = addDays(d0, 1);
    expect(programToday(program, r, tomorrow)).toEqual({ status: "todo", index: 1, completed: 1 });
    const r2 = reconcileProgress(program, r, [...sessionsFor(program.days[0], d0), ...sessionsFor(program.days[1], tomorrow)], tomorrow);
    expect(r2.done).toEqual([{ index: 0, day: d0 }, { index: 1, day: tomorrow }]);
  });

  it("catches up on work logged on days the page was not open, one day per calendar day", () => {
    const p = begin(program.id, d0);
    const sessions = [
      ...sessionsFor(program.days[0], d0),
      ...sessionsFor(program.days[1], addDays(d0, 1)),
      // Day 3's work sung on the same calendar day as day 2's does not count twice.
      ...sessionsFor(program.days[2], addDays(d0, 1)),
      ...sessionsFor(program.days[2], addDays(d0, 3)),
    ];
    const r = reconcileProgress(program, p, sessions, addDays(d0, 4));
    expect(r.done).toEqual([
      { index: 0, day: d0 },
      { index: 1, day: addDays(d0, 1) },
      { index: 2, day: addDays(d0, 3) },
    ]);
    expect(programToday(program, r, addDays(d0, 4)).status).toBe("todo");
  });

  it("does not count work logged before the program started", () => {
    const p = begin(program.id, d0);
    const r = reconcileProgress(program, p, sessionsFor(program.days[0], addDays(d0, -1)), d0);
    expect(r.done).toEqual([]);
  });

  it("does not complete a day from a log dated after today", () => {
    const p = begin(program.id, d0);
    const r = reconcileProgress(program, p, sessionsFor(program.days[0], addDays(d0, 1)), d0);
    expect(r.done).toEqual([]);
  });

  it("takes a rest day on the first calendar day it is reached", () => {
    const restIndex = program.days.findIndex(isRestDay);
    expect(restIndex).toBe(6);
    const done = Array.from({ length: restIndex }, (_, i) => ({ index: i, day: addDays(d0, i) }));
    const p = { programId: program.id, startedDay: d0, done };
    const yesterdayDone = addDays(d0, restIndex - 1);
    // Still the day the last one was done: the rest day waits.
    expect(reconcileProgress(program, p, [], yesterdayDone)).toBe(p);
    const next = addDays(d0, restIndex);
    const r = reconcileProgress(program, p, [], next);
    expect(r.done.at(-1)).toEqual({ index: restIndex, day: next });
    expect(programToday(program, r, next)).toEqual({ status: "done-today", index: restIndex, completed: restIndex + 1 });
  });

  it("lets the singer mark a day done by hand, once per calendar day", () => {
    const p = begin(program.id, d0);
    const r = markDayDone(program, p, d0);
    expect(r.done).toEqual([{ index: 0, day: d0, manual: true }]);
    expect(markDayDone(program, r, d0)).toBe(r);
    const r2 = markDayDone(program, r, addDays(d0, 1));
    expect(r2.done.map((d) => d.index)).toEqual([0, 1]);
  });

  it("finishes after the last day, and a restart begins again from day 1", () => {
    const short = programById("recovery-week")!;
    const done = short.days.map((_, i) => ({ index: i, day: addDays(d0, i) }));
    const p = { programId: short.id, startedDay: d0, done };
    const last = addDays(d0, short.days.length);
    expect(programToday(short, p, last)).toEqual({ status: "finished", index: short.days.length - 1, completed: short.days.length });
    expect(markDayDone(short, p, last)).toBe(p);
    expect(reconcileProgress(short, p, [], last)).toBe(p);
    const again = begin(short.id, last);
    expect(programToday(short, again, last)).toEqual({ status: "todo", index: 0, completed: 0 });
  });
});

describe("one session pays for one item", () => {
  const today = "2026-09-24";

  it("does not let a single sustain test tick both the lone drill and the breath set", () => {
    const day1 = programById("foundations-2w")!.days[0];
    const sustainAt = day1.items.findIndex((i) => i.kind === "drill" && i.id === "sustain");
    const setAt = day1.items.findIndex((i) => i.kind === "breath");
    expect(sustainAt).toBeGreaterThanOrEqual(0);
    expect(setAt).toBeGreaterThanOrEqual(0);
    const one = ["Box breathing", "Farinelli drill", "Sustain test"].map((d) => session(today, "breath", d));
    const done = itemsDoneOn(day1, one, today);
    // One sustain session: whichever comes first in the day takes it, and the
    // other is left a sustain short.
    expect(done[Math.min(sustainAt, setAt)]).toBe(true);
    expect(done[Math.max(sustainAt, setAt)]).toBe(false);
    // A second sustain completes both.
    const both = itemsDoneOn(day1, [...one, session(today, "breath", "Sustain test")], today);
    expect(both[sustainAt] && both[setAt]).toBe(true);
  });

  it("does not let the vibrato routine's hold also count as the lone vibrato hold", () => {
    const d: ProgramDay = {
      title: "",
      items: [
        { kind: "routine", id: "vibrato" },
        { kind: "exercise", id: "vibrato-hold", reps: 4 },
      ],
    };
    const titles = routineById("vibrato")!.steps.map((s) => stepExercise(s).title);
    const routineOnly = titles.map((t) => session(today, "warmup", t));
    expect(itemsDoneOn(d, routineOnly, today)).toEqual([true, false]);
    const hold = stepExercise({ exerciseId: "vibrato-hold", reps: 1 }).title;
    expect(itemsDoneOn(d, [...routineOnly, session(today, "warmup", hold)], today)).toEqual([true, true]);
  });

  it("waives a routine step the runner skips for a narrow saved range, so the day can complete", () => {
    // The routine runner closes a step tooWideForRange holds without logging
    // it; matching that still asked for it would leave the day open for good.
    const narrow = { lowMidi: 48, highMidi: 64 };
    const d: ProgramDay = { title: "", items: [{ kind: "routine", id: "quick" }] };
    const steps = routineById("quick")!.steps.map((s) => stepExercise(s));
    expect(steps.some((ex) => tooWideForRange(ex, narrow))).toBe(true);
    const sung = steps.filter((ex) => !tooWideForRange(ex, narrow)).map((ex) => session(today, "warmup", ex.title));
    expect(itemsDoneOn(d, sung, today)).toEqual([false]);
    expect(itemsDoneOn(d, sung, today, today, narrow)).toEqual([true]);
    expect(matchDay(d, sung, today, today, narrow).steps[0]).toEqual(steps.map(() => true));
    // Which ticks are waived rather than sung, so the day card can say so.
    expect(matchDay(d, sung, today, today, narrow).waived[0]).toEqual(steps.map((ex) => tooWideForRange(ex, narrow)));
    expect(matchDay(d, [], today, today, narrow).steps[0]).toEqual(steps.map((ex) => tooWideForRange(ex, narrow)));
    expect(matchDay(d, sung, today).waived[0]).toEqual(steps.map(() => false));
    // A range wide enough for every step waives nothing.
    expect(itemsDoneOn(d, sung, today, today, { lowMidi: 40, highMidi: 70 })).toEqual([false]);
  });

  it("lets a later item take a session an earlier one can do without, in any log order", () => {
    const d: ProgramDay = { title: "", items: [{ kind: "drill", id: "sustain" }, { kind: "breath", id: "quick" }] };
    const log = ["Sustain test", "Box breathing", "Farinelli drill", "Sustain test"].map((x) => session(today, "breath", x));
    expect(itemsDoneOn(d, log, today)).toEqual([true, true]);
    expect(itemsDoneOn(d, [...log].reverse(), today)).toEqual([true, true]);
  });

  it("never completes a day from a session that has to tick two items", () => {
    const program = programById("foundations-2w")!;
    const d0 = "2026-09-21";
    const p = begin(program.id, d0);
    const quick = routineById("quick")!.steps.map((s) => session(d0, "warmup", stepExercise(s).title));
    const log = [
      session(d0, "range", "Range test"),
      ...["Box breathing", "Farinelli drill", "Sustain test"].map((x) => session(d0, "breath", x)),
      ...quick,
    ];
    expect(reconcileProgress(program, p, log, d0).done).toEqual([]);
    const r = reconcileProgress(program, p, [...log, session(d0, "breath", "Sustain test")], d0);
    expect(r.done).toEqual([{ index: 0, day: d0 }]);
  });
});

describe("a restart on the same day", () => {
  const program = programById("recovery-week")!;
  const today = "2026-09-24";

  it("ignores sessions from before the restart", () => {
    const first = begin(program.id, today);
    const log = sessionsForDay(program.days[0], today, "09:00:00");
    expect(reconcileProgress(program, first, log, today).done.map((d) => d.index)).toEqual([0]);
    // Restarted at 10:00: the 09:00 work belongs to the earlier run.
    const again = startProgram(program.id, today, new Date(`${today}T10:00:00Z`));
    expect(reconcileProgress(program, again, log, today)).toBe(again);
    expect(programToday(program, again, today)).toEqual({ status: "todo", index: 0, completed: 0 });
    // Work after the restart counts.
    const later = sessionsForDay(program.days[0], today, "11:00:00");
    expect(reconcileProgress(program, again, [...log, ...later], today).done).toEqual([{ index: 0, day: today }]);
    expect(sessionsForRun(again, [...log, ...later])).toHaveLength(later.length);
  });

  it("falls back to the start day for records without a start time", () => {
    const legacy = { programId: program.id, startedDay: today, done: [] };
    const log = sessionsForDay(program.days[0], today, "09:00:00");
    expect(reconcileProgress(program, legacy, log, today).done).toEqual([{ index: 0, day: today }]);
    expect(reconcileProgress(program, legacy, sessionsForDay(program.days[0], "2026-09-23"), today).done).toEqual([]);
  });
});

describe("the stored record", () => {
  it("revives a good record and drops junk", () => {
    const good = { programId: "vibrato-3w", startedDay: "2026-09-01", done: [{ index: 0, day: "2026-09-01" }] };
    expect(reviveProgress(good)).toEqual(good);
    expect(reviveProgress(null)).toBeNull();
    expect(reviveProgress("x")).toBeNull();
    expect(reviveProgress({ programId: "gone", startedDay: "2026-09-01", done: [] })).toBeNull();
    expect(reviveProgress({ programId: "vibrato-3w", startedDay: "yesterday", done: [] })).toBeNull();
  });

  it("keeps the longest valid prefix of completed days", () => {
    const r = reviveProgress({
      programId: "vibrato-3w",
      startedDay: "2026-09-01",
      done: [
        { index: 0, day: "2026-09-01", manual: true },
        { index: 1, day: "2026-09-02" },
        // Same calendar day as the one before: two days in one is not allowed.
        { index: 2, day: "2026-09-02" },
        { index: 3, day: "2026-09-04" },
      ],
    });
    expect(r?.done).toEqual([
      { index: 0, day: "2026-09-01", manual: true },
      { index: 1, day: "2026-09-02" },
    ]);
    expect(reviveProgress({ programId: "vibrato-3w", startedDay: "2026-09-01", done: "x" })?.done).toEqual([]);
  });

  it("drops impossible dates instead of crashing on them", () => {
    expect(reviveProgress({ programId: "vibrato-3w", startedDay: "2026-99-99", done: [] })).toBeNull();
    expect(reviveProgress({ programId: "vibrato-3w", startedDay: "2026-02-30", done: [] })).toBeNull();
    const r = reviveProgress({
      programId: "vibrato-3w",
      startedDay: "2026-09-01",
      startedAt: "not a time",
      done: [
        { index: 0, day: "2026-09-01" },
        { index: 1, day: "2026-99-99" },
        { index: 2, day: "2026-09-03" },
      ],
    });
    expect(r).toEqual({ programId: "vibrato-3w", startedDay: "2026-09-01", done: [{ index: 0, day: "2026-09-01" }] });
    // The repaired record reconciles and reports without throwing.
    const program = programById("vibrato-3w")!;
    expect(() => programToday(program, reconcileProgress(program, r!, [], "2026-09-24"), "2026-09-24")).not.toThrow();
  });

  it("keeps a valid start time", () => {
    const at = "2026-09-01T08:30:00.000Z";
    expect(reviveProgress({ programId: "vibrato-3w", startedDay: "2026-09-01", startedAt: at, done: [] })?.startedAt).toBe(at);
  });

  it("adds calendar days across month ends and DST changes", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDays("2026-03-08", 1)).toBe("2026-03-09");
    expect(addDays("2026-11-01", 1)).toBe("2026-11-02");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });
});

describe("a free singer's day, spread over several calendar days", () => {
  const program = programById("foundations-2w")!;
  const d0 = "2026-09-21";

  it("completes once the log since the day opened covers every item", () => {
    const p = begin(program.id, d0);
    const d = program.days[0];
    // One item a day, over as many days as the program day has items.
    const log = d.items.flatMap((item, k) =>
      itemEvidence(item).map((e) => session(addDays(d0, k), e.type, e.details?.[0])),
    );
    const lastDay = addDays(d0, d.items.length - 1);
    expect(reconcileProgress(program, p, log, addDays(lastDay, -1)).done).toEqual([]);
    expect(reconcileProgress(program, p, log, lastDay).done).toEqual([{ index: 0, day: lastDay }]);
    expect(itemsDoneOn(d, log, addDays(lastDay, -1), d0)).toEqual(d.items.map((_, k) => k < d.items.length - 1));
  });

  it("does not count practice from the day the previous program day completed", () => {
    const p = begin(program.id, d0);
    // Day 1 and all of day 2's work on the same calendar day, then nothing.
    const log = [...sessionsFor(program.days[0], d0), ...sessionsFor(program.days[1], d0)];
    const r = reconcileProgress(program, p, log, addDays(d0, 3));
    expect(r.done.map((x) => x.index)).toEqual([0]);
  });

  it("lists a routine's and a set's steps, whose evidence together is the item's", () => {
    for (const prog of PROGRAMS) {
      for (const item of allItems(prog)) {
        const steps = itemSteps(item);
        if (item.kind === "routine" || item.kind === "breath") {
          expect(steps.length, `${prog.id} ${item.id}`).toBeGreaterThan(0);
          expect(steps.flatMap((st) => itemEvidence(st))).toEqual(itemEvidence(item));
          // A free routine's steps are free exercises: its step links gate nothing.
          if (!itemIsPro(item)) for (const st of steps) expect(itemIsPro(st)).toBe(false);
        } else {
          expect(steps).toEqual([]);
        }
      }
    }
  });
});

describe("sustain attempts under the logging threshold", () => {
  it("count toward a sustain test; logged ones are not counted twice", () => {
    const at = new Date(2026, 8, 21, 9, 30).toISOString();
    const rows = sustainAttemptSessions([
      { sec: 3.4, date: at },
      { sec: 7, date: at },
      { sec: 2, date: "not a date" },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ type: "breath", detail: "Sustain test", day: "2026-09-21", durationSec: 3.4 });
    expect(itemDoneOn({ kind: "drill", id: "sustain" }, rows, "2026-09-21")).toBe(true);
  });
});

describe("check-in readings", () => {
  const program = programById("foundations-2w")!;
  const d0 = "2026-09-21";
  const last = program.days.length - 1;

  function run(startedAt?: string) {
    const p = startedAt
      ? startProgram(program.id, d0, new Date(startedAt))
      : begin(program.id, d0);
    const sessions: SessionLog[] = [];
    program.days.forEach((d, i) => sessions.push(...sessionsFor(d, addDays(d0, i))));
    // The two sustain tests, with real lengths.
    for (const s of sessions) {
      if (s.detail === "Sustain test" && s.day === d0) s.durationSec = 6.2;
      if (s.detail === "Sustain test" && s.day === addDays(d0, last)) s.durationSec = 9.8;
    }
    const history = [
      { lowMidi: 48, highMidi: 67, testedAt: `${d0}T12:00:00.000Z` },
      { lowMidi: 47, highMidi: 69, testedAt: `${addDays(d0, last)}T12:00:00.000Z` },
    ];
    const r = reconcileProgress(program, p, sessions, addDays(d0, last));
    return { r, sessions, history };
  }

  it("reads the first and last check-ins back, so the program's comparison can be made", () => {
    const { r, sessions, history } = run();
    expect(r.done).toHaveLength(program.days.length);
    const readings = programReadings(program, r, sessions, history);
    expect(readings.map((x) => x.index)).toEqual([0, last]);
    expect(readings[0]).toMatchObject({ day: d0, range: { lowMidi: 48, highMidi: 67 } });
    expect(readings[1]).toMatchObject({ range: { lowMidi: 47, highMidi: 69 } });
    // Only sustain-test sessions are read, not the day's other breath work.
    expect(readings[0].sustainSec).toBeCloseTo(6.2);
    expect(readings[1].sustainSec).toBeCloseTo(9.8);
  });

  it("says a reading is not on record rather than borrowing another day's", () => {
    const { r, sessions } = run();
    const readings = programReadings(program, r, sessions, []);
    expect(readings[0].range).toBeNull();
  });

  it("ignores a range test from before a same-day start", () => {
    const { sessions, history } = run();
    const p = startProgram(program.id, d0, new Date(`${d0}T13:00:00Z`));
    const later = sessionsFor(program.days[0], d0).map((s) => ({ ...s, date: `${d0}T14:00:00.000Z` }));
    const r = reconcileProgress(program, p, [...sessions, ...later], d0);
    expect(r.done).toHaveLength(1);
    expect(programReadings(program, r, [...sessions, ...later], history)[0].range).toBeNull();
  });
});

describe("step ticks share the day's matching", () => {
  it("spends one session on one step, even where two routines share an exercise", () => {
    const today = "2026-09-24";
    const d: ProgramDay = { title: "", items: [{ kind: "routine", id: "quick" }, { kind: "routine", id: "quick" }] };
    const first = itemEvidence(d.items[0])[0];
    const m = matchDay(d, [session(today, first.type, first.details?.[0])], today);
    expect(m.items).toEqual([false, false]);
    expect(m.steps.flat().filter(Boolean)).toHaveLength(1);
    // A finished row keeps its sessions: the partial row gets only what is left.
    const all = itemEvidence(d.items[0]).map((e) => session(today, e.type, e.details?.[0]));
    const m2 = matchDay(d, all, today);
    expect(m2.items).toEqual([true, false]);
    expect(m2.steps[0].every(Boolean)).toBe(true);
    expect(m2.steps[1].some(Boolean)).toBe(false);
    expect(itemsDoneOn(d, all, today)).toEqual(m2.items);
  });
});

describe("check-in readings are kept on the record", () => {
  it("survive their evidence aging out, and a revive", () => {
    const program = programById("foundations-2w")!;
    const d0 = "2026-09-21";
    const p = begin(program.id, d0);
    const hold = sustainAttemptSessions([{ sec: 3.5, date: `${d0}T12:00:00.000Z` }]);
    // Day 1 needs two sustain tests (the lone drill and the one in its breath
    // set): one logged at 5 s, and one hold too short to be logged.
    const logged = sessionsFor(program.days[0], d0);
    const firstSustain = logged.findIndex((x) => x.detail === "Sustain test");
    logged[firstSustain] = { ...logged[firstSustain], durationSec: 5 };
    const second = logged.findIndex((x, i) => i > firstSustain && x.detail === "Sustain test");
    const log = [...logged.filter((_, i) => i !== second), ...hold];
    const history = [{ lowMidi: 50, highMidi: 70, testedAt: `${d0}T12:00:00.000Z` }];
    const r = reconcileProgress(program, p, log, d0);
    expect(r.done).toHaveLength(1);
    const kept = withReadings(r, programReadings(program, r, log, history));
    expect(kept.done[0]).toMatchObject({ range: { lowMidi: 50, highMidi: 70 }, sustainSec: 5 });
    // Nothing new: the same object back, so the hook does not write again.
    expect(withReadings(kept, programReadings(program, kept, log, history))).toBe(kept);
    // The log and the range test are gone; the readings are not.
    const revived = reviveProgress(JSON.parse(JSON.stringify(kept)))!;
    expect(programReadings(program, revived, [], [])[0]).toMatchObject({
      range: { lowMidi: 50, highMidi: 70 },
      sustainSec: 5,
    });
    // A day whose only sustain was a short hold keeps that hold.
    const shortOnly = withReadings(r, [{ index: 0, day: d0, range: null, sustainSec: 3.5 }]);
    const again = reviveProgress(JSON.parse(JSON.stringify(shortOnly)))!;
    expect(programReadings(program, again, [], [])[0].sustainSec).toBe(3.5);
  });
});

describe("step links", () => {
  it("open each step through params the rooms publish, keeping the routine's or set's preset", () => {
    const rooms = Object.values(buildContract().deepLinks.rooms);
    for (const prog of PROGRAMS) {
      for (const item of allItems(prog)) {
        itemSteps(item).forEach((_, k) => {
          const href = itemStepHref(item, k);
          const url = new URL(href, "https://x.invalid");
          const room = rooms.find((r) => r.path === url.pathname);
          expect(room, href).toBeDefined();
          for (const key of url.searchParams.keys()) expect(room!.params, href).toContain(key);
          // The routine or set itself, at that step: its preset, not a default.
          expect(url.searchParams.get("routine")).toBe("id" in item ? item.id : null);
          expect(url.searchParams.get("step")).toBe(String(k + 1));
        });
      }
    }
  });
});

describe("sustain readings keep the timer's tenths", () => {
  it("reads the attempt record alongside the rounded log", () => {
    const program = programById("foundations-2w")!;
    const d0 = "2026-09-21";
    const p = begin(program.id, d0);
    const log = sessionsFor(program.days[0], d0).map((x) =>
      x.detail === "Sustain test" ? { ...x, durationSec: 12 } : x,
    );
    const r = reconcileProgress(program, p, log, d0);
    const holds = [
      { sec: 12.4, date: `${d0}T12:00:00.000Z` },
      // Before the program started: not this run's.
      { sec: 30.2, date: `${addDays(d0, -1)}T12:00:00.000Z` },
    ];
    expect(programReadings(program, r, log, [], holds)[0].sustainSec).toBe(12.4);
    expect(programReadings(program, r, log, [])[0].sustainSec).toBe(12);
  });
});

describe("cool-downs", () => {
  it("ends every high-notes practice day on a descending, beginner-tier sound", () => {
    const p = programById("high-notes-6w")!;
    p.days.forEach((d, i) => {
      if (isRestDay(d)) return;
      const last = d.items[d.items.length - 1];
      expect(last.kind, `day ${i + 1}`).toBe("routine");
      const r = routineById((last as { id: string }).id)!;
      const ex = stepExercise(r.steps[r.steps.length - 1]);
      const notes = ex.buildSteps(60).flat();
      expect(notes[0], `day ${i + 1} ends on ${ex.id}`).toBeGreaterThan(notes[notes.length - 1]);
      expect(ex.tier, `day ${i + 1} ends on ${ex.id}`).toBe("beginner");
    });
  });
});

describe("going back a fortnight in the book's program", () => {
  const program = programById("measured-voice-12w")!;
  const d0 = "2026-06-01";
  const chapter = (fromWeek: number) => program.chapters!.find((c) => c.fromWeek === fromWeek)!;

  /** Days 1 to `upTo` sung one a calendar day, the check-ins with real readings. */
  function run(upTo: number) {
    const p = begin(program.id, d0);
    const sessions: SessionLog[] = [];
    program.days.slice(0, upTo).forEach((d, i) => sessions.push(...sessionsFor(d, addDays(d0, i))));
    for (const s of sessions) if (s.detail === "Sustain test") s.durationSec = s.day === d0 ? 7 : 11;
    const history = [
      { lowMidi: 48, highMidi: 67, testedAt: `${d0}T12:00:00.000Z` },
      { lowMidi: 47, highMidi: 69, testedAt: `${addDays(d0, 41)}T12:00:00.000Z` },
    ];
    const today = addDays(d0, upTo);
    const r = reconcileProgress(program, p, sessions, addDays(d0, upTo - 1));
    const kept = withReadings(r, programReadings(program, r, sessions, history));
    return { r: kept, sessions, history, today };
  }

  it("keeps the days before the fortnight with their check-in readings, and drops the rest", () => {
    const { r, sessions, history, today } = run(45);
    expect(r.done).toHaveLength(45);
    const readings = programReadings(program, r, sessions, history);
    // Day 11's long breath set ends on a sustain test, so it is a check-in too.
    expect(readings.map((x) => x.index)).toEqual([0, 10, 41]);
    const start = chapterStartIndex(chapter(5));
    expect(start).toBe(28);
    const back = repeatFrom(r, start, readings, new Date(`${today}T12:00:00Z`));
    expect(back.done).toHaveLength(28);
    expect(back.done.slice(0, 28)).toEqual(r.done.slice(0, 28));
    expect(back.done[0]).toMatchObject({ range: { lowMidi: 48, highMidi: 67 }, sustainSec: 7 });
    expect(back.startedDay).toBe(r.startedDay);
    // Day 1's reading is still there to compare against; day 42's is sung again.
    const after = programReadings(program, back, sessions, history);
    expect(after.map((x) => x.index)).toEqual([0, 10]);
    expect(after[0]).toMatchObject({ index: 0, range: { lowMidi: 48, highMidi: 67 }, sustainSec: 7 });
    expect(after[1]).toMatchObject({ index: 10, sustainSec: 11 });
    // Day 11 takes a sustain test and no range test: its range is not a test
    // missed ("not logged") but none asked for.
    expect(after[1].range).toBeUndefined();
    expect(after[0].range).not.toBeUndefined();
    // The stored record survives a reload as it is.
    expect(reviveProgress(JSON.parse(JSON.stringify(back)))).toEqual(back);
  });

  it("does not tick the repeated days off the practice logged before going back", () => {
    const { r, sessions, history, today } = run(45);
    const back = repeatFrom(r, 28, programReadings(program, r, sessions, history), new Date(`${today}T12:00:00Z`));
    expect(reconcileProgress(program, back, sessions, today)).toBe(back);
    expect(programToday(program, back, today)).toMatchObject({ status: "todo", index: 28 });
    // The card names today as the first day that counts, not the day after day 28.
    expect(countsFromDay(back)).toBe(today);
    // Practice from now on ticks day 29, today.
    const fresh = sessionsForDay(program.days[28], today, "13:00:00");
    const next = reconcileProgress(program, back, [...sessions, ...fresh], today);
    expect(next.done).toHaveLength(29);
    expect(next.done[28]).toEqual({ index: 28, day: today });
  });

  it("never goes back past day 1, which is a restart", () => {
    const { r, sessions, history, today } = run(10);
    expect(repeatFrom(r, 0, programReadings(program, r, sessions, history), new Date(`${today}T12:00:00Z`)).done).toEqual(
      r.done.slice(0, 1),
    );
  });

  it("offers the fortnight under way once a day of it is done, and the one before it", () => {
    // Day 29 to do: weeks 5 and 6 have not started, so only weeks 3 and 4 are offered.
    expect(repeatChoices(program, 28).map((c) => c.fromWeek)).toEqual([3]);
    expect(repeatChoices(program, 29).map((c) => c.fromWeek)).toEqual([5, 3]);
    expect(repeatChoices(program, 45).map((c) => c.fromWeek)).toEqual([7, 5]);
    // Weeks 1 and 2 are the restart's, not a go-back's.
    expect(repeatChoices(program, 3)).toEqual([]);
    expect(repeatChoices(program, 16).map((c) => c.fromWeek)).toEqual([3]);
    // Finished, and programs without chapters, offer nothing here.
    expect(repeatChoices(program, program.days.length)).toEqual([]);
    expect(repeatChoices(programById("foundations-2w")!, 9)).toEqual([]);
  });

  it("counts from the day after the last completed day on an ordinary run", () => {
    const { r } = run(10);
    expect(countsFromDay(r)).toBe(addDays(d0, 10));
  });
});

describe("the run's next range test", () => {
  const program = programById("measured-voice-12w")!;
  const d0 = "2026-06-01";
  /** `upTo` days done, the last of them on `last`. */
  const at = (upTo: number, last = addDays(d0, upTo - 1)) => {
    const progress = {
      ...begin(program.id, d0),
      done: Array.from({ length: upTo }, (_, index) => ({ index, day: index === upTo - 1 ? last : addDays(d0, index) })),
    };
    return { progress, view: (today: string) => programToday(program, progress, today) };
  };

  it("names the scheduled day ahead, today's own when it is still to do", () => {
    // The book's three tests: day 1, the end of week 6, the start of week 12.
    const ranged = program.days.flatMap((d, i) => (d.items.some((it) => it.kind === "range") ? [i + 1] : []));
    expect(ranged).toEqual([1, 42, 78]);
    // Day 37 to do, a week behind the calendar.
    const behind = at(36);
    expect(nextRangeTestDay(program, behind.progress, behind.view(addDays(d0, 44)))).toBe(42);
    // Day 42 to do today: today's own.
    const due = at(41);
    expect(due.view(addDays(d0, 41))).toMatchObject({ status: "todo", index: 41 });
    expect(nextRangeTestDay(program, due.progress, due.view(addDays(d0, 41)))).toBe(42);
    // Day 42 done today: the next is day 78.
    const doneToday = at(42);
    expect(doneToday.view(addDays(d0, 41))).toMatchObject({ status: "done-today", index: 41 });
    expect(nextRangeTestDay(program, doneToday.progress, doneToday.view(addDays(d0, 41)))).toBe(78);
    expect(nextRangeTestDay(program, at(43).progress, at(43).view(addDays(d0, 43)))).toBe(78);
  });

  it("is null once the last test is done, and on a finished run", () => {
    expect(nextRangeTestDay(program, at(78).progress, at(78).view(addDays(d0, 80)))).toBeNull();
    const all = at(program.days.length);
    expect(all.view(addDays(d0, 90)).status).toBe("finished");
    expect(nextRangeTestDay(program, all.progress, all.view(addDays(d0, 90)))).toBeNull();
    // Vibrato in 3 weeks takes no range test at all.
    const vibrato = programById("vibrato-3w")!;
    const v = { ...begin(vibrato.id, d0), done: [] };
    expect(nextRangeTestDay(vibrato, v, programToday(vibrato, v, d0))).toBeNull();
  });

  it("stops at a repeated fortnight's end, since the days after it stay done", () => {
    const { progress } = at(28);
    const repeating = {
      ...progress,
      until: 42,
      later: Array.from({ length: program.days.length - 42 }, (_, k) => ({ index: 42 + k, day: addDays(d0, 42 + k) })),
    };
    const today = addDays(d0, 100);
    expect(nextRangeTestDay(program, repeating, programToday(program, repeating, today))).toBe(42);
    const past = {
      ...repeating,
      done: Array.from({ length: 42 }, (_, index) => ({ index, day: addDays(d0, index) })),
    };
    expect(programToday(program, past, today).status).toBe("finished");
    expect(nextRangeTestDay(program, past, programToday(program, past, today))).toBeNull();
  });
});

describe("singing one fortnight of a finished run again (chapter 19)", () => {
  const program = programById("measured-voice-12w")!;
  const d0 = "2026-06-01";
  const chapter = (fromWeek: number) => program.chapters!.find((c) => c.fromWeek === fromWeek)!;
  const total = program.days.length;

  /** Every day sung one a calendar day, the check-ins with real readings, then the fortnight from `fromWeek` gone back to. */
  function finishedThenBack(fromWeek: number) {
    const p = begin(program.id, d0);
    const sessions: SessionLog[] = [];
    program.days.forEach((d, i) => sessions.push(...sessionsFor(d, addDays(d0, i))));
    for (const s of sessions) if (s.detail === "Sustain test") s.durationSec = s.day === d0 ? 7 : 11;
    const history = [
      { lowMidi: 48, highMidi: 67, testedAt: `${d0}T12:00:00.000Z` },
      { lowMidi: 47, highMidi: 69, testedAt: `${addDays(d0, 41)}T12:00:00.000Z` },
      { lowMidi: 47, highMidi: 70, testedAt: `${addDays(d0, 77)}T12:00:00.000Z` },
    ];
    const reconciled = reconcileProgress(program, p, sessions, addDays(d0, total - 1));
    const readings = programReadings(program, reconciled, sessions, history);
    const finished = withReadings(reconciled, readings);
    const today = addDays(d0, total + 3);
    const back = repeatFortnight(finished, chapter(fromWeek), readings, new Date(`${today}T12:00:00Z`));
    return { finished, readings, back, sessions, history, today };
  }

  it("keeps every day outside the fortnight done, with its readings", () => {
    const { finished, readings, back, today } = finishedThenBack(5);
    expect(finished.done).toHaveLength(total);
    expect(programToday(program, finished, today).status).toBe("finished");
    expect(readings.map((r) => r.index)).toEqual([0, 10, 41, 59, 66, 77]);
    expect(back.done).toEqual(finished.done.slice(0, 28));
    expect(back.until).toBe(42);
    expect(back.later).toEqual(finished.done.slice(42));
    expect(back.startedDay).toBe(finished.startedDay);
    expect(back.startedAt).toBe(`${today}T12:00:00.000Z`);
    // Day 29 is today's, with the later days still counted as done.
    expect(programToday(program, back, today)).toEqual({ status: "todo", index: 28, completed: total - 14 });
    // The stored record survives a reload as it is.
    expect(reviveProgress(JSON.parse(JSON.stringify(back)))).toEqual(back);
  });

  it("does not tick the fortnight off the practice logged before going back", () => {
    const { back, sessions, history, readings, today } = finishedThenBack(5);
    expect(reconcileProgress(program, back, sessions, today)).toBe(back);
    expect(countsFromDay(back)).toBe(today);
    // Only day 42's check-in is sung again; the rest of the readings stay.
    const now = programReadings(program, back, sessions, history);
    expect(now.map((r) => r.index)).toEqual([0, 10, 59, 66, 77]);
    expect(now).toEqual(readings.filter((r) => r.index !== 41));
    // Days 60 and 67 take a sustain test and no range test, on either pass.
    for (const r of now) {
      expect("range" in r, `day ${r.index + 1}`).toBe(r.index === 0 || r.index === 77);
    }
  });

  it("finishes again once the fortnight is sung, and does not run on into week 7", () => {
    const { back, sessions, history, readings, today } = finishedThenBack(5);
    // Days 29 to 44 sung one a calendar day: the two after the fortnight must not count.
    const fresh: SessionLog[] = [];
    program.days.slice(28, 44).forEach((d, i) => fresh.push(...sessionsForDay(d, addDays(today, i), "13:00:00")));
    const end = addDays(today, 15);
    const all = [...sessions, ...fresh];
    const sung = reconcileProgress(program, back, all, end);
    expect(sung.done).toHaveLength(42);
    expect(sung.done.slice(28).map((d) => d.day)).toEqual(Array.from({ length: 14 }, (_, i) => addDays(today, i)));
    expect(sung.until).toBe(42);
    expect(sung.later).toEqual(back.later);
    expect(programToday(program, sung, end)).toEqual({ status: "finished", index: total - 1, completed: total });
    expect(markDayDone(program, sung, end)).toBe(sung);
    // Day 42's new reading, beside the earlier ones.
    const retest = { lowMidi: 46, highMidi: 70, testedAt: `${addDays(today, 13)}T14:00:00.000Z` };
    const after = programReadings(program, sung, all, [...history, retest]);
    expect(after.map((r) => r.index)).toEqual([0, 10, 41, 59, 66, 77]);
    expect(after.find((r) => r.index === 41)).toMatchObject({ day: addDays(today, 13), range: { lowMidi: 46, highMidi: 70 } });
    expect(after.filter((r) => r.index !== 41)).toEqual(readings.filter((r) => r.index !== 41));
    expect(reviveProgress(JSON.parse(JSON.stringify(sung)))).toEqual(sung);
  });

  it("can sing the next fortnight after that one, and keeps the record in calendar order", () => {
    const { back, sessions, today } = finishedThenBack(5);
    const fresh: SessionLog[] = [];
    program.days.slice(28, 42).forEach((d, i) => fresh.push(...sessionsForDay(d, addDays(today, i), "13:00:00")));
    const sung = reconcileProgress(program, back, [...sessions, ...fresh], addDays(today, 13));
    expect(programToday(program, sung, addDays(today, 20)).status).toBe("finished");
    const again = repeatFortnight(sung, chapter(7), [], new Date(`${addDays(today, 20)}T12:00:00Z`));
    expect(again.done).toEqual(sung.done);
    expect(again.until).toBe(56);
    expect(again.later).toEqual(sung.later!.slice(14));
    expect(programToday(program, again, addDays(today, 20))).toEqual({ status: "todo", index: 42, completed: total - 14 });
    expect(reviveProgress(JSON.parse(JSON.stringify(again)))).toEqual(again);
    // Weeks 7 and 8 sung, then back to weeks 5 and 6: the newer weeks 7 and 8
    // wait in `later` with the older rest, and `done` stays in calendar order.
    const more: SessionLog[] = [];
    program.days.slice(42, 56).forEach((d, i) => more.push(...sessionsForDay(d, addDays(today, 20 + i), "13:00:00")));
    const sungAgain = reconcileProgress(program, again, [...sessions, ...fresh, ...more], addDays(today, 33));
    expect(programToday(program, sungAgain, addDays(today, 33)).status).toBe("finished");
    const third = repeatFortnight(sungAgain, chapter(5), [], new Date(`${addDays(today, 40)}T12:00:00Z`));
    expect(third.done).toEqual(sung.done.slice(0, 28));
    expect(third.until).toBe(42);
    expect(third.later!.map((d) => d.index)).toEqual(Array.from({ length: total - 42 }, (_, i) => 42 + i));
    expect(third.later!.slice(0, 14)).toEqual(sungAgain.done.slice(42));
    expect(reviveProgress(JSON.parse(JSON.stringify(third)))).toEqual(third);
  });

  it("goes back as a running program does when the run is not finished", () => {
    const { finished, readings, back, today } = finishedThenBack(5);
    // Part way through weeks 5 and 6 again: days 29 to 42 are on neither pass.
    const mid = repeatFortnight(back, chapter(5), readings, new Date(`${addDays(today, 3)}T12:00:00Z`));
    expect(mid).toEqual({ ...back, startedAt: `${addDays(today, 3)}T12:00:00.000Z` });
    // A run that never finished has no later days to keep.
    const running = { ...finished, done: finished.done.slice(0, 45) };
    const r = repeatFortnight(running, chapter(5), readings, new Date(`${today}T12:00:00Z`));
    expect(r.done).toEqual(finished.done.slice(0, 28));
    expect(r.until).toBeUndefined();
    expect(r.later).toBeUndefined();
  });

  it("keeps the fortnight's end when a running go-back happens inside it", () => {
    const { back, readings, today } = finishedThenBack(5);
    const further = repeatFrom(back, 14, readings, new Date(`${addDays(today, 2)}T12:00:00Z`));
    expect(further.done).toHaveLength(14);
    expect(further.until).toBe(42);
    expect(further.later).toEqual(back.later);
    expect(programToday(program, further, addDays(today, 2))).toEqual({ status: "todo", index: 14, completed: 14 + total - 42 });
  });

  it("drops a stored fortnight it cannot vouch for, and the run carries on to its last day", () => {
    const { back } = finishedThenBack(5);
    const raw = JSON.parse(JSON.stringify(back));
    const revived = (patch: object) => reviveProgress({ ...raw, ...patch })!;
    for (const patch of [
      { later: raw.later.slice(1) },
      { later: raw.later.map((d: { index: number }, k: number) => (k === 3 ? { ...d, index: 0 } : d)) },
      { later: raw.later.map((d: { day: string }, k: number) => (k === 3 ? { ...d, day: "2026-99-99" } : d)) },
      { until: total },
      { until: 41.5 },
      { until: 20 },
      { later: undefined },
    ]) {
      const r = revived(patch);
      expect(r.until, JSON.stringify(patch).slice(0, 60)).toBeUndefined();
      expect(r.later).toBeUndefined();
      expect(r.done).toEqual(back.done);
    }
  });

  it("runs a fortnight that ends on the last day on to it, with nothing kept after", () => {
    const { finished, readings, today } = finishedThenBack(5);
    const last = program.chapters!.at(-1)!;
    expect(last.toWeek * 7).toBe(total);
    const back = repeatFortnight(finished, last, readings, new Date(`${today}T12:00:00Z`));
    expect(back.done).toHaveLength(chapterStartIndex(last));
    expect(back.until).toBeUndefined();
    expect(back.later).toBeUndefined();
  });
});

