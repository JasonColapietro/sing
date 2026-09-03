import { SONGS } from "@/components/songs/data";
import { computeDifficulty, fitTransposeToRange, rangeFit } from "@/components/songs/lib";
import { computeRootLadder, EXERCISES } from "@/components/warmups/exercises";
import type { PopFit } from "./pop-songs";
import type { VocalRange } from "./progress-shape";

interface PracticeStep {
  href: string;
  label: string;
  reason: string;
}

const PRO_CONTEXT: Record<Exclude<PopFit["verdict"], "unknown">, string> = {
  fits: "As you log scored song practices, Pro shows your full practice history and adds accuracy by note across sessions. This range comparison is not a scored song attempt.",
  high: "For more upper-register exercises, Pro adds the Head-voice builder warmup pack. It does not guarantee higher notes or make this song fit.",
  low: "After you log scored practice, Pro opens the full daily plan built from your notes and recent sessions. A song sitting too low does not, by itself, identify a technique problem.",
  wide: "Pro charts your saved range tests over time. Retest on another day to compare measurements; one test cannot show a trend or promise range growth.",
};

/** The comparison describes note bounds, never measured technique or a song performance. */
export function songFirstPractice(fit: PopFit, range: VocalRange): {
  free: PracticeStep;
  pro: string;
} | null {
  const { lowMidi, highMidi } = range;
  if (fit.verdict === "unknown" || lowMidi === undefined || highMidi === undefined) return null;

  // A single comfortable note is still a useful first practice if neither a
  // transposable song nor a ladder with its normal headroom fits this range.
  let free: PracticeStep = {
    href: "/studio",
    label: "Try one note free",
    reason: "Start with one comfortable note in the pitch studio and watch the live pitch trace. Keep it easy; you do not need to reach either edge of your saved range.",
  };

  if (fit.verdict === "fits") {
    // Short, easy FREE phrases only. Check the player's actual ±12-semitone
    // transposition limit, rather than promising every song can fit every voice.
    const practiceSong = SONGS.filter((song) => {
      const shift = fitTransposeToRange(song, range);
      return song.form === "phrase" && computeDifficulty(song).label === "Easy" &&
        shift !== null && rangeFit(song, range, shift).verdict === "fits";
    }).sort((a, b) => computeDifficulty(a).score - computeDifficulty(b).score)[0];
    if (practiceSong) {
      free = {
        href: `/songs?song=${practiceSong.slug}`,
        label: `Practice ${practiceSong.title} free`,
        reason: `The notes fit on paper; now try keeping a short phrase steady. Start with ${practiceSong.title}, a different, public-domain melody with live pitch feedback. Choose “Fit to my range” before pressing Play.`,
      };
    }
  } else {
    const candidates = fit.verdict === "high"
      ? ["ng-siren-fifth", "morning-lip-trill"]
      : fit.verdict === "low"
        ? ["descending-five", "morning-sigh"]
        : ["humming-thirds", "morning-hum"];
    const exercise = candidates.map((id) => EXERCISES.find((ex) => ex.id === id)).find((ex) => {
      if (!ex) return false;
      const notes = computeRootLadder(ex, lowMidi, highMidi)
        .flatMap((root) => ex.buildSteps(root).flat());
      // The ladder's minimum-root fallback can exceed a narrow saved range.
      // Keep the room's four-semitone floor / five-semitone ceiling margin.
      return Math.min(...notes) >= lowMidi + 4 && Math.max(...notes) <= highMidi - 5;
    });
    if (exercise) {
      const reason = fit.verdict === "high"
        ? "Start with a gentle slide up and back inside your saved range. Keep the upper notes light; this is preparation, not a test of the song’s highest note."
        : fit.verdict === "low"
          ? "Start with an easy descending pattern inside your saved range. Let the notes settle without pressing for the song’s lowest note."
          : "Start with a small pattern your saved range can hold. A key change moves every note equally, so it cannot make a song’s span narrower.";
      free = { href: `/warmups?exercise=${exercise.id}`, label: `Try ${exercise.title} free`, reason };
    }
  }

  return { free, pro: PRO_CONTEXT[fit.verdict] };
}
