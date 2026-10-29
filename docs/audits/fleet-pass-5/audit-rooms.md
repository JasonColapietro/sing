# Fleet pass 5 · Rooms lane (progress, recorder, programs, tools, analyze, songs, range result) + pass-4 regressions

Read-only audit of `fleet-pass-5` (= main at ef801f4, pass 4 #263 + round 15 #262). Nothing in /home/user/sing was edited. Every claim is tied to a file:line.

---

## 1. Status of pass-4 findings

| Pass-4 finding | Status | Evidence |
|---|---|---|
| P1 Ear routine not sized to allowance | **FIXED** | `components/ear/ear-training-client.tsx:137` now calls generic `sizeToAllowance` (`lib/free-cap.ts:49`), as warmups `:219` and breath `breath-studio.tsx:185` do. |
| P1 Three hand-copied runners / StepIntro drift | **FIXED (with new drift, see Bugs B4 and P2-3)** | `components/practice/step-runner.ts` (`useStepRunner`) and `step-intro.tsx` (`StepIntroSlide`, `ROUTINE_LABELS`) are used by `warmups/routine-runner.tsx:138,230`, `ear/ear-runner.tsx:222,260`, `breath/breath-runner.tsx:330,364`. Close label, skip label and bar colour are now one. Left over: breath passes no `prev` chip (`breath-runner.tsx:364-383`), ear/breath show no "~N min left" clock for Pro (only `earIntroFreeLeft`/`breathIntroFreeLeft`), and the in-step X still means three different things (P2-3). No unit test pins `useStepRunner` or `StepIntroSlide` directly (only `practice/cap-controls.test.tsx` touches the new files). |
| P1 Dead "page" variants | **FIXED** | No `variant="page"` branches remain; `ShellMicGate` is gone (no grep hits). |
| P1 /songs longest first-note path / taste quiz first | **FIXED, but introduced Bug B1** | `songs/library.tsx:503,698` puts the quiz under the first band for a first visit; card Sing auto-starts (`library.tsx:688`, `song-player.tsx:1263-1268`); gate offers "Pick a song first" (`mic-gate.tsx:66`). The last two combine badly (B1). |
| P1 Pro asks stack 3–5 deep | **STILL OPEN** | Range result still renders free-plan paragraph (`result-view.tsx:798-805`) + `ProInlineNudge`/`ProCrescendoNudge` (`:987-996`) + `LockedPanel` (`:1036`). Recorder renders `LockedPanel` (`recorder-page.tsx:1181`) **and** `ProInlineNudge` "Pro analyzes the pitch of every take" (`:1355`) for the same feature once a take exists. No `<ProSlot>`. |
| P2 Studio gate names a room that does not exist | **FIXED** | `studio-client.tsx:411-412` "See your pitch live" + tuner description. |
| P2 Five mic gates / breath copies lost MicAlert | **FIXED** | `ui.tsx:495-588` `MicGate` has `tone="session"` and `MicAlert`; used by `breath-cue-drill.tsx:332`, `sustain-test.tsx:424`, ear games. |
| P2 `AudioSetup` missing in ear/breath | **STILL OPEN** | `MicGate` gained an `audioSetup` slot (`ui.tsx:520`) but no session caller passes it (grep `audioSetup=`: zero hits). Also missing in /analyze entirely (P2-4). |
| P2 Dead ends after a result | **PARTLY** | (a) studio Stop card FIXED (`studio-client.tsx:358-394`) but its copy is now wrong (B2); (b) range "microphone stopped" FIXED (`range-test.tsx:715-719`); (c) capped Sing again demoted FIXED (`songs/session-summary.tsx:497-511`), except the silent-run setlist branch (`:477-484`) keeps a violet "Sing again" with no `aria-disabled`; (d) recorder "Next" card FIXED (`recorder-page.tsx:953-970`); (e) ear share URL **STILL OPEN** (`ear-runner.tsx:161` `url: ${SITE_URL}/ear-training`). |
| P2 Cap controls triplicated / reason written four times | **PARTLY** | `practice/use-capped-start.ts` adopted by warmups/ear/breath. `songs/songs-client.tsx:86-93` still defines its own `CAPPED_REASON` and `showCapWall()` byte-for-byte, and `:213-217`, `:478-481`, `:493-496` hand-guard. |
| P2 Terminology drift (table) | **PARTLY** | Runner verbs unified (`ROUTINE_LABELS`), ear "workout" → routine in UI copy. Remaining drift in the table below (in-step exits, restart verbs, analyzer names, "Studio tools"). No `lib/practice-copy.ts` and no lint test. |
| P2 Recorder has four names | **PARTLY** | Kicker "Recorder" (`recorder-page.tsx:749`), rail "Recorder", TakeReview "Save to the recorder". Still "Take recorder" at `app/tools/page.tsx:37`, `app/learn/page.tsx:92`, `components/landing/comparison.tsx:23`; "the take recorder" at `app/progress/page.tsx:38-41`, `app/tools/page.tsx:69`, `app/voice/page.tsx:158`, `lib/guides.ts:552`. |
| P3 Icons triplicated | **STILL OPEN** | `components/{recorder,songs,warmups}/icons.tsx` all present; no `components/icons.tsx`; songs/warmups md5 differ only by their extra icons. `step-intro.tsx:14-29` adds a fourth `PlayIcon`/`SkipIcon` pair, `ui.tsx:461` `MicGlyph` a further mic. |
| P3 Session summaries: SavedCard / ScoreBars / SummaryActions | **STILL OPEN** | `scoreTone` at `songs/session-summary.tsx:29` and `warmups/session-summary.tsx:72`; `TONE_TEXT` at songs `:35`, `result-card.tsx:16`, warmups `:78`; saved card at songs `:442-466`, warmups `~:371`, range `result-view.tsx:704-723`. None extracted. |
| P3 Routine helpers duplicated | **PARTLY** | Sizing is generic (`lib/free-cap.ts:49`). `routineById`/`earRoutineById`/`breathRoutineById`, `*Seconds`, `*Minutes`, `recommend*` remain per room (`warmups/routines.ts:225,273,305`, `ear/routines.ts:158-192`, `breath/routines.ts:186-247,404`). Acceptable. |
| P3 Warmups home ~38 starts | **PARTLY** | Newcomer catalogue folded in two `<details>` (`warmups-client.tsx:745-766`); this fold broke the /pro post-purchase link (B3). Returning singers still get the full grid + path. |
| P3 Ear card did not warn about the mic | **FIXED** | `ear-training-client.tsx:68-72` appends "· mic at step N". |
| P3 RoutineCard primitive | **STILL OPEN** | Warmups whole-card `<button>` with caption "Pick a length, press start" and no start control (`routine-home.tsx:156,172`); ear whole-card button (`ear-training-client.tsx:269`); breath visible outline button (`breath-studio.tsx:308`). |

---

## 2. Bugs found

### B1 (P1) · "Pick a song first" drops a newcomer into an unscored listen run with no mic ask
`components/songs/mic-gate.tsx:53-66`, `components/songs/songs-client.tsx:340-345`, `components/songs/library.tsx:688`, `components/songs/song-player.tsx:1263-1268,1101`

1. Cold visit to /songs, no deep link. The gate shows "Enable microphone" and "Pick a song first". The comment says "the player asks for the mic at Play" (`mic-gate.tsx:52`).
2. Singer taps "Pick a song first". `onListen` runs `setPass("listen"); setListenMode(true)` (`songs-client.tsx:343-344`): the room is now in listen mode with the guide-only pass.
3. Library opens. Singer taps a card's "Sing". Pass 4 made that call `start(song, true)` (`library.tsx:688`), so the player mounts with `autoStart` and the effect at `song-player.tsx:1263-1268` calls `beginSession(pass)` immediately.
4. `scoringRef.current = listening && nextPass !== "listen"` (`:1101`) is false: the count-in runs, the guide plays alone, the header shows "Listen mode", and the only mic control is "Pause to turn it on" (`micOffPrompt`, `:100-102`). There is no "Play" moment where the mic is asked.
5. Result: the newcomer's first song is an unscored guide playback. Getting scored takes Pause → "Enable microphone and restart". The run also writes a summary (and a logged session) in listen mode.

**Fix:** treat "Pick a song first" as deferral, not as listen mode. Add a `deferMic` state instead of `setListenMode(true)`/`setPass("listen")`, and in `startSong` (`songs-client.tsx:213`), when `deferMic && !micAllowed`, call `pitch.start()` on the card press (the press is the user gesture) before mounting; fall back to listen mode only if the singer refuses. Keep "Continue without a mic" (deep link) as today. Alternatively, pass `autoStart=false` while `listenMode` is true so the player opens on the "Enable microphone" line. **Effort:** S. **Tests:** `song-player-mic.test.tsx` + `library-visit-unlock.test.tsx`: "Pick a song first → card Sing requests the mic, and the run starts scored"; e2e `song-first-practice.mjs` path via "Pick a song first".

### B2 (P2) · Studio "Last session" card promises "Sing again adds to the time", then Sing again throws the time away
`components/studio/studio-client.tsx:368`, `:278-291`, `:138-143`

1. Enable the mic, sing 30 s, press Stop. `finishStudioSession` sees 30 s < `MIN_LOG_SEC` and returns `{ log: null, locks }` without resetting, banking the seconds "for the next flush" (`:138-143`).
2. The new card reads "That one ran under 45 seconds, so it wasn’t logged. Sing again adds to the time." and the gate button is labelled "Sing again" (`:414`).
3. Press "Sing again". `handleStart` runs `practiceClock.reset()`, `statsRef.current = emptyTargetStats()`, `heardMsRef.current = 0` (`:281-284`).
4. Sing 30 s more, Stop: again "under 45 seconds". The promised accumulation never happens; the locks banked in step 1 are lost too.

**Fix:** in `handleStart`, reset only when the last result was logged or silent: `if (!toast || toast.log || toast.silent) { practiceClock.reset(); statsRef.current = …; heardMsRef.current = 0; }`, and keep `elapsed` at the banked seconds. Or drop the sentence. **Effort:** S. **Tests:** `studio-client.test.tsx`: two 30 s stretches separated by Stop / Sing again log one ≥ 45 s session; a short stop's locks survive a Sing again.

Related (same card, P3): the card prints `fmtTime(elapsed)` (`:365`), which is the 1 Hz display tick, not the logged `durationSec`; it can read one second short of what was saved. Use `toast.log.durationSec`.

### B3 (P2) · Post-purchase "Sing your first pro warmup" lands nowhere for a buyer who has not warmed up
`components/warmups/warmups-client.tsx:745-766`, `components/warmups/routine-home.tsx:148`, `lib/pro-inventory.ts:79-80`, `components/pro/pro-client.tsx:538,950`

1. A buyer finishes checkout on /pro. The thank-you block's primary button is `LinkButton href="/warmups#pro-packs"` (`pro-client.tsx:538`), a `next/link`.
2. The `#pro-packs` id sits on the first Pro routine card inside `RoutineGrid` (`routine-home.tsx:148`).
3. Pass 4 folded `RoutineGrid` into a closed `<details>` ("All routines") whenever `newToWarmups` (`warmups-client.tsx:490,749`). A buyer who has never logged a warmup is exactly that singer; the server HTML is also always the newcomer branch.
4. The client router's hash scroll skips elements with an empty bounding box (content of a closed `<details>`), so the page stays at the top. Safari also does not auto-open `<details>` on fragment navigation. The buyer sees the free "Start here" card and no Pro packs.

**Fix:** in `WarmupsClient`, read `location.hash` on mount (and on `hashchange`); when it is `#pro-packs` (or any id inside the fold), make the "All routines" `<details>` `open` (controlled `open` state) and then `scrollIntoView`. Or render the grid unfolded when `isPro`. **Effort:** S. **Tests:** `warmups-client.test.tsx`: newcomer with `location.hash="#pro-packs"` renders the routines `<details open>`; e2e `navigation.mjs`: /pro thank-you → Pro pack card in viewport.

### B4 (P2) · The X inside a routine step does three different things, and two labels lie
`components/ear/ear-runner.tsx:299`, `components/ear/session.tsx:134`, `components/breath/breath-runner.tsx:394`, `components/breath/box-breathing.tsx:225-238`, `components/warmups/exercise-player.tsx:920`

1. Warmups routine, step 2 playing: the X is labelled "Finish step"; it calls `closeStep(step, null)` and the next intro slide comes up.
2. Breath routine, step 2 playing: the X is labelled "Exit drill"; it calls `runner.closeStep(phase.step, null)` (or `endEarly` while running), so the routine **continues** to the next slide. The label says exit.
3. Ear routine, step 2 playing: the X is labelled "Exit game"; it calls `quit()` (`ear-runner.tsx:299`), which **ends the whole routine** on the results screen (or leaves the room with nothing played) and throws away the rounds of the game in progress.
4. Escape does the same as the X in each case (`session-shell.tsx:124`). The shared hook kept these differences because the step components own the X.

**Fix:** decide one meaning inside a routine: the X on a step ends that step and moves on (warmups/breath), label it "End step" in all three, and let only the slide's "Exit routine" leave. In ear, pass `onExit={() => runner.closeStep(phase.step, partialOrNull)}` and give `GameShell` a `closeLabel` prop ("End step" in a routine, "Exit game" alone). **Effort:** S. **Tests:** one table test over the three runners: press the step's close control → next slide shows `Up next`, results row says "Skipped"; the slide's "Exit routine" → results.

### B5 (P3) · Metronome beat glow never renders: Tailwind arbitrary values contain spaces
`components/tools/metronome.tsx:235-236` (from pass 3, #261)

`"shadow-[0_0_12px_rgba(157, 63, 51,0.75)]"` splits on whitespace into three invalid class names, so the current-beat dots have no glow. **Fix:** `shadow-[0_0_12px_rgba(157,63,51,0.75)]` (no spaces) or a token. **Effort:** XS. **Test:** a grep test that no `className` string contains `\[[^\]]* [^\]]*\]`.

### B6 (P3) · Step titles are not announced when a slide changes
`components/practice/step-intro.tsx:180`

Each slide remounts (keyed by step), so the `aria-live="polite"` on the `<h2>` is a brand-new live region whose initial text most screen readers do not announce. Focus goes to the dialog root (`session-shell.tsx:172`), whose `aria-label` is the routine name for every step. A screen-reader user hears "Morning reset, dialog" on each slide and not "Up next: Lip trills". **Fix:** label the shell by the step: pass `aria-describedby` to the step heading id, or focus the `<h2 tabIndex={-1}>` on mount instead of the root. **Effort:** S. **Test:** `session-shell-focus.test.ts`: after `closeStep`, `document.activeElement` is the new slide heading (or the dialog's accessible description includes the step title).

### B7 (P3) · Same "Sing" label, different behaviour in the library
`components/songs/library.tsx:688` vs `:516`, `:557`, `:454`; `components/songs/taste-quiz.tsx:271-272`

A song card's "Sing" auto-starts into the count-in. "Picked for you" uses the same visible "Sing" (`aria-label="Sing <title>"`), but it calls `start(pick.song)` without `autoStart` and opens on Ready/Play. So do Recently sung and Surprise me. **Fix:** pass `true` from PickedForYou and Recently sung; keep the dice and setlist on Play if intended, but then label them "Open". **Effort:** XS. **Test:** `library-visit-unlock.test.tsx`: PickedForYou "Sing" calls `onSelect(song, { autoStart: true })`.

---

## 3. New findings (ranked)

### P1

**P1-1 · Fresh /progress shows four dead-text empty states and three range-test asks** · `components/progress/progress-client.tsx:868,929-1000,1017-1028`, `charts.tsx:225-227,359`, `calendar.tsx:158`, `voice-card.tsx:123-131`
Quoted: "Not enough scored practice yet…", "Nothing to mix yet. Every activity you finish shows up here.", "No practice in the last 12 weeks — today is a good day to start.", "No sessions logged yet", above them FreshStart's "Nothing logged yet". "Find your range" (FreshStart), "Take the range test" (VoiceCard) and the coach's first item all ask for the range test. A newcomer scrolls past five versions of "nothing here", none of which shows what will appear.
**Fix:** for `isFresh`, (a) hide Score trend, Practice mix and Recent sessions entirely (Minutes/day and Achievements already hide, `:946,1006`), (b) replace them with one "What fills in here" ghost card showing three sample figures (see Images), (c) let VoiceCard's empty state drop its button when `isFresh` (FreshStart already carries "Find your range"). **Effort:** S–M. **Tests:** `fresh-start.test.tsx`: a fresh render has exactly one "Take/Find your range" link and no "Nothing to mix yet"/"No sessions logged yet" text; `progress-client.test.tsx` snapshot of section count.

### P2

**P2-1 · The analyzer has six names and no device picker** · `components/analyze/analyze-client.tsx:159-172`, `components/discover/room-rail.tsx:70`, `components/site-footer.tsx:57`, `app/learn/page.tsx:93`, `app/tools/page.tsx:48`, `components/practice/results-screen.tsx:248`
kicker "Analysis", h1 "Live voice spectrogram and tone analyzer", rail/tools "Spectrogram and tone", footer "Voice analyzer", learn "Voice spectrogram", door "See your tone", recorder copy "the analyzer". It is the recorder problem again. The mic ask is a lone header button with no `MicGate`, no `AudioSetup` (every other mic room has one) and, after a failure, still says "Enable microphone" rather than "Try again".
**Fix:** name it "Analyzer" (kicker, rail, footer, learn) and keep "See your tone" only as the door verb. Render `MicGate title="See your tone" … audioSetup={<AudioSetup/>}` above the spectrogram figure when not listening, and keep Stop in the header. **Effort:** S. **Tests:** a names test over `ROOMS`/footer/learn links; `analyze` render test: not listening → an "Enable microphone" button inside a gate plus an "Audio setup" disclosure; error → "Try again".

**P2-2 · Songs room still hand-rolls the cap guard** · `components/songs/songs-client.tsx:86-93,213-217,478-481,493-496`
Quoted: `const CAPPED_REASON = "Free practice is used for today…"` and `function showCapWall()`, a byte copy of `practice/use-capped-start.ts:5-11`. **Fix:** `const { guard, reason, showWall } = useCappedStart(cap)`; `againUnavailable={reason}`; replace the three `if (cap.capped) { showCapWall(); return … }`. Note: `startSong` returns a Promise<boolean>, so keep its early return but use `showWall`. **Effort:** XS. **Test:** extend `practice/cap-controls.test.tsx` to mount SongsClient.

**P2-3 · Breath and ear slides lost what warmups' slide shows** · `components/breath/breath-runner.tsx:364-383`, `components/ear/ear-runner.tsx:283`
The shared slide supports `prev` and `clockLabel`; breath passes no `prev` (the singer never sees how the last drill went), and ear/breath pass `clockLabel` only as free-minutes-left, so Pro sees no time left while warmups always shows "~N min left" (`routine-runner.tsx:177-182`). **Fix:** pass `prev={{ label: breathStepTitle(prevStep), score: results[i-1]?.score ?? null, scoreLabel: results[i-1]?.label }}` in breath; compute `~N min left` from `earRoutineSeconds`/`breathRoutineSeconds` from the step on, like `introClockLabel`. **Effort:** S. **Test:** a `StepIntroSlide` props test per runner (`breath-runner` slide 2 shows the previous drill's chip).

**P2-4 · Recorder still carries its own mic gate** · `components/recorder/recorder-page.tsx:794-830`
`MicGate`'s doc says its `privacy` override exists for "the recorder stores takes" (`ui.tsx:507`), but the recorder does not use `MicGate`: no title/description, privacy line "Takes stay on this device." instead of `MIC_PRIVACY`, and the blocked state is an outline "Try again" with no "Enable microphone" heading. **Fix:** `MicGate bare title="Hear your voice back" description="Record a take, play it back, compare two." privacy="Audio is analyzed on this device and takes are saved in this browser, never uploaded." audioSetup={<AudioSetup/>} footer={<ProWhisper/>}` inside the deck card. **Effort:** S. **Test:** `recorder-prepaint.test.tsx`: the gate heading and the shared privacy sentence are present.

**P2-5 · Programs list is a hub with no start** · `components/programs/programs-client.tsx:113-125`
A first visit sees six cards whose only control is "See the N-day calendar"; "Start this program" lives on the detail (`:349`). For the four free one-week-to-twelve-week programs, a "Start" on the card (with the same confirm logic) would save a tap and a page change. **Fix:** on `ProgramCard`, render `Button variant="outline" size="sm"` "Start" when `!active`, calling `beginProgram` then `open(id)`. **Effort:** S. **Test:** `programs-page.test.tsx`: clicking a card's Start makes `useActiveProgram()` return it and shows today's card.

### P3

**P3-1 · Coach card has no button** · `components/progress/coach.tsx:428-448`. "Today's session" lists links on item titles; there is no start control, so the dashboard's most important next action is a text link. **Fix:** a `ContinueCard`-shaped "Start" for item 1 (`href={item.id ? … : item.href}`). **Effort:** S. **Test:** `coach.test.tsx`: a button-styled link "Start" to item 1.

**P3-2 · Recorder empty state says "Hit record" while there is no record button** · `recorder-page.tsx:1312`. Before the mic is on, the deck shows only "Enable microphone". **Fix:** title "No takes yet", hint "Enable the microphone, then press REC (or R)." when `micState !== "ready"`. **Effort:** XS.

**P3-3 · Warmups newcomer `<details>` have no open/closed affordance** · `warmups-client.tsx:750,759`. `list-none` removes the marker and `group` is never used (`group-open:`); the summaries read as headings. **Fix:** a chevron `span` with `group-open:rotate-180`. **Effort:** XS.

**P3-4 · "First up" on a `?step=` link reads "Up next"** · `step-intro.tsx:178`. The kicker keys on `stepIndex === 0`; a breath or warmups run opened at step 3 shows "Up next" on its first slide. **Fix:** pass `kicker={phase.step === runner.firstStep ? "First up" : undefined}` from the runners (or `isFirst` prop). **Effort:** XS.

**P3-5 · Tools kicker "Studio tools"** · `tools/tools-page.tsx:103`. "Studio" is the pitch studio's name. **Fix:** kicker "Tools" (the nav tab's name). **Effort:** XS.

**P3-6 · Analyzer and tools end on nothing** · `analyze-client.tsx:162-171`, `tools-page.tsx:105-118`. After Stop, the analyzer has no next step (the recorder now points here; nothing points back). **Fix:** a one-line "Next" row like the recorder's: "Record a take" / "Warm up". **Effort:** XS.

**P3-7 · Silent-run setlist branch keeps a primary "Sing again" when capped** · `songs/session-summary.tsx:477-484`. The other two branches demote and describe it; this one does not. **Fix:** apply `againUnavailable` there too. **Effort:** XS. **Test:** `session-summary.test.tsx` silent + setlist + capped → outline + `aria-disabled`.

**P3-8 · Range result: the saved card and the songs/warmups saved cards are still three copies** · `result-view.tsx:704-723`, `songs/session-summary.tsx:442-466`. (Pass-4 P3, still open; listed here because the range one is in this lane.)

---

## 4. Terminology: remaining drift only

| Concept | Variants still in code (file:line) | Pick |
|---|---|---|
| Close control inside a routine step | "Finish step" `exercise-player.tsx:920` · "Exit drill" `box-breathing.tsx:238`, `farinelli-drill.tsx:194`, `breath-cue-drill.tsx:320` · "Exit game" `ear/session.tsx:134` (and it means "exit routine", B4) | "End step" in a routine; "Exit drill/game/exercise" alone |
| Start on a room's ContinueCard | "Start routine" (ear, breath, warmups) · "Start exercise" / "Enable mic and start" (warmups `:666,678`) | "Start" (canonical) with the noun in the title; keep "Enable mic and start" when the press asks for the mic |
| Restart a program | "Restart from day 1" `programs-client.tsx:350` · "Start again from day 1" `today-card.tsx:601` · confirm "Start … again from day 1?" `today-card.tsx:262` vs "Restart … from day 1?" `programs-client.tsx:258` | "Restart from day 1" |
| Retake the range test | "Retake test" `result-view.tsx:655` · "Retake the test" `voice-card.tsx:173` | "Retake test" |
| Stop the mic | "Stop" `studio-client.tsx:348`, `analyze-client.tsx:167` · "Stop mic" `pitch-meter.tsx:770` | "Stop mic" |
| The recorder | "Take recorder" `app/tools/page.tsx:37`, `app/learn/page.tsx:92`, `landing/comparison.tsx:23` · "the take recorder" `app/progress/page.tsx:39`, `app/tools/page.tsx:69`, `app/voice/page.tsx:158`, `lib/guides.ts:552` | "Recorder" |
| The analyzer | "Analysis" `analyze-client.tsx:159` · "Spectrogram and tone" `room-rail.tsx:70`, `app/tools/page.tsx:49` · "Voice analyzer" `site-footer.tsx:57` · "Voice spectrogram" `app/learn/page.tsx:93` · "the analyzer" `recorder-page.tsx:958` | "Analyzer" (door verb "See your tone") |
| Tools tab | kicker "Studio tools" `tools-page.tsx:103` · nav "Tools" | "Tools" |
| Same verb, two behaviours | "Sing" on a song card (auto-starts) vs "Sing" in Picked for you (opens on Play) `taste-quiz.tsx:272` | one behaviour (B7) |
| Mic button after a failure | "Try again" everywhere except analyzer header, which stays "Enable microphone" `analyze-client.tsx:170` | "Try again" |

---

## 5. Image opportunities (concrete)

1. **/progress fresh "What fills in here" ghost card** · replace the three dead texts (`charts.tsx:225`, `:359`, `progress-client.tsx:1017-1028`) with one `FigureFrame caption="Sample: two weeks of practice"` holding a 3-panel server-drawn figure: a 14-bar minutes chart, a rising score line over 4 weeks, and a 3-row practice mix. Reuse `MinutesBarChart`/`ScoreTrendChart`/`PracticeMixChart` with a fixed `SAMPLE_SESSIONS` array (as `RangeOverTime` already does with `sampleHistory`, `result-view.tsx:1028-1051`), drawn at 40 % opacity and marked "sample". Lives in `components/figures/progress-figure.tsx`.
2. **/progress calendar empty** · the 12-week heatmap of grey cells (`calendar.tsx:140-158`) can show a faint sample streak (a 5-day run in week 12, labelled "Sample") until the first session, so "active days" has a shape.
3. **VoiceCard "No range on file"** · `voice-card.tsx:123-131`: add the existing `RangeFigure` (`components/figures/range-figure.tsx:61`) as a faded keyboard with a sample bracket, the same figure the /range gate uses.
4. **Programs calendar tiles and day rows** · `programs-client.tsx:162-171` tiles show only "12m"/"rest"; `today-card.tsx:160-170` rows show a number. Add the existing `WarmupGlyph`/`BreathGlyph`/`EarGlyph`/`SongGlyph`/`RangeGlyph`/`RecorderGlyph` (`components/landing/glyphs.tsx`, already used by `room-rail.tsx:5-17`): one 12 px glyph per item kind in each day tile (up to 3, then "+N"), and one beside each `DayItems` row title. Rest days: a small moon glyph instead of "rest". Cheapest high-value image left; still open from pass 4.
5. **Program list cards** · `programs-client.tsx:72-127`: a one-row mini calendar strip (7 dots for week 1, rest days hollow) under the title, so length and rest rhythm read at a glance.
6. **Recorder A/B empty state** · `recorder-page.tsx:1112-1116`: still a sentence. Two stacked `WaveformFigure` miniatures labelled A and B with a ⇄ arrow (still open from pass 4).
7. **Analyzer gate** · the `SpectrogramFigure` already paints in place (`analyze-client.tsx:209`); add a `FigureFrame caption` "Sample: one sung ‘ah’ sliding up" so the figure is labelled sample, as the other four gates are.
8. **Coach card items** · `coach.tsx:428-447`: the same room glyphs beside each item title (warmup / ear / song / range), matching the program rows.

---

## 6. What is good

- **The shared runner landed cleanly.** `useStepRunner` owns phase, results, cap-stop bookkeeping and "again" (with a run counter in `stepKey`, so "again" remounts slides and steps cleanly). The three runners now differ only in their step switch and results adapter. The cap is still checked between steps (`atCapSlide`), and "not reached" is still distinct from "skipped" in all three results screens.
- **The StepIntroSlide timer is safe.** It is mount-once, and every caller keys the slide per step (`runner.stepKey`; warmups `"warm-in"`/`phase.step`), so the captured `onStart` is always that step's. Warmups' out-of-range "Skipping" slide (`note`) reuses the same timer.
- **MicGate is one component in two tones**, with `MicAlert` everywhere, and the session tone scrolls inside the shell so a short window never hides the button.
- **The studio's stopped state now leads somewhere** (range test / warm up / song), the range test's "microphone stopped" has a Start over button through MicAlert, and the recorder points to the analyzer after a take.
- **Example figures are honest**: each is captioned as sample data (`FigureFrame caption`), and `RangeOverTime` labels its sample in the `LockedPanel` label, the one part that is not `aria-hidden`.
- **Song cap handling is careful**: a capped "Sing again" is demoted with `aria-disabled` + `aria-describedby`, the wall sits under the score, and "Next" only advances the setlist once the next song has actually started (`songs-client.tsx:497-501`).
- **Programs deep links are robust**: plain anchors for new-tab opens, history kept in step by hand, rows carry on from the first unsung step, and today's card and the calendar share `DayItems` so their ticks never disagree.
- **Progress protects the record**: hydration-safe date rendering, `#your-data` jump on hard load only, cloud-restore and import paths offered right under the fresh-start buttons.
