# Visual audit, fleet pass 5

Suede Sing, live production https://sing.suedeai.ai (main ef801f4), captured 2026-10-29 with Playwright (Chromium) at 375x812 and 1280x800, first screen and full page, 25 routes, first visitor with nothing dismissed. Read-only; nothing in `/home/user/sing` was changed.

## Verdict

Pass 4 landed more than it missed: paper grain, the raised `--color-line`, 12px rows, the settling-trace hero ornament, example figures in five of six mic gates, range bars across the singer surfaces, the catalog histogram, book covers, pull quotes, breath drill figures, warmup pattern glyphs and a shorter footer are all live, and the homepage dropped 1,900px on a phone while its drawn-object count went from 5 to 18. What still reads as unfinished is consistency rather than absence: the hairline label only reached the homepage and /pro, so every room page still stacks 6-10 boxed pills; the gate figures sit in three different positions (below the gate on /range, above it on /studio, inside it on /songs) at three different sizes; and phones lose the reference figures entirely (`hidden sm:block` on /glossary and /learn/voice). The biggest remaining walls are the text-only rooms (/warmups, /ear-training, /programs, /tools, /learn, the book and atlas chapter readers, /changelog), /progress's empty dashed boxes, and three share cards that still render in a generic sans with no serif and, on /pro, no figure at all.

## Metrics

Text share = distinct text pixel-rows / page height (same method as pass 4). "img + svg[role=img]" excludes the 22px nav logo; on /pro 44 of the 45 are 14px "Included with Pro" check marks. The last column is pass 4's comparable count (any img/svg/canvas at least 24x24, which includes decorative `aria-hidden` figures such as range bars and drill figures). `/singers/genre/pop` uses `content-visibility:auto` on 305 rows, so its 375 text share is undercounted and its full-page capture shows unpainted rows; scrolled live, the rows render correctly (`crops/pop-1280-y4000.png`).

| Route | H 375 / 1280 (pass 4) | Text share 375 / 1280 (pass 4 @375) | img + svg[role=img] (375) | drawn svg/img/canvas >=24px, 375 / 1280 (pass 4) |
|---|---|---|---|---|
| `/` | 9516 / 6740 (11451 / 8237) | 43% / 41% (48%) | 6 (+logo) | 18 / 18 (5 / 7) |
| `/pro` | 11819 / 6775 (12210 / 6836) | 54% / 54% (54%) | 45 (+logo) | 1 / 1 (1 / 1) |
| `/range` | 10693 / 6116 (11504 / 6072) | 63% / 54% (62%) | 1 (+logo) | 2 / 2 (1 / 1) |
| `/studio` | 9167 / 5545 (9413 / 5234) | 60% / 52% (59%) | 1 (+logo) | 2 / 2 (1 / 1) |
| `/warmups` | 10156 / 6094 (17291 / 11016) | 73% / 73% (57%) | 0 (+logo) | 40 / 40 (1 / 1) |
| `/songs` | 10790 / 5931 (11129 / 5937) | 58% / 53% (57%) | 1 (+logo) | 1 / 1 (0 / 0) |
| `/ear-training` | 12073 / 7617 (12514 / 7647) | 57% / 52% (57%) | 0 (+logo) | 1 / 1 (1 / 1) |
| `/breath` | 11105 / 6091 (11226 / 6062) | 62% / 54% (60%) | 0 (+logo) | 5 / 5 (1 / 1) |
| `/recorder` | 9053 / 5361 (9330 / 5368) | 56% / 50% (55%) | 1 (+logo) | 3 / 3 (2 / 2) |
| `/progress` | 6454 / 4469 (6714 / 4475) | 52% / 46% (51%) | 1 (+logo) | 1 / 1 (1 / 1) |
| `/programs` | 4598 / 2636 (new) | 64% / 62% | 0 (+logo) | 0 / 0 |
| `/tools` | 9890 / 5551 (10268 / 5558) | 57% / 52% (56%) | 0 (+logo) | 0 / 0 (0 / 0) |
| `/analyze` | 10878 / 6175 (11303 / 6202) | 61% / 54% (60%) | 1 (+logo) | 2 / 2 (2 / 2) |
| `/learn` | 10476 / 5597 (10994 / 5711) | 60% / 55% (60%) | 0 (+logo) | 0 / 0 (0 / 0) |
| `/learn/voice` | 11106 / 6712 (11054 / 6586) | 60% / 56% (58%) | 0 (+logo) | 0 / 7 (0 / 0) |
| `/book` | 6898 / 4346 (7001 / 4165) | 68% / 55% (66%) | 1 (+logo) | 1 / 1 (0 / 0) |
| `/book/what-your-voice-is` | 9995 / 5904 (new) | 69% / 61% | 0 (+logo) | 0 / 0 |
| `/atlas` | 10017 / 7158 (10015 / 6872) | 86% / 75% (84%) | 1 (+logo) | 1 / 1 (0 / 0) |
| `/atlas/how-to-read-an-entry` | 6913 / 3968 (new) | 68% / 61% | 0 (+logo) | 0 / 0 |
| `/singers` | 19140 / 10879 (20282 / 11143) | 64% / 66% (63%) | 0 (+logo) | 1 / 1 (1 / 1) |
| `/singers/adele` | 6551 / 4526 (7577 / 4941) | 61% / 52% (61%) | 2 (+logo) | 2 / 2 (1 / 1) |
| `/singers/genre/pop` | 25668 / 17639 (new) | 32% / 56% | 0 (+logo) | 0 / 0 |
| `/can-you-sing` | 6332 / 3038 (6592 / 3044) | 57% / 57% (55%) | 0 (+logo) | 0 / 0 (0 / 0) |
| `/glossary` | 14101 / 8955 (14701 / 9086) | 72% / 62% (72%) | 1 (+logo) | 1 / 6 (0 / 0) |
| `/changelog` | 12614 / 9008 (new) | 65% / 57% | 0 (+logo) | 0 / 0 |

