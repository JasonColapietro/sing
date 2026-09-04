# Competitor parity matrix — Suede Sing web + Suede Voice iOS 1.6

Date: 2026-09-04. Sources: Yousician support articles (learning path; Practice and
Play modes; calibrating; song search), Yousician singing page, American Songwriter
reviews of Yousician and Simply Sing and its 2026 roundup, Simply Sing product page
and App Store listing, sing.salon and singalong.net Simply Sing reviews, Singeo home
and Musician Wave review, docs/research/singeo-warmup-parameters.md (measured).
Web inventory read from origin/main c5ffb0e; iOS from origin/sing/v1.0 2b94324
(1.6 build 23, in review 2026-09-04).

Legend: ✓ present · ◐ partial · ✗ missing · — not applicable / deliberately skipped.

## Onboarding and calibration

| Mechanic | Source | Web | iOS |
|---|---|---|---|
| Range calibration by sliding down to lowest comfortable, then up to highest | Yousician | ✓ /range | ✓ RangeTest |
| Voice type from range | Simply Sing, Yousician | ✓ | ✓ |
| Onboarding quiz (genres, favourite singers) feeding song picks | Simply Sing | ✗ | ✗ |
| Recalibrate any time from settings | Yousician | ✓ | ✓ |

## Practice screen (Yousician is the reference)

| Mechanic | Source | Web | iOS |
|---|---|---|---|
| Notes flow right-to-left toward a playhead; own pitch vs reference | Yousician, Simply Sing | ✓ highway-canvas | ✗ PitchGauge only |
| Sing-along by default, guide under the voice, guide-level slider | Yousician "Vocals" | ✓ | ✗ call-and-response only (PracticeViewModel: countIn → playingReference → listening) |
| Count-in on the audio clock | Yousician | ✓ | ✓ |
| Full-screen session shell, results screen with stars/XP/goal/streak | Yousician | ✓ PR #123 | ◐ RoutineResultView, no stars, no daily goal |
| Steps that advance themselves in a routine | Singeo, Yousician | ✓ | ✓ |

## Songs (Yousician Practice and Play modes; Simply Sing session)

| Mechanic | Source | Web | iOS |
|---|---|---|---|
| Practice mode restarts at the end so you keep practicing | Yousician | ◐ loops (defaultLoops / 4 for a section) | ◐ |
| Auto tempo: app raises or lowers speed from how you sing, 25–125 % in 5 % steps; manual slider too | Yousician | ✗ four fixed tempos (50/75/100/125) | ✗ |
| Transpose; auto-transpose to calibrated range | Yousician, Simply Sing | ✓ fitTransposeToRange | ✓ |
| Guide-vocal and own-voice volume | Yousician | ✓ Mixer guidePct | ◐ |
| Loop any section with sliders on the progress bar | Yousician | ◐ section picker, fixed 4 loops | ✗ |
| Record and review inside the song | Yousician, Simply Sing "Recording Studio" | ✗ (separate /recorder) | ✗ |
| Play mode: stars + points, multiplier starts 3× and climbs to 5× with correct notes and timing | Yousician | ◐ grade/stars/XP/maxCombo, no multiplier, no mode split | ✗ |
| Staged session: lyrics read → demo in your key → sing with vocals → solo | Simply Sing | ✗ listen mode is unscored only | ✗ |
| Pass threshold → song "mastered"; levels Basic→Easy→Medium→Hard→Extreme unlocked by XP | Simply Sing | ◐ Easy/Medium/Hard labels, best %; no pass/mastered, no unlock ladder | ✗ |
| Breath cues in the lyric line ("when to hold a note and when to breathe") | Simply Sing | ✗ | ✗ |
| Playlists / setlist; recently sung | Simply Sing | ✓ | ✗ |
| Real licensed songs | all | — (public-domain phrases; licensing) | — |

## Learning path and content

| Mechanic | Source | Web | iOS |
|---|---|---|---|
| Path as levels of missions; every task in a mission must be sung to complete it; path unlocked to skip | Yousician | ◐ PathList tiers with stars, no mission completion state | ✗ list only |
| Chase the Notes: sing back short melody segments that build to the mission's song | Yousician | ◐ melody-echo game exists, not tied to songs | ◐ |
| Note Catcher: paddle moved by singing, gems right-to-left, speeds up, ends on a miss | Yousician | ✗ | ✗ |
| Fixed routines 5–20 min (quick → full), pitch and range routines | Singeo | ✓ six routines + Pro | ✓ two fixed routines |
| Measured Singeo exercise shapes, note lengths, rep counts | Singeo videos | ✓ 13 exercises | ✓ 13 exercises |
| Workouts by topic (ear, breath, voice health) | Yousician, Singeo | ✓ rooms | ✓ |
| 10-level method / courses with video | Singeo | ◐ /book text chapters | ◐ Book |
| Three personalised exercises a day, difficulty adapting to performance | Vanido | ◐ "Today's warmup" by hour/practised-today only | ◐ |

## Motivation loop

| Mechanic | Source | Web | iOS |
|---|---|---|---|
| XP, levels with titles | Simply Sing, Singeo | ✓ 60 levels | ✗ |
| Streaks, badges | Yousician, Simply Sing | ✓ | ✓ streak, ◐ achievements |
| Daily goal ring | Yousician-style | ✓ | ✗ |
| Weekly activity report: stars, notes sung, singing time | Yousician (Monday email) | ✗ | ✗ |
| Free tier: daily minutes | Yousician | ✓ 3 min/day | ✓ 180 s/day |

## Slices, in order (each is one graph-flo-xr run on sing; iOS follows)

1. Songs: Practice and Play modes — auto tempo (25–125 %, 5 % steps, driven by
   the last loop's score), practice restarts at the end, section loop, play-mode
   points multiplier 3×→5× shown live, stars on the summary.
2. Songs: Simply Sing session — Listen (demo in your key) → Sing with the guide →
   Solo; pass threshold → "Mastered" kept per song; level ladder over the existing
   difficulty; unlocked by XP.
3. Path: mission completion — a tier completes when every exercise has been sung;
   the next tier's "Next up" moves; weekly report card on /progress.
4. Today's warmup adapts: routine picked from recent scores (Vanido), not the hour.
5. iOS parity for 1–4 plus the highway and sing-along default (needs the pack's
   base-ref fix or direct implementation: suede-voice's default branch is sing/v1.0).

## e2e baseline (origin/main, mobile-375, dev server on :3010)

blocker 0 · major 179 · minor 75. 171 majors are the runtime audit's internal-link
prefetch aborting under the dev server (LINK_FETCH_TIMEOUT); same routes answer in
0.4–0.7 s by curl locally and on production. Real majors: the "Pro" chip and the
"Monthly · $4.99" toggle (ink on violet, 4.05:1 at 10–11 px), Clerk's show-password
icon (third-party), and "Morning reset" misread as destructive by the states audit.
