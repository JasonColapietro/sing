# Warmup routines — design

Date: 2026-09-03. Status: shipped in the same PR as this note.

## The complaint

Jason, after a session in the live app: the exercises are unintuitive, the wait
times are all over the place, and it does not feel premium. Make it match
Singeo, taking the best of the apps in American Songwriter's roundup.

## What the code was doing

- `/warmups` was a 17-card grid of single exercises in three tiers, plus two
  Pro packs. Nothing said which to do first, how many to do, or when a session
  was over.
- Each exercise was an *endless* ladder: it climbed to the top of the range,
  walked back down, and only stopped when the singer pressed End or went silent
  for two reps. The card's "~N min per climb" never matched what happened.
- The count-in before each scored window was two beats of the exercise's own
  note length, floored at 0.8s but never capped. A fast scale waited 0.8s; the
  3.5-second sustained hold waited **7 seconds** of nothing. Moving between
  neighbouring exercises felt random.
- Every control (mode, guide level, click, play reference, transpose, tempo,
  skip, end) sat on screen at once, under a page-sized h1.
- "Next exercise" after a summary was the next card in array order.

## What Singeo and the roundup do that we did not

From the research pass (Singeo, Yousician Sing, Vanido, Simply Sing, 30 Day
Singer): one obvious start-here path; warmups at several lengths (quick to
full) that a singer commits to up front; steps that advance themselves; a
clear completed / not-completed state; XP and streaks framing the whole loop;
a summary at the end. Singeo has no real-time pitch analysis at all, which is
the one thing this room already does better.

## Design

**Exercise coverage.** Singeo's own blog documents its two flagship
routines exercise by exercise (the "Easy 7-minute": bubble, straw, N, V; the
"Complete 10-minute": sirens, bubble, raspberries, hung-ee-mm, hoo, gug, a
melody), plus a healthy-voice set (VVV scale, FOO arpeggio, HOO descending
arpeggio), a range set (reverse arpeggios, five-note pattern) and the speed
challenge (five-note runs on "mum" with a metronome). Thirteen of those
mechanics were missing here and are now free exercises in
`components/warmups/exercises.ts`: lip-trill scale, straw scale, N-hum scale,
four-note hoo, tongue-trill descent, hung-ee-mm scale, staccato gug, V double
arpeggio, hoo descending arpeggio, reverse arpeggio, agility run, pentatonic
run, gee to the octave. Not carried over, because a pitch detector cannot
score them: the hissing breath drill (the /breath room has it), physical
stretches, vocal fry, dynamics-only work, and harmony. Puffy-cheek melody
following is the /songs room.

**Routines.** `components/warmups/routines.ts` defines fixed sequences of
existing exercises with a bounded rep count each. Quick (~5 min) follows the
7-minute Singeo order; Daily (~10) follows the 10-minute one; Full (~15)
extends it with arpeggios and a run; Morning reset (~4) keeps the old morning
pack; Range builder and Agility and runs (~6 each) stand in for Singeo's range
and riff workouts. The two Pro packs become Pro routines, built from
`PRO_PACKS` rather than restated. Durations are computed from the same
`planRep` arithmetic the player schedules with, so the minutes on the card are
the minutes the singer gets. Rep counts, note lengths, pattern shapes and
ladder directions were then measured from the piano guide in Singeo's two
public warm-up videos (`docs/research/singeo-warmup-parameters.md`), so Quick
is the 7-minute warm-up exercise for exercise and Daily the 10-minute one.

**Bounded player.** `ExercisePlayer` takes an optional `bounds` prop
(`{ reps, stepIndex, stepCount }`). With bounds, the step completes itself
after `reps` reps (sung or skipped), shows "Rep k of N" and a real completion
bar instead of ladder height, and hides the Exit button because the runner
owns the session. Without bounds the room behaves as before for deep-linked
single exercises.

**Consistent count-in.** `leadSec` is now clamped to `[0.8, 2.0]` seconds. The
lead stage shows the two beats filling on screen, so the wait is visible as
well as bounded.

**Fewer controls.** The player shows Play reference, Skip rep and End. Mode,
guide level, click, transpose and tempo live under one "Adjust" disclosure.

**Runner.** `RoutineRunner` walks the steps: an intro card per step (title,
tip, reps, seconds, previous step's score) that starts itself after 4 seconds
or on tap, the bounded player, and a routine summary at the end (grade,
average, XP, per-step rows, share card, "Practice again"). Each step still
logs one warmup session, so streaks, achievements and the coach are unchanged.

**Room home.** `/warmups` opens on "Today's warmup" — the routine
`recommendRoutine` picks for this moment (quick if already practised today,
morning before 10am, daily otherwise) with one Start button — then the
routine cards, then the full exercise library under a disclosure. Deep links
`?exercise=<id>` and `?routine=<id>` both work.

## Out of scope, deliberately

Video lessons, a leveled "Method" curriculum, and community coaching. The
question of offloading voice lessons to a guitar property was raised and
answered no: GuitarHub is sunset (serves Suede Social), Strumly's lesson
engine is guitar-shaped, and Suede Voice on iOS is this app's companion and
inherits whatever the web practice loop becomes.