Reading the numbers: heights fell on 19 of 20 comparable routes (warmups -41% because the ladder now collapses, home -17%); text share barely moved (it is a page-shape problem, not a length problem); drawn objects rose sharply only where pass 4 built shared components (home 5 to 18, warmups 1 to 40 glyphs, breath 1 to 5). Nine routes still have zero drawn objects at 375: /ear-training (1, the ring), /programs, /tools (its keyboard is HTML), /learn, /learn/voice, /book/<chapter>, /atlas/<chapter>, /can-you-sing, /changelog.

## Per-route issues

| Route | What is wrong | Fix |
|---|---|---|
| `/` 375 | Portrait is a 20%-opacity wash directly behind the h1; the face sits under "Sing one note" and reads as a smudge, not a photo. | At <640px move the portrait out from behind the copy: a 96px circular crop beside the kicker, or a 4:3 crop below the buttons at full opacity. Keep the wash only at >=1024. `components/landing/hero-split.tsx`. |
| `/` both | "What a session looks like": the studio shot is the mic gate (no trace) and the top of each phone shot is cut mid-element ("WHAT THE TRACE DRAWS ONCE THE MIC IS ON" with the figure cropped off). At 375 the two shots are 146x315 and every word in them is illegible. ~150px of dead space under them. | Re-render with `scripts/render-room-shots.mjs`: scroll the studio shot to the example `TraceFigure` (or inject a sample trace) and clip at an element boundary. At 375 show one shot at 260px wide in a horizontal scroller, not two at 146px. Trim bottom padding. |
| `/` both | The range-room phone shot sits under the "iPhone companion / Also on iPhone: Suede Voice" heading, but it is a web screenshot of Sing. Two different products' screens share one band. | Either caption it "Same range test, in the browser" or move the web shots to the "Your mic is the only equipment" band and give the iOS band its own app screenshot or just the badge. `components/landing/ios-band.tsx`. |
| `/` both | Pro coach-report figure: the "Range / 3 tests · 12 weeks" panel is a flat band (no change across 12 weeks) with an empty lower third, and the G4 label collides with the line. At 375 the figure is 341x160, so its labels render at ~5px. | `components/pro/pro-visual.tsx`: give the sample range a visible widening (E2-G4 to D2-B4), pin the axis to the data, offset end labels 6px; at <640 drop the accuracy panel's labels or stack the two panels vertically. |
| `/` 1280 | Footer "By voice type"/"By genre" columns have no headings on desktop (the label only exists in the phone `<summary>`). | Render the same mono column label at >=sm. `components/site-footer.tsx`. |
| All, footer 375 | The `<summary>` labels "BY VOICE TYPE" / "BY GENRE" render in 12px Instrument Serif (the inner `<h2>` inherits the global h2 serif rule), so they look like a broken font next to the mono "REFERENCE"/"PRACTICE" labels. "MORE FROM SUEDE AI" wraps to two lines. | Add `font-mono` (and the label tracking) to the h2 inside the summary, or make it a `<span role="heading">`. Shorten to "SUEDE AI". Footer height 1228px at 375 (was ~1600) is otherwise fine. |
| `/pro` | "Pro is what keeps free free." is an h2 at 14px serif, smaller than the body copy under it; looks like a mistake. The "Two books, with PDFs" section is two text lists with no covers even though the `BookCover` now exists. Seven perk cards still lead with a 20px glyph in a 48px well, no sample figure. | Promote the line to a pull-quote (`PullQuote`) or set it at body size in Manrope 600. Put the two `BookCover`s at the head of each book list. Give "Deep vocal analytics" and "Take pitch analysis" a 120x48 sample (`TraceFigure` overlay of two takes, per-note bars). |
| `/range` | Example keyboard (`RangeFigure`) is below the gate, so the phone first screen is h1 + lede + tabs + mic glyph, no keyboard; at 1280 it is below the fold too. Layout is centred while every other room is left-aligned, and there is no kicker pill. Labels on the figure are ~6px at 375. | Move the figure above the gate (as /studio does) or into the gate card's top. Align the header left with a "RANGE" kicker like its siblings. Increase figure height at 375 (80px to 110px) and label size to 10px. |
| `/studio` | "Inside the studio" is four text-only cards (Tuner, Cents gauge, Pitch trace, Target practice). Caption "WHAT THE TRACE DRAWS ONCE THE MIC IS / ON" orphans a word. | Small sample drawing per card (see image #3). Use `text-wrap: balance` on figure captions or shorten to "WHAT THE TRACE DRAWS". |
| `/warmups` | The only gate room with no example figure (`figCount` 0). "How a warmup works here" is a numbered list. Pattern glyphs exist but only inside the collapsed "Every exercise" ladder; routine chips and "Today's three" rows have none. | Add the stepped five-note lane figure (image #1). Put `PatternGlyph` before each chip in the routine card and each "Today's three" row. |
| `/songs` | Piano-roll figure sits inside the gate at 299x93 (375) / 350x109 (1280); at 1280 it occupies a corner of an otherwise empty right half. The 26 song rows are text only (melody-contour.tsx exists but is not used here). | Let the figure fill the gate's right column at 1280 (min 480px wide). Add `MelodyContour` (60x16) to each row. |
| `/ear-training` | 30+ identical rows "10 ROUNDS · NOT PLAYED YET" across Easy/Medium/Hard/Chase; no game glyphs; at 1280 the 0/5 goal ring floats alone under the routine card. Label style mixes boxed "PATH" with breath's hairline "PATH". | Game glyphs (image #5). Move the ring into the routine card header (as /warmups and /breath do). Hairline the in-body labels. |
| `/breath` | Drill figures landed but at 375 they take a fixed left column, squeezing the description into ~150px so each row is 190-280px tall; "hold steady" labels are ~7px. | At <640 put the figure above the title at 64px height, full row width, or drop it to a 32px glyph beside the name. `components/breath/*` path row. |
| `/recorder` | The Pro preview "Take pitch analysis" traces are still two hairline gold curves at low opacity (pass-4 note unchanged). "A SAVED TAKE, AS THIS LIST SHOWS / IT" orphans a word. | Full-opacity `--color-amber` and `--color-cool` strokes at 2px, labelled "Take 1 / Take 2". Balance the caption. |
| `/progress` | Every panel is a dashed empty box for a first visitor; the calendar is 84 blank squares. No ghost figures (pass-4 item 8 did not land). Section heads alternate between small serif h2s ("Trends", "Your data") and boxed pills inside cards. | Ghost figures (image #2). Use one heading pattern: hairline label + serif h2. |
| `/programs` | Zero drawn objects; six cards of mono metadata and dense "What gets measured" paragraphs. | Week-strip figure per card (image #4). |
| `/tools` | Visually the best room (96 BPM readout, keyboard). Drone note pills and metronome controls are fine. | No change beyond hairline labels. |
| `/analyze` | Example spectrogram reads as wood grain: bands evenly spaced and nearly equal weight from 600 Hz to 3.2 kHz, with the fundamental band separated far below. For "a sung A3" the harmonics should be at 220, 440, 660... (converging upward on a log axis) and fade in amplitude. Tone and vocal-load panels below are empty zeros. | Regenerate `components/figures/spectrogram-figure.tsx` from real harmonic math (n*f0, amplitude ~1/n, vibrato ripple 5.5 Hz, one register jump). Show an example tone bar set in the tone panel at 40% opacity. |
| `/learn` | 20-minute plan blocks landed. The seven-day plan is a list. No figure on the "Choose the problem" path cards. | Seven-column day strip with `PatternGlyph`-style marks per day. |
| `/learn/voice` | Stage figures render at 1280 (7) and are hidden at 375 (`hidden sm:block`), so phones get 11k px of link lists with no figure. | Show the `ReferenceFigure` on phones at full width under each stage heading (max-height 64px). `app/learn/voice/page.tsx`. |
| `/book`, `/atlas` | Cover is a 144x192 thumbnail stacked above the buttons in the right column at 1280; the h1 starts below the cover's top edge so the two columns misalign. At 375 it is 110x150 beside the buttons. The stats card's right half is empty at 1280. | Make the cover a 220-260px object vertically centred against the h1 + lede, buttons under the lede in the left column. Put the pull quote or a part-structure figure in the stats card's empty right half. |
| `/book/<chapter>`, `/atlas/<chapter>` | 8-10k px of pure prose at 375, inside a bordered card that costs 40px of measure (about 38 characters a line). No figures in a chapter literally about "breath, folds, filter". | Drop the card border/padding on phones (reader full-bleed with 16px gutter). Add an in-chapter figure for chapter 1 (source-filter diagram, image #6) and the atlas "how to read an entry" (annotated sample entry). |
| `/singers` | Range bars on browse tiles and evidence cards landed; the chart is strong. First screen is still h1 + two paragraphs + a text card. | Pull the keyboard axis with 3 sample bars into the hero (image #8). |
| `/singers/adele` | Strong. At 375 the keyboard strip is 301x51 with muted teal on tan keys and ~7px octave labels; it is the page's signature and reads faint. | Raise strip height to 72px at 375, use full `--color-cool` for the span, 10px labels. |
| `/singers/genre/pop` | 305 rows rendered up front: 25.7k px at 375, 17.6k at 1280, while `/singers` pages 48 at a time. No hero figure; stats card is three mono numbers. | Page at 48 with the same "Load more" control, or group by voice type with collapsible sections. Add the genre's stacked voice-type bars (the same reading as its OG card) beside the stats. |
| `/can-you-sing` | 24 identical cards, text-only range (pass-4 item 3 skipped this page). | `RangeMini` bar per card on a shared C3-C6 axis. |
| `/glossary` | Group figures exist at 1280 (6) but are hidden at 375; the phone gets 14k px of definitions with one portrait. | Show figures on phones (same fix as /learn/voice). |
| `/changelog` | At 1280 all copy sits in a ~560px left column; the right 55% of the page is empty for 9k px. No imagery except the 16px trace glyph. | Two-column layout at >=lg: story text left, a small figure or room screenshot per story right (the room shots already exist in `public/room-*.png`). |
| OG `/opengraph-image` | Headline renders in a generic grotesque (`fontFamily: "monospace"` with no font loaded falls back to Satori's default sans), not Instrument Serif; bar "trace" is a bar chart, not the brand's settling line. | Load Instrument Serif TTF via the `fonts` option, set headline 76px serif; replace bars with the settling-trace path from `marketing/social/assets/fb-cover-source.html`. Bump `OG_CARD_RENDER_REVISION`. |
| OG `/pro/opengraph-image` | Text only; 40% of the card is empty; same sans. | Add the coach-report miniature (per-note bars with the flagged E4) on the right half; serif headline. |
| OG singer (`/singers/adele/opengraph-image/...`) | Keyboard is all tan with white-key/black-key contrast inverted (black keys lighter than white), the span is an amber outline, not the teal bar the page uses; "2 octaves + 10" disagrees with the page's "2.8 octaves"; sans headline. | Draw the span in `--color-cool` fill on a neutral keyboard (dark black keys), match the page's octave format, serif name. `components/singers/og-card.tsx`. |

## Pass-4 plan status

### Image plan

| # | Item | Status |
|---|---|---|
| 1 | Sample-data figures in mic gates | Landed on /range, /studio, /songs, /analyze, /recorder. **Not on /warmups.** Placement and size inconsistent across rooms; /range's is below the fold. |
| 2 | Replace dark iOS posters | Landed (paper-framed `public/room-*.png`, 780x1688, seeded). Studio shot shows the gate not a trace; 375 sizes illegible; web shots under an iPhone heading. |
| 3 | Range bars on singer lists | Landed: home famous voices, /singers evidence + voice-type tiles, similar voices. **Not on /can-you-sing, not on "Also listed" chips.** |
| 4 | Room marks at 48-64px | Partial: home feature grid has 48px wells with ~22px glyphs; "More practice rooms" strips still 32px wells, 16px glyphs. No two-stroke miniatures. |
| 5 | Book covers | Landed on /book and /atlas (small, awkwardly placed at 1280). **Not on /pro.** |
| 6 | Pull quotes | Landed on /book and /atlas (one each). Not on /learn. |
| 7 | Settling trace ornament + dividers | Hero ornament landed. **Section dividers not landed** (homepage still `border-t`). |
| 8 | Progress ghost figures | **Not landed.** |
| 9 | Stage / group figures | Landed on /glossary and /learn/voice at >=640 only; **hidden on phones**. Not on /atlas parts. |
| 10 | Breath drill figures | Landed; cramped at 375. |
| 11 | Exercise pattern glyphs | Landed in the ladder rows (40 drawn); hidden behind the "Every exercise" disclosure; not on routine chips or Today's three. |
| 12 | OG cards in the serif | **Not landed** (home, /pro, singer all sans). |
| 13 | Founder byline tile | Landed on /book, /atlas, /glossary. |
| 14 | Song melodic contours | Component exists (`components/figures/melody-contour.tsx`); **not on /songs rows**. |
| 15 | Catalog distribution figure | Landed on singer pages. |

### Aesthetic plan

| # | Item | Status |
|---|---|---|
| 1 | Paper grain | Landed (feTurbulence data-URI on `body`). Subtle, correct. |
| 2 | Room prose bands | Landed: "The short version" sections sit on a `border-y` panel band. |
| 3 | Prose measure | Mostly landed at 1280; chapter readers on phones lose measure to card padding. |
| 4 | Readout tier | Partial: /singers/adele and /tools only. /range, /breath, /progress have no hero number before data; progress zeros are small mono. |
| 5 | Retire violet v4 block | Landed (small outline pill). |
| 6 | Figure shadow tier | Landed on figure frames and covers. |
| 7 | Hairline section labels | **Partial**: opt-in prop used only on home, /pro, breath "Routines", changelog. `components/guide.tsx` (The short version / How to do it / Questions / Where to go next) and `components/discover/room-rail.tsx` (More practice rooms) still render boxed pills on every room. |
| 8 | Note-lane ornament | Not landed (not seen in gates or hero). |
| 9 | Radius and line contrast | Landed (`--color-line` #d6cbb7, rows 12px). |
| 10 | Motion on figures only | Not checked visually (static captures). |
| 11 | Footer density | Landed (1228px at 375, `<details>` for voice type/genre); summary font bug and missing desktop headings introduced. |

## Ranked next image additions

1. **Warmup lane figure in /warmups' gate.** A 3:1 SVG: five stepped target bars (C-D-E-F-G then back) as `--color-amber` 10% bands with a teal sample trace that scoops into note 1 and settles, labelled "example". Build `components/figures/lane-figure.tsx` on `frame.tsx` + `chip.tsx` (same API as `TraceFigure`), geometry from `components/warmups/note-lane-canvas.tsx` constants; place it at the top of "How a warmup works here" in `components/warmups/routine-home.tsx`.
2. **Ghost figures in /progress empty states.** In `components/progress/progress-client.tsx`, render `charts.tsx` (score trend), `calendar.tsx` (with ~14 seeded days) and the voice-card strip with fixture data at `opacity: .28`, `aria-hidden`, under a `chip.tsx` "Example · yours fills in as you practise", replacing the dashed text boxes. Fixture data can be the same seed `scripts/render-room-shots.mjs` already uses.
3. **Four studio card miniatures.** In the "Inside the studio" cards: Tuner = "A3 · 220 Hz" readout in the new readout size; Cents gauge = a 120x40 arc with needle at -8 (reuse the gauge path from the studio's cents gauge component); Pitch trace = 120x36 crop of `TraceFigure`; Target practice = a held note locking into a green band. Server components, ~1 KB each.
4. **Program week strips on /programs.** Each card gets a 7-or-14-column strip: filled amber dot = practice day, hollow = rest, teal ring = range test day, computed from the program definition the calendar page already reads. 280x24 SVG in `components/programs/programs-client.tsx`.
5. **Ear-training game glyphs.** Five 24px stroke glyphs (up/down arrow pair for Higher or lower, bracket with two dots for Interval ID, dot-on-line for Pitch match, moving dot on a trace for Note catcher, contour polyline for Melody echo) added to `components/landing/glyphs.tsx` style and placed on routine chips and path rows in `components/ear/ear-training-client.tsx`; this breaks the 30-row "NOT PLAYED YET" wall.
6. **Source-filter diagram in Book chapter 1 (and reused on /learn).** Three-stage horizontal figure: breath (pressure arrow) to folds (a buzz waveform) to tract (formant envelope over a harmonic comb) to "ah". Inline SVG component referenced from the chapter body via the reader's figure hook in `components/book/reader.tsx`; reuse at 50% scale on /learn's "Understand your voice" card.
7. **Song cards with range bars and contours.** `/can-you-sing`: shared C3-C6 `RangeMini` bar per card so "easiest first" becomes visible. `/songs`: `MelodyContour` 60x16 beside each row title (data already in the song definitions the player uses).
8. **Singer chart preview in /singers hero.** Lift the chart's keyboard axis plus three real rows (Adele, Freddie Mercury, Ariana Grande) into a 600x140 figure beside the h1 at 1280 and under the lede at 375; same components as the chart rows, static.
9. **Share cards rebuilt.** Sitewide: serif headline + settling trace path; /pro: coach-report miniature (port `pro-visual.tsx` geometry to `next/og` divs); singer: teal span on a dark-keyed keyboard. Load Instrument Serif via `fonts` in each `ImageResponse`; verify with `scripts/audit-share-cards.mjs`; bump `OG_CARD_RENDER_REVISION`.
10. **Phone-visible reference figures + atlas part figures.** Remove `hidden sm:block` from `ReferenceFigure` in `app/glossary/page.tsx` and `app/learn/voice/page.tsx` (render full-width, max-height 64px on phones), then add one figure per atlas part (stacked voice-type bars for that genre's singers, the same reading as `HubOgCard`) in `components/atlas/reader.tsx`'s contents view.

## Ranked aesthetic fixes

1. **Hairline labels everywhere in body copy.** `components/guide.tsx:188` and siblings: `<SectionLabel hairline …>` for The short version / How to do it / Questions / Where to go next / Vocal health; same in `components/discover/room-rail.tsx`, `components/ear/ear-training-client.tsx` (PATH, EASY/MEDIUM/HARD), `components/progress/progress-client.tsx`. Better: flip the default so `hairline` is the default and the page kicker passes `pill`. Removes 6-10 boxed pills per room page and finishes the pass-4 change.
2. **One gate-figure placement rule.** Every mic room: figure first (full card width, min-height 120px at 375, 200px at 1280), gate card second, caption balanced (`text-wrap: balance`) and no longer than "WHAT THE TRACE DRAWS". Apply to /range (move above), /songs (fill the right column), /recorder, /analyze, /warmups (new). Centralise in a `GateWithFigure` wrapper in `components/figures/frame.tsx`.
3. **Fix the footer summary font.** `components/site-footer.tsx`: give the `<h2>` inside each `<summary>` `font-mono text-[11px] uppercase tracking-[0.18em]` (it currently inherits the global serif h2 at 12px), add the same label above the voice-type/genre columns at >=sm, and rename "More from Suede AI" to "Suede AI" so it does not wrap.
4. **Header rhythm for book/atlas heroes.** Two-column grid `grid-cols-[1fr_auto] items-center gap-12`: kicker, h1, lede, buttons left; cover 240px right, vertically centred. At 375, cover 120px floated right of the kicker+h1 or placed above the h1 centred. Fills the misaligned top-right corner the cover sits in now.
5. **Readout tier in every room that produces a number.** `Stat size="hero"` (mono, 48/60px, tabular) for: /range example result ("G2-E4 · 1.7 oct"), /breath sustain ("12.4 s"), /progress streak and level when non-zero, /studio tuner example. One big number per first screen.
6. **Reader full-bleed on phones.** `components/book/reader.tsx` and `components/atlas/reader.tsx`: at <640 drop the card border and inner padding (`max-sm:border-0 max-sm:bg-transparent max-sm:px-0`) so chapter prose gets 343px of measure instead of ~300; keep the card at >=sm.
7. **Breath path row layout at 375.** Stack figure above text (`flex-col sm:flex-row`), figure `h-16 w-full`, or swap to a 32px glyph; ends the 280px-tall squeezed rows.
8. **Settling-trace dividers on the homepage.** Replace the `border-t border-line` between homepage sections with a 1px, 12%-opacity trace path (same as the hero) drawn full-bleed at 24px height, `aria-hidden`. Homepage only, so it stays an ornament.
9. **Make /changelog and /atlas use the width at 1280.** `lg:grid-cols-[minmax(0,62ch)_1fr]` with a figure or room shot in the second column per story/part, instead of a 560px column and 700px of blank paper.
10. **Pro page h2 and covers.** Set "Pro is what keeps free free." as a `PullQuote` or Manrope 600 body-size line; reuse `BookCover` at 96px in the "Two books, with PDFs" list headers.

## Screenshot index

Root: the audit session's scratch folder (not committed; the screenshots are not in the repo).

- `shots/<route>-375.png`, `shots/<route>-1280.png`: full page. `shots/<route>-375-first.png`, `shots/<route>-1280-first.png`: first screen. Route slugs: `home`, `pro`, `range`, `studio`, `warmups`, `songs`, `ear-training`, `breath`, `recorder`, `progress`, `programs`, `tools`, `analyze`, `learn`, `learn_voice`, `book`, `book_what-your-voice-is`, `atlas`, `atlas_how-to-read-an-entry`, `singers`, `singers_adele`, `singers_genre_pop`, `can-you-sing`, `glossary`, `changelog` (100 PNGs).
- `shots/metrics.json`: height, text pixel-rows, figure list (tag, size, y, aria-label), above-fold and >=24px counts, footer height, scroll width (no route overflowed horizontally at 375).
- `sheets/first-375-1..4.png`, `sheets/first-1280-1..7.png`: first screens side by side. `sheets/<route>-<width>-sN.png`: full-page contact sheets (1600px strips).
- `crops/home-proreport.png`, `crops/pro-proreport.png` (2x coach report), `crops/home-1280-footer.png`, `crops/home-1280-sessions.png`, `crops/pop-1280-y4000.png`, `crops/pop-375-y4000.png` (genre rows render live).
- `og/home.png`, `og/pro.png`, `og/adele.png`, `og/og-sheet.png`. Note `/pro/opengraph-image` without its hash 404s; the page's `og:image` URL (`/pro/opengraph-image/1yz6zss?...`) is correct.
- Scripts: `shoot.js`, `sheets.py`, `firsts.py`. Table source: `metrics-table.md`.
