# Suede Sing / Android ambient-noise microphone smoke test

Date: 2026-09-03, America/New_York (session around 03:45–03:56 EDT).

**Result: PARTIAL — the required HVAC and quiet-human-voice test is NOT RUN.**
Live browser capture/start/stop checks ran on a physical MacBook microphone.
No Android device was connected. Room conditions and human voice input were not
confirmed, so neither platform receives an acoustic pass or fail. No confirmed
detector regression, product-code change, deployment, or Play promotion.

## Targets and provenance

- Website: https://sing.suedeai.ai/range and https://sing.suedeai.ai/studio.
- Web repo: `/Users/jasoncolapietro/sing`, branch `codex/ios`, clean at start,
  HEAD `f0e9022`, remote `https://github.com/JasonColapietro/sing.git`.
- Web fix: [PR #117](https://github.com/JasonColapietro/sing/pull/117), merged
  `07aef8e9e9498806cac0edbc4d58aa8e25f40260`, present in this checkout.
  Live route rendering was verified; this session did not independently map
  the current deployed JavaScript to an exact source commit.
- Android package: `ai.suedeai.suedevoice`, candidate **1.1.1 (versionCode 7)**.
- Android fix: [PR #112](https://github.com/Suede-AI/suede-voice/pull/112), merged
  `622e59ede174d56f11f257f95c552927b2f9c12d`.
- Android release: [PR #113](https://github.com/Suede-AI/suede-voice/pull/113),
  merged `b183ae90f75c912217026f60a2883dec0d83ad7f`. Its notes report an internal
  testing upload and production promotion pending this physical test. That is
  release-note evidence, not a fresh Play Console or installed-device readback.
- Release checkout: `/private/tmp/suede-voice-ambient-release-20260903`, branch
  `codex/android-ambient-release-20260903`, HEAD `0e21d59`, remote
  `https://github.com/Suede-AI/suede-voice.git`. Existing modified iOS reviewer
  notes and untracked `RELEASE_SMOKE_TEST.md` were read/preserved, not edited.
- Primary Android repo `/Users/jasoncolapietro/code/suede-voice` is clean on
  `sing/v1.0` at `26c7cd1`, older than the fix; it was not synced or used as the
  candidate under test.

## Checks actually run

| Check | Observed result | Evidence boundary |
| --- | --- | --- |
| Physical Android availability | Escalated `adb devices -l` returned an empty device list | Android smoke test blocked; no installed version or OS to inspect |
| Mac audio inventory | Escalated `system_profiler SPAudioDataType` lists built-in MacBook microphone, iPhone microphone, and a virtual Teams device; MacBook is OS default input | Initial sandboxed inventory was empty, so it was not used to claim hardware absence |
| Live range startup | HTTPS `/range` rendered and reached Listening / step 1, then showed “We're not picking up any sound” | No range completed; not a noise-rejection pass |
| Browser permissions/devices | Microphone permission granted; secure context; Chrome/152.0.0.0 user agent on Intel Mac; physical and virtual device names exposed | Browser is Codex in-app Chromium, not Android Chrome |
| Default capture diagnostic | A separate five-second `getUserMedia` probe selected the iPhone microphone: 50 analyser snapshots, all-zero RMS and 0 nonzero samples | Silent capture is not HVAC evidence; actual live-page track identity was not introspected |
| Explicit physical input | Selected “MacBook Pro Microphone (Built-in)” through the website's Audio setup | Per-site microphone preference only; no OS setting changed |
| Live studio capture | At displayed elapsed 0:39, input meter 65/100, tuner “no note,” 0 targets locked | Single UI observation, not calibrated loudness or a continuous 30-second HVAC measurement |
| Live studio restart | Stop returned to idle; restart reached Listening at 0:05 with meter 100/100 and “no note”; Stop returned to idle again | Capture lifecycle works in this browser; no assertion about quiet-voice sensitivity |
| Focused web detector suite | `npm test -- lib/audio/pitch.test.ts`: 1 test file passed, **25 tests passed** | Synthetic detector tests, not physical acoustic acceptance |

The default diagnostic used `echoCancellation:false`, `noiseSuppression:false`,
and `autoGainControl:false`. The iPhone track reported live/enabled/not muted,
48 kHz mono settings, with a running AudioContext at 44.1 kHz. Its temporary
track was stopped and its AudioContext closed in `finally`. No waveform or voice
recording was saved by this diagnostic. These settings/rates belong to the
diagnostic stream, not a measured MacBook stream.

The website preference initially displayed System default / Headphones. Only
the input selector was changed. No reference tones or recordings were played.
HVAC state, background sound source, physical microphone distance, headphones
actually worn, and a human's quiet singing were not verified.

## Acoustic acceptance matrix

Follow the existing `RELEASE_SMOKE_TEST.md` in the release checkout. Keep normal
HVAC running in the same room, use built-in microphones without Bluetooth or
played-back tones, and record device model, OS, browser, installed version,
distance, time, and room conditions. Use comfortable notes only.

| Required trial, on each platform | Expected behavior | Live website | Android 1.1.1 (7) |
| --- | --- | --- | --- |
| Fresh range test, 30 seconds silent with normal HVAC | No stable sung note, no expanding range, no 100/120 Hz hum recorded | NOT RUN under confirmed conditions | NOT RUN |
| Quiet comfortable mid note, 3–5 seconds, three repetitions | Stable detection without raising to loud singing | NOT RUN | NOT RUN |
| Quiet comfortable low note, 3–5 seconds, three repetitions | Note not systematically lost or octave-doubled | NOT RUN | NOT RUN |
| Voice then five seconds silence, three cycles | Detection stops in silence and resumes with voice | NOT RUN | NOT RUN |
| Stop/restart | Capture recovers without stuck mic or crash | Studio lifecycle observed; range trial pending | NOT RUN |

Do not use the nonzero input meter, all-zero iPhone capture, synthetic tests,
or isolated “no note” UI snapshots to fill these rows as PASS. A regression
requires a reproducible failure under confirmed conditions with the exact
candidate installed. Fix only that failing condition and rerun both sides of
the acoustic test; do not tune thresholds from this partial run.

## Artifacts and actions

- Candidate APK:
  `/private/tmp/suede-voice-ambient-artifacts-20260903/suede-voice-1.1.1-7.apk`
  SHA-256 `2d8498ce69947ebf281cdbf82d28d18ba199afcf2b75c7da871e131f9b9f2a2e`.
- Candidate AAB:
  `/private/tmp/suede-voice-ambient-artifacts-20260903/suede-voice-1.1.1-7.aab`
  SHA-256 `feca5b0baf220b7d8be1aa9095a131a784b84869e1c5898d7b8afd20f6e098a1`.
- Only new local documentation:
  `docs/qa/2026-09-03-microphone-smoke-test.md` in the web repo. No app code changed.
- Browser side effects: built-in microphone selected for this site's test
  browser profile; the first studio check crossed its 45-second threshold and
  displayed “Session saved” with **+68 XP** and First note / Night owl badges.
  The second short check did not display a save. Existing user data was not
  deleted. This XP event is not evidence of a detected note or confirmed regression.
- Capture was stopped through the UI after both studio checks. The range page
  is left idle for a supervised continuation, with the built-in input selected.
- No commit, push, production change, Android installation, or release promotion.

Other commands: repo-local `git status --short --branch`, `git remote -v`,
`git log --oneline -5`; `git show --stat 07aef8e`; GitHub PR readbacks for web
#117 and Android #112/#113; `git worktree list`; `shasum -a 256` for both signed
artifacts. The separate Chrome DevTools connector timed out on `Network.enable`;
the successful live UI checks used the in-app browser instead.

## Exact next step

Connect and authorize a physical Android phone for ADB, verify the installed
candidate is package `ai.suedeai.suedevoice` version 1.1.1 (7), and have Jason
present in the room with normal HVAC running for the quiet mid/low-note trials.
Resume the matrix above, logging observed results and evidence per platform.
Keep production promotion pending; this task authorizes testing and fixing a
confirmed regression, not promotion based on an incomplete test.
