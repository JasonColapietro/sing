# Practice parity continuation — 2026-09-05

Recovered from the unfinished second web slice at `05506b0` and the staged third/fourth slice scopes. Original changes remain preserved in `sing.worktrees/ship-cc60b025-51dd-41f5-9352-4d3a5cc27a20`.

## Web behavior

- Songs offer Listen, Sing along, and On your own passes; solo performance mastery opens successive difficulty bands. Entry checks cover cards, deep links, setlists, recents, and surprise selection. The mastered-id store is device-local, like song favorites; it is not part of account progress backup.
- Mastery requires a whole-song solo performance without changing pass or switching to rehearsal. Raising the guide in solo changes the pass to Sing along and invalidates mastery. Listen passes remain unscored.
- Audio callback refs update after React commits rather than during render. Existing scoring and scheduling remain in place.
- Warmup, ear, and breath paths show sung-of-total and completion using the shared PathList. A warmup Continue card points to the same first unstarred exercise as the path.
- Progress compares the current Monday-based week so far with the complete previous week. Time and sessions include unscored activity; score stars use the three-star 50/75/90 thresholds.
- The last three scored warmups choose a shorter/slower or longer/faster routine. Morning reset and same-day top-up retain priority. A routine freezes its starting tempo across steps; singers retain the existing tempo controls.

## Verification

- Unit suite: 692 passed, 5 skipped (65 passing files, one skipped file), with two workers to avoid resource-contention timeouts.
- Songs browser journey: performance, rehearsal, Auto tempo, pass switching, solo guide level, summaries, difficulty locks and seeded mastery unlocks passed using a synthetic silent microphone. This does not prove real microphone accuracy.
- Mobile warmups/progress at 390 px: recommendations, next exercise, tier counts, weekly totals, no horizontal overflow or page errors; screenshots inspected.
- Typecheck/lint and production build: see PR checks for the final authoritative result. Local Turbopack hit font-network and subprocess-port restrictions. The development-server runtime audit reported internal-link fetch timeouts during route compilation; these must be checked against a production build/live routes, not silently counted as passes.

## Native lane remains separate

The existing native worktree is `code/suede-voice.worktrees/parity-20260904` at `2b94324`, tracking `origin/sing/v1.0` from `Suede-AI/suede-voice`. It was inspected, not changed by this web continuation. Its song player currently plays reference notes without opening a microphone, so matching web song scoring requires audio integration, not only a screen change.

The staged iOS design calls for rewards and goals, a note highway, sing-along/frame scoring with latency compensation, and song modes. It explicitly holds App Store shipping while the existing 1.6 submission is in review; refresh store state before release work. Physical-device speaker/echo cancellation and quiet-voice testing are required before claiming native acoustic parity.
