# Singeo warm-up parameters, measured from the recordings

Date: 2026-09-03. Method: the audio of Singeo's two public warm-up videos was
pitch-tracked (harmonic product spectrum over 4096-sample frames at 22.05 kHz,
stable notes ≥120 ms, phrases split at 0.7 s gaps) and the piano guide read
off the stable-note stream. Speech and the intro music are noisy and were
ignored; sirens are glides and do not register. Numbers below are the
recording's, rounded. The audio is not kept in the repo (it is Singeo's);
`singeo-pitch-track.py` beside this file is the tracker, and reproducing the
table takes `yt-dlp -x --audio-format wav --postprocessor-args "ffmpeg:-ac 1 -ar 22050"`
on the two video ids, numpy + scipy, and `python singeo-pitch-track.py file.wav`.
The long phrases (over 15 s) in its output are the piano guide; read the rep
roots off them.

Sources: "Easy Singing Warm Up (7 minutes)" `youtube.com/watch?v=fJCfHHLf2Pg`
(10:05 with talk) and "COMPLETE 10-Minute Vocal Warm UP" `youtube.com/watch?v=rYsuVwyGe-4`
(11:16 with talk). Written descriptions: singeo.com/chorus/easy-singing-warm-up
and singeo.com/chorus/complete-10-minute-vocal-warm-up.

## Easy 7-minute warm-up

| # | Exercise (Singeo) | Pattern (scale degrees) | Notes | Note length | Keys | Reps | Piano time |
|---|---|---|---|---|---|---|---|
| 1 | The Bubble (lip trill) | 1-3-5-8-5-3-1 | 7 | 0.42 s (last ~0.9 s) | A3 → E4 by half-steps, back to A3 | 15 | 1:03–2:57 |
| 2 | The Straw | 1-2-3-4-5-4-3-2-1 | 9 | 0.46 s (last ~1.0 s) | A3 → F4, back to A3 | 17 | 3:35–5:19 |
| 3 | Letter N | 1-3-5-8-10-12-11-9-7-5-4-2-1 | 13 | 0.30 s | G3 → C#4, back to G3 | 13 | 6:03–7:26 |
| 4 | Letter V | 1-3-5-8-5-3-1-3-5-8-5-3-1 | 13 | 0.30 s | A3 → F4, back to B3 | 14 | 7:48–9:17 |

## Complete 10-minute warm-up

| # | Exercise (Singeo) | Pattern | Notes | Note length | Keys | Reps | Piano time |
|---|---|---|---|---|---|---|---|
| 1 | Sirens | glide, low→high→low | — | — | — | — | not tracked |
| 2 | Bubble | 1-3-5-8-5-3-1 | 7 | 0.28 s | E3 → D4, back down | ~22 | 1:20–3:05 |
| 3 | Raspberries | 5-4-3-2-1 | 5 | 0.60 s | C4 **down** to G3 | 7 | 3:10–3:56 |
| 4 | Hung-ee-mm | (1-2-3-4-5-4-3-2-1) × 3 on one breath | 25 | 0.30 s | A3 → D4, back to A3 | 11 | 4:20–6:50 |
| 5 | Hoo | 8-5-3-1 | 4 | ~1.0 s | B3 **down** to F3 | 7 | 6:58–7:49 |
| 6 | Gug (staccato) | 1-3-5-8-10-12-11-9-7-5-4-2-1 | 13 | 0.25 s | G3 → C4, back to G3 | 11 | 8:01–9:15 |
| 7 | Puffy cheeks | 8-5-3-1, slow | 4 | ~1.0 s | Eb4 **down** to G3 | 7 | 9:39–10:28 |

## What this changed in the catalogue

- `lip-trill-scale` became the bubble arpeggio (1-3-5-8-5-3-1, 0.42 s), not a
  five-note scale.
- `n-hum-scale` and `gug-staccato` became the 13-note run (up the arpeggio to
  the 12th, down the scale) at 0.30 s and 0.25 s.
- `hung-ee-mm` became three five-note passes in one breath at 0.30 s.
- `hoo-four-note` became the slow 8-5-3-1 that descends by key; the duplicate
  `hoo-descending-arpeggio` was removed.
- `tongue-trill-descent` descends by key from the top of the band.
- `WarmupExercise.ladder: "down"` was added and the player reverses the root
  ladder for it.
- Routine rep counts now match the recordings; the Quick routine is the
  7-minute warm-up exercise for exercise; the Daily routine is the 10-minute
  one with our sirens in front and a slow descent standing in for puffy cheeks.

Keys are not copied: Singeo's are fixed for the coach's voice, ours are fitted
to the singer's measured range, which is what Singeo's own calibration advice
says the exercise should do. The climb depth (reps) is copied.
