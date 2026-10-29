# Fleet pass 5: reading surfaces (lane: templates pass 4 did not reach, plus status)

Tree: `fleet-pass-5` at `ef801f4` (#263). Read-only; nothing in `/home/user/sing` was modified (`git status` clean). Prose statistics come from a scratch script over `content/book/*.md` and `content/atlas/*.md` (paragraph = one non-heading, non-bullet source line; sentence split on `. ! ?` before a capital). Song and pop-song strings were computed from the real data modules with jiti (`scratchpad/sf.mjs`, `pop.mjs`, `gl.mjs`). AGENTS.md indexing rule: nothing below touches `robots`, `pageRobots`, sitemap or the pending-status fixture.

---

## 1. Pass-4 status

| Pass-4 finding | Status | Evidence |
|---|---|---|
| P1 Singer profile: answer twice, caveat ×7 | **PARTLY** | Answer card gone; FAQ now has a shared `lede` (`app/singers/[slug]/page.tsx:202-250`) and the evidence card is one paragraph (`evidenceParagraph`, :253-259). But "not an independently verified physiological limit" still prints twice per reviewed page (subtitle :140 and FAQ lede :230), and each of the four FAQ answers still carries its own caveat clause ("should not be read as a verified individual maximum", "does not independently establish … as an individual highest note" ×2, "not a reviewed measurement", :233-246). With the evidence card and `singer-actions.tsx:140, 197` that is ~8 caveat sentences per page, down from ~9. |
| P1 Lesson scaffolding (~120 words/page) | **PARTLY** | Compile-time >50% filter landed (`scripts/compile-lessons.mjs:288-299`); "Say what will count as complete…" and "This is a self-report…" are gone from `lib/lesson-data.ts` (0 hits). Still printed: step title "Use the practice material" on 99 lessons and its body "Open the practice material on this page and choose X. The reading Y is listed there too." on 96 (each sentence varies by X/Y so the identical-sentence filter misses it). |
| P1 Singer prose committed three times | **PARTLY** | `--check` for all four compilers + one test (`lib/generated-data.test.ts:5-13`); the "hand-fixes are fine" line is gone. Still triple: `"technique"` ×636 in both `lib/singers-data.ts` and `lib/atlas-data.ts` (845,194 B, unchanged size). PDFs are still committed (756 KB + 4.8 MB). |
| P1 Six wordings of the medical paragraph | **FIXED on templates / OPEN in prose** | Shared `SafetyLine` (`components/learn/safety-note.tsx:5`) used by 8 templates. But the book body repeats one sentence verbatim in **20 of 23 chapters**: "Pain, hoarseness that will not clear, or any blood is a doctor's question rather than a practice one — chapter six says more." (e.g. `content/book/03-the-passaggio.md:53`, `05-resonance.md:50`, `12-when-numbers-lie.md:61`). A Pro reader meets it 20 times. |
| P2 Stale hub review copy | **FIXED** | `HUB_FIGURES_NOTE` (`lib/singer-hub-copy.ts:37-38`) on 3 templates; no "await individual review" left in `app/` or `lib/`. |
| P2 Course kicker/subtitle/breadcrumb redundancy | **FIXED** | Lesson subtitle = objective (`[lesson]/page.tsx:168`); module = promise (`[module]/page.tsx:99`); stage = catalog subtitle. |
| P2 Pro / free-cap ×3 on /learn | **PARTLY** | Cap facts now in the "What is free?" card (`app/learn/page.tsx:257-266`), but Day 5 still spends its first sentence on it ("…in the pitch studio, which has no practice timer, so your guided minutes go to the song", :81), pinned by `lib/learn-hub.test.tsx:103`. Lesson double `GuidedCapNote` fixed (one render, `module-practice.tsx:97`). |
| P2 FAQ blocks repeat the same caveat | **STILL OPEN** | `typeAnswer()` still ends all 8 answers with the 45-word "Range and voice type are different measurements, though…" (`app/atlas/vocal-range-by-voice-type/page.tsx:203`). Records page: every FAQ answer opens "This catalog cannot/does not establish…" and closes with "check … evidence status" (`app/singers/records/page.tsx:125-141`), on top of the subtitle (:187), a caution card (:207-218), three table ledes (:224, :239, :254) and "None of these numbers is a target" (:284): ~11 caveat sentences on one page. Singer FAQ: see row 1. |
| P2 Navigation redundancy (book/atlas) | **PARTLY** | Book: header "← Contents" and "Back to contents" gone (`app/book/[slug]/page.tsx`). Atlas: header "Get your own two numbers" gone, but the "← Contents" pill is still the only header action (`app/atlas/[slug]/page.tsx:130-140`), and the locked/loading card offers four buttons including "Back to contents" (`components/atlas/reader.tsx:109-128`). |
| P2 /singers "Popular lookups" grid | **FIXED** | No "Popular vocal range lookups" in `app/`. |
| P2 "In short" >90 words | **FIXED** | `IN_SHORT_MAX_WORDS = 80` enforced (`scripts/compile-lessons.mjs:28-29, 119`); `where-your-voice-changes-gear.md` In short now 85 words incl. heading. |
| P2 `lib/markdown.tsx` cannot show a figure, table or image | **STILL OPEN** | File unchanged in #263: headings, paragraphs, bullets, blockquote, hr, inline only (`lib/markdown.tsx:131-189`). Book ch 3's passaggio table is still 8 bullets (`content/book/03-the-passaggio.md:30-37`); atlas ch 4's register colours still a 111-word italic run-on (`content/atlas/04-a-vocabulary-for-tone.md:44`). New: there are **three** markdown renderers (also `scripts/build-book-pdf.mjs` and `scripts/build-atlas-pdf.mjs` `mdToHtml`), and the PDF ones lack even blockquote/hr. |
| P3 Label headings / ledes restating headings | **FIXED (lessons) / PARTLY elsewhere** | Lesson h2s are now promises ("Did it work? Judge by ear", `[lesson]/page.tsx:302-304`; "When it goes wrong", :284). Singer "Evidence and review" is a single h2 now (:502). Song pages still pair a label with a restating h2 on every card (see P2-3 below). |
| P3 `/can-you-sing` exact-match titles | **STILL OPEN** | H1 `Can you sing “${title}” by ${artist}? Key and vocal range` (`app/can-you-sing/[slug]/page.tsx:160`); subtitle = `answerSentence` restating title, artist, key, range, semitones and rating (:37-49, :161), then the stat row repeats key/low/high/span/difficulty (:170-180). 24 pages. |
| P3 Atlas chapter range test ×2, contents ×3 | **PARTLY** | See navigation row. |
| P3 `lib/guides.ts` related rails of nine | **FIXED** | Every `related` block now has 4 links. |
| Five worst paragraphs (pass 4) | **2 FIXED, 3 OPEN** | #2 (passaggio In short) fixed by the cap; #5 (singer evidence card) fixed by `evidenceParagraph`. Still verbatim: #1 `content/lessons/room-check/your-range/slide-down-slide-up.md:39` (130 w), #3 `content/atlas/01-how-to-read-an-entry.md:26` (118 w, free chapter), #4 `content/book/07-range-is-not-one-number.md:30`. |
| Image opportunities | **PARTLY** | Covers, pull quotes, reference figures (glossary, `/learn/voice`), span histogram and byline landed on index/hub pages. No chapter, song or can-you-sing page renders a figure; `AuthorByline` is used on `/book`, `/atlas`, `/glossary` but the chapter templates still hand-roll their byline (`book/[slug]/page.tsx:203-216`, `atlas/[slug]/page.tsx:151-164`). |

---

## 2. New findings

Pinning tests were found by grepping `*.test.*` under `lib app components e2e scripts` for the quoted string. "None" means no test asserts that text.

### P1

**P1-1 · Song pages state the same five facts three times, and the octave rule twice** · `app/songs/[slug]/page.tsx:312` (subtitle), `:144-155, 366` (answer card), `components/songs/song-page.tsx:105-160` (`SongStats`), `:117-124` + `app/songs/[slug]/page.tsx:377-384`
For Amazing Grace the reader gets, in one screen:
> Subtitle: "The opening phrase of “Amazing Grace” runs from G3 to G4, 12 semitones, with its tonic on C4 at 70 bpm, and rates hard to sing. Origin: Traditional tune “New Britain” (American shape-note, printed 1829); words by John Newton, 1779."
> Card: "The opening phrase of “Amazing Grace” is transcribed here with its tonic on C4 at 70 bpm in 3 beats to the bar. The 14 notes span G3 to G4 (12 semitones, with 5 leaps of a major third or more), and the span and leaps together rate it hard to sing; a full 4-pass session runs about 1:12."
> Stats: "G3–G4 · 12 semitones as transcribed … Tonic C4 · Tempo 70 bpm · Meter 3 · Notes 14 · Difficulty Hard · One time through … A full session 1:12 · 4 passes · Leaps 5"

Range, tonic, tempo and difficulty appear three times; session length and leaps twice. The octave rule is also said twice: beside the button ("Opens Amazing Grace in the practice room, fitted to your measured range if you have taken the range test; if not, it opens in the written key and is scored in either octave. Free in the browser: song practice counts toward 10 free minutes…", 44 words) and under the range ("Once you have taken the range test, the practice room opens it fitted to your range… a lower voice can sing it an octave down and a higher voice an octave up", 55 words). The origin is printed three times too: subtitle, `PublicDomainNote` paragraph, and the "Attribution" `dd` (`song-page.tsx:232-244`). The header also has "Sing {title}" and the first card "Sing this song", same href.
**Fix:** subtitle = one line of what makes this melody distinct ("A rising fourth twice, then the fall to the low G on “sound”" — the data file's own comment at `components/songs/data.ts:222-224` is better copy than anything printed); drop the answer card's paragraph (keep its h2 + button + cap note as one line: "Fits your saved range; without one it opens as written and scores either octave. Counts toward your 10 free guided minutes."); cut the 55-word `SongStats` paragraph to "{n} semitones as transcribed."; drop "Origin:" from the subtitle and the Attribution `dd`. Keep `answerSentence` as the JSON-LD `description` only. **Effort S.** 27 pages. **Pinning:** `lib/song-page.test.ts:337-346` asserts both octave sentences ("is stated on every song page, by the button and by the written range") — change it to require one; `lib/song-page.test.ts:155, 172` comments say origin prints in the subtitle (assertions are on the data, not the page; safe); `components/songs/songs-client.test.ts:5` mentions "Sing this song" (deep-link regression; keep the button, drop the header duplicate or vice versa).

**P1-2 · The book's passaggio table, the atlas records "tables" and the voice-type roster are bullet lists** · `content/book/03-the-passaggio.md:28-37`, `content/atlas/26-the-records.md:9` + `scripts/compile-atlas.mjs:371-415`, `scripts/compile-atlas.mjs:418-441`
Book ch 3 introduces "The zones this book and the app both work from:" then 8 bullets of `**Bass:** G3 up to C4`; the Countertenor bullet carries a 33-word caveat inside a row. Atlas ch 26 says "The tables that follow are generated from the same data…" and the generator emits five lists of 12 bullets each (`- **Name** — **G1** in *Song*, from a cited G1–C4`). Atlas ch 27 is 636 bullets with code-span ranges. **Fix:** pipe tables (section 5): ch 3 `| Voice type | Zone starts | Zone ends |` with the countertenor caveat as a sentence under the table; `recordsMarkdown()` emits `| # | Singer | Note | Heard in | Cited range |`; `voiceTypesMarkdown()` emits `| Singer | Range |` per type. Better still for ch 3: a `::figure passaggio-zones` drawn from `VOICE_TYPE_PASSAGGIO`, which removes the hand-typed copy that `lib/voice-types.test.ts:201-209` exists to police. **Effort M** (renderer + both PDF renderers + compiler). **Pinning:** `lib/voice-types.test.ts:219-228` requires the literal `**${kind}:** X up to Y` in the chapter body — must change to parse table rows (or be deleted if the figure replaces the rows); `lib/book-pages.test.tsx:486` (E4-G4 sentence, unaffected).

**P1-3 · Free chapters say their "Try this" twice, and chapter 8's buttons four times** · `app/book/[slug]/page.tsx:34-58, 144-160, 220-249`
On the 3 free book chapters the action appears as header buttons, then in the chapter's own `## Try this` paragraph, then in a "Try this now" card that paraphrases the paragraph. Ch 12 card: "Stay silent for fifteen seconds and watch the trace: any pitch it shows is your room, not your voice." vs the body two inches above: "open the pitch studio and stay silent for fifteen seconds while you watch the trace. If it reports any pitch at all in your silence, find the noise and kill it before you test." Ch 8 prints "Warm up first…" + "Take the range test honestly" in the header and again in the card, each followed by the 30-word `WarmUpCapNote` (:69-77), so the cap note prints twice. **Fix:** keep the header buttons (first screen, PRODUCT.md principle 1); the end card keeps only `LessonList` and drops `tryIt.line` and the repeated buttons. **Effort S.** **Pinning:** `lib/book-pages.test.tsx:104-108` expects "Try this now" on each free chapter; `:113-121` expects exactly `["warm","test","warm","test"]` (header + card), so it pins the duplication; update both.

### P2

**P2-1 · `/can-you-sing/[slug]`: H1, subtitle, stat row and blurb all restate key and range** · `app/can-you-sing/[slug]/page.tsx:37-49, 160-161, 170-180`; `lib/pop-songs.ts` blurbs
Espresso: H1 "Can you sing “Espresso” by Sabrina Carpenter? Key and vocal range" → subtitle "“Espresso” by Sabrina Carpenter is in A minor, and the commonly cited lead-vocal range is G3–A4, 14 semitones, which on span and top note rates easy for an untrained voice." (31 words) → stats Key A minor · Low G3 · High A4 · Span 14 · Easy → blurb "A fourteen-semitone range (G3 to A4, a ninth) keeps the notes within reach on paper." 7 of 24 blurbs restate both endpoints. **Fix:** H1 "Can you sing “Espresso”?"; subtitle = the blurb's *second* idea ("The notes are easy; the behind-the-beat drawl and the light flips are the song."); keep `answerSentence` as `description`/JSON-LD; trim the endpoint clause from the 7 blurbs. Title tag already carries the query wording (`:70-74`). **Effort S.** **Pinning:** `components/can-you-sing/verdict.test.tsx` asserts "commonly cited lead-vocal range" (verdict copy, not the subtitle; check before editing `lib/pop-songs.ts` blurbs); no test pins the H1.

**P2-2 · Exit-test card sits above the chapter text and states the free cap twice** · `app/book/[slug]/page.tsx:166-190`, `components/book/program-link.tsx:252-268`
On the six programme-phase chapters a Pro reader opens the page to a 4-5-paragraph card before the first word of the chapter. On chapters 14, 18 and 19 (exit room breath or songs) the card says "Time there counts toward the free plan's 10 guided minutes a day; Pro removes the limit." and then `BookProgramNote` says "Its first week is free, and each day of that week fits inside the free plan's 10 guided minutes." **Fix:** move the card below the body for readers who have the body (Pro), keep it on top only in the locked state; drop the `GUIDED_ROOMS` cap clause (:178-179) since `BookProgramNote` already says it. **Effort S.** **Pinning:** `lib/programme-exit-tests.test.tsx:133, 143` ("Move on when" present/absent: position-agnostic); `lib/book-pages.test.tsx:239` pins "guided minutes a day; Pro removes the limit" (check which surface it renders).

**P2-3 · Song cards: label + h2 that says the label again, five times a page** · `components/songs/song-page.tsx:184-187, 230-231, 272-273`, `app/songs/[slug]/page.tsx:403-408, 432-435, 449-456`
"The phrase you sing" / "Amazing Grace lyrics and notes, as transcribed here"; "Why this one is free to sing" / "Origin and copyright status"; "Structure" / "How the arrangement is laid out"; "How it is filed" / "Genre, era and tags"; "Sing next" / "Other hard songs and more Hymn". Plus the 34-word footer "Every melody in the songbook is public domain, which is why the whole thing can be sung in a browser without a license…" on all 27 pages (`song-page.tsx:247-252`) and the phrase note "The songbook transcribes the opening phrase rather than the whole song, because 4 tight repetitions…" on 25 (`:209-214`). **Fix:** keep the h2 only, as a claim ("Free to sing: public domain since 1829"); the "How it is filed" card's only content is tags and one sentence: fold tags into the kicker row and cut the card; move the songbook-wide sentences to `/songs`. **Effort S.** **Pinning:** none found for these headings.

**P2-4 · Methodology describes three review states; 630 of 636 profiles show a fourth** · `app/singers/methodology/page.tsx:121-129, 91-93`
"Reviewed records name a human dataset editor, a review date, sources, and a confidence level… Pending records have not received that individual review." The dominant label, "Review confirmed" (`lib/singer-evidence.ts:263`; `data/singer-review-confirmation.json` scope: "records the status correction, not a new review date or new source verification"), has no sources or confidence level, so the page that defines the labels does not define the one readers see. The "Scope of this index" card is `SINGER_RANGE_DISCLAIMER` (40 words) under a label heading. Also the subtitle (44 words) and the first card's h2 and lede make the same point three times ("differ between sources because they count different things" / "Why do vocal range websites disagree?" / "Two range charts may be answering different questions"). **Fix:** add one sentence: "“Review confirmed” means the owner confirmed an earlier catalog review; it adds no new sources or dates, and the endpoints are still not checked against recordings." Subtitle → "Two charts can count different things. Here is what ours counts, and how to correct it." Truthful copy only; no indexing change. **Effort S.** **Pinning:** `lib/singer-editorial-routes.test.tsx:54` pins the heading "Scope of this index".

**P2-5 · Atlas ch 4: two sections named Onset, and the register colours as a run-on** · `content/atlas/04-a-vocabulary-for-tone.md:18-24, 44`
"## Vibrato: rate, width, onset" defines vibrato *onset* (when vibrato starts), then "## Onset" immediately defines note onset (how a note begins). Same word, two meanings, adjacent headings. Line 44 packs seven terms into 111 italicised words. Five of the chapter's 11 paragraphs exceed 90 words (avg sentence 20.3 w vs the book's 16). **Fix:** rename the vibrato dial "delay" ("rate, width, delay") and keep "Onset" for note onset; line 44 becomes a pipe table `| Term | Where it is made | Hear it in |` (7 rows, e.g. `| Belt | Chest-dominant, carried above the break | Reneé Rapp, Idina Menzel |`). **Effort S** (+ renderer). **Pinning:** none on text; `lib/book-pages.test.tsx:196-206` and `app/api/book/route.test.ts:75-85` use the slug only.

**P2-6 · Book ch 8 (free): a 165-word paragraph that is a two-column rule** · `content/book/08-reading-the-range-test.md:26`
"A note counts if it has an identifiable pitch, arrives without strain, and could be held for a beat or two. It does not count if it is a creak, a squeak, a breathy suggestion of a pitch, or something that arrived along with your neck… Falsetto and head voice do count…" **Fix:** keep the bold rule and one sentence of why; then `| Counts | Does not count |` with rows: clear pitch you could hold a beat or two / creak or fry; light, clear falsetto or head voice / breathy suggestion of a pitch; arrives without strain / a note your neck delivered. Then "Count falsetto the same way every time: it can move your top note several semitones." This is the free chapter the compiler comment calls "load-bearing for the free product" (`scripts/compile-book.mjs:44-50`). **Effort S.** **Pinning:** none.

**P2-7 · Atlas free chapters average 20-23 words a sentence and 4-5 paragraphs over 90 words each** · `content/atlas/01-*.md` (5 paragraphs >90 w), `03-*.md` (4, up to 130), `05-*.md` (7), `06-*.md` (5, up to 160)
Corpus: 95 of 715 book+atlas paragraphs exceed 90 words (book 43, atlas 52); atlas chapters 1-3 are the indexable sample a buyer judges. The book's 15.9 w/sentence on ch 3, 5 and 12 is the target. Rewrites for the worst are in section 4. **Effort M** (copy pass over 6 free + method chapters). **Pinning:** atlas compiler word-count validation (`scripts/compile-atlas.mjs`) — totals only.

**P2-8 · Atlas locked card: four buttons and a 50-word paragraph** · `components/atlas/reader.tsx:109-154`
"See what Pro includes", "Read a free chapter", "Already have Pro?", "Back to contents", under "The full contents — every chapter and every singer covered — is free on the contents page, and each singer's range page stays free too. So are the first 3 chapters, which teach the notation and the labels every entry after them uses. Pro unlocks the remaining chapter text, the entry notes, and the PDF of the whole book." 24 gated pages (noindex, correctly). **Fix:** "Chapters 1-3 and every singer's range page are free. Pro adds this chapter's text and entry notes, and the PDF." Drop "Back to contents" (the header pill already links there). **Effort S.** **Pinning:** none found.

### P3

**P3-1 · Changelog stops at Oct 24; three releases since** · `app/changelog/page.tsx:228-232`
The running log's newest entry is "24 · Suede Sing 4.0." #261-#263 (answer-first openings, example figures in every room, a song card's Sing opening straight into the count-in) are user-visible and unlogged. The page's Pro block (`:531-546`) also sits between the release stories and the running log, interrupting the record. **Fix:** add three October log lines; move the Pro block to the end. **Effort S.** **Pinning:** none.

**P3-2 · Atlas genre chapters call themselves "rooms"** · 12 occurrences in 10 chapters, e.g. `content/atlas/13-metal.md:13` "Two things to take from this room", `22-musical-theatre.md:13` "Steal three things from this room", `14-the-soul-men.md:11` "The room divides…"
Everywhere else "room" means a practice room (studio, recorder, warmups); PRODUCT.md asks for consistent terminology and for the reading/practicing distinction to hold. **Fix:** "this chapter" / "these voices". **Effort S.** **Pinning:** none.

**P3-3 · /learn: a meta-lede and a hedge before the content** · `app/learn/page.tsx:238-241, 280-284, 81, 99`
"This is the map for learning to sing, not another practice room. Each path below opens the part of Suede Sing built for that job, so a beginner can move from explanation to a real exercise without hunting through the site." / "This is an adaptable example, not a required duration or a promise of results. Shorten it to suit your experience and comfort; do not push through discomfort to finish a timer." Day 5 is 66 words, leading with the cap; Day 7's second sentence is 33 words. **Fix:** lede → "Pick the problem; each card opens the room built for it." Plan lede → "Four jobs, twenty minutes. Shorten any of them; never push through discomfort." Day 5 → "Warm up with hums and lip trills in the pitch studio, then practise one verse or chorus: slow the hard phrase and choose your breaths. Songs open in the range you measured on Day 1; shift a semitone at a time if a line still sits outside it." **Effort S.** **Pinning:** `lib/learn-hub.test.tsx:35` (the map sentence), `:103` (Day 5 opening).

**P3-4 · Glossary intro carries the free-cap sentence and a medical disclaimer** · `app/glossary/page.tsx:99-116`
A definitions page states "Warmups, ear training, breath drills and song practice share the free plan's 10 minutes of guided practice a day; the other rooms linked here have no daily limit." and "None of this is medical advice." Neither is a definition. **Fix:** intro = "One sentence per term, with the room where you can see it at work." **Effort S.** **Pinning:** `lib/glossary.test.ts:364-373` pins octave copy in entries, not this; none found for the intro.

**P3-5 · Stale comment: "the markdown renderer cannot link"** · `app/atlas/[slug]/page.tsx:35-37`
It can (`lib/markdown.tsx:17-22`, tested in `lib/book-pages.test.tsx:42-60`). The comment is the justification for the `TRY_IT` map; with links in prose the atlas free chapters could link the range test inline as the book does. **Effort S.**

**P3-6 · Chapter bylines hand-rolled twice** · `app/book/[slug]/page.tsx:203-216`, `app/atlas/[slug]/page.tsx:151-164`
`AuthorByline` (`components/book/byline.tsx`) exists and is used on three index pages. **Fix:** use it with a `chapter` prop. **Effort S.** **Pinning:** `lib/book-pages.test.tsx:105-106` (`rel="author"` + name; component keeps both).

**P3-7 · Book ch 5: the twang paragraph turns into a medical notice** · `content/book/05-resonance.md:50` (134 w)
Definition, efficiency claim, overdo warning, a self-check, a stop rule and the 20× doctor sentence in one paragraph. See section 4 #5.

---

## 3. Boilerplate table (templates in this lane)

| Text (quoted, trimmed) | Template · line | Pages affected |
|---|---|---|
| "Pain, hoarseness that will not clear, or any blood is a doctor's question rather than a practice one — chapter six says more." | book bodies (`content/book/*.md`) | 20 of 23 chapters |
| Facts ×3: subtitle "… runs from G3 to G4, 12 semitones, with its tonic on C4 at 70 bpm, and rates hard to sing. Origin: …" + answer card + `SongStats` | `app/songs/[slug]/page.tsx:312, 366`; `song-page.tsx:105-160` | 27 |
| Octave rule ×2: "…opens in the written key and is scored in either octave…" + "…a lower voice can sing it an octave down and a higher voice an octave up." | `app/songs/[slug]/page.tsx:377-384`; `song-page.tsx:117-124` | 27 |
| Origin ×3 (subtitle, public-domain paragraph, Attribution `dd`) | `app/songs/[slug]/page.tsx:312`; `song-page.tsx:232-244` | 27 |
| "Every melody in the songbook is public domain, which is why the whole thing can be sung in a browser without a license…" (34 w) | `song-page.tsx:247-252` | 27 |
| "The songbook transcribes the opening phrase rather than the whole song, because 4 tight repetitions…" | `song-page.tsx:209-214` | 25 |
| Header "Sing {title}" + card "Sing this song" (same href) | `app/songs/[slug]/page.tsx:323, 374` | 27 |
| Label + restating h2 pairs (×4-5 per page) | `song-page.tsx`, `app/songs/[slug]/page.tsx` | 27 |
| H1 "Can you sing “X” by Y? Key and vocal range" + subtitle restating title/artist/key/range + stat row | `app/can-you-sing/[slug]/page.tsx:160-180` | 24 |
| "Figures are the cited key and lead-vocal range (…), not lab measurements. No lyrics or melody are reproduced here…" | `can-you-sing/[slug]:196-208` | 24 |
| "A song's written range and a singer's reported catalog range are different facts…" | `can-you-sing/[slug]:241-245` | 24 (those with linked singers) |
| Verdict: "Compared against the commonly cited lead-vocal range, not a judgment…" + "These tools use exercises and public-domain melodies… Stop if singing feels strained." | `components/can-you-sing/verdict.tsx:223-227, 245-248` | 24 |
| "Try this" ×2-3 (header buttons, chapter `## Try this`, "Try this now" card) | `app/book/[slug]/page.tsx:144-160, 220-249` | 3 free book chapters |
| `WarmUpCapNote` (30 w) ×2 | `app/book/[slug]/page.tsx:69-77, 158, 236-240` | 1 (ch 8) |
| Exit card cap ×2 ("Time there counts toward…" + `BookProgramNote`) | `app/book/[slug]/page.tsx:178-179, 187` | 3 (ch 14, 18, 19) |
| "That was one of 3 free chapters. The remaining 20 (…) come with Suede Pro…" / atlas variant | `book/[slug]:272-277`; `atlas/[slug]:200-205` | 6 |
| Locked card + 3-4 CTAs | `components/book/reader.tsx:109-147`; `components/atlas/reader.tsx:109-154` | 20 + 24 (noindex) |
| Hand-rolled byline "By Jason Colapietro · Chapter N of …" | `book/[slug]:203-216`; `atlas/[slug]:151-164` | 6 free chapters |
| "← Contents" header pill | `atlas/[slug]:130-140` | 27 |
| Typeanswer tail "Range and voice type are different measurements, though…" (45 w) | `app/atlas/vocal-range-by-voice-type/page.tsx:203` | 8× on 1 page |
| Records caveats: subtitle + caution card + 3 table ledes + 3 FAQ openings + "None of these numbers is a target" | `app/singers/records/page.tsx:125-141, 187-284` | ~11 on 1 page |
| "Borrow from / take from / Steal … from this room" | atlas genre chapter bodies | 10 chapters |

---

## 4. Five worst sentences/paragraphs, with rewrites

**1. `content/atlas/06-the-safety-rail.md:28`** (147-word paragraph; final sentence 73 words, two em-dash parentheticals nested in one clause; this is the atlas's safety rule)
> Hoarseness that stops clearing, a morning voice that stays rough past a fortnight, a note that used to be easy and reliably is not — that is no longer a technique question, and the person to see is a doctor who can examine the vocal folds — an ENT or laryngologist, often working with a voice-specialist speech-language pathologist — without a waiting period and without needing to be sure it is serious first.

Rewrite (as the table the paragraph already is, after "Beyond that, three bright lines."):

| Sign | What it means | What to do |
|---|---|---|
| Pain while singing | A stop sign | Stop for the session |
| Hoarseness that clears overnight | The habit costs too much | Practise less of it |
| Hoarseness that does not clear, a rough morning voice past two weeks, an easy note that is gone | Not a technique question | See an ENT or laryngologist. No waiting period; you need not be sure it is serious. |

**2. `content/atlas/05-how-to-borrow-a-voice.md:26`** (61-word sentence, a ranked list with a nested colon list inside its last item)
> The order that works: rhythm and phrasing first (cheapest, safest, most distinctive), then vowel color and placement, then onset and vibrato behavior, then — last, and only in comfortable range — weight and grit, with grit kept to the next chapter's rules: quiet before loud, none that leaves you hoarse, and a teacher's ears on it as soon as you can.

Rewrite (renders today as bullets; as a table once tables exist):
> Borrow in this order:
> - **Rhythm and phrasing.** Cheapest, safest, most distinctive.
> - **Vowel colour and placement.**
> - **Onset and vibrato.**
> - **Weight and grit, last,** and only in comfortable range. Grit follows the next chapter's rules: quiet before loud, none that leaves you hoarse, a teacher's ears as soon as you can.

**3. `content/book/08-reading-the-range-test.md:26`** (165 words, the longest paragraph in the free sample) → see P2-6 for the two-column table rewrite (≈70 words including the table).

**4. `app/songs/[slug]/page.tsx:154`** (template sentence on 27 pages; second sentence 37 words, three numbers in parentheses, then a semicolon tail)
> The 14 notes span G3 to G4 (12 semitones, with 5 leaps of a major third or more), and the span and leaps together rate it hard to sing; a full 4-pass session runs about 1:12.

Rewrite (JSON-LD only; the stat row shows the numbers):
> Fourteen notes from G3 to G4, with five leaps of a third or more. That span and those leaps rate it hard. Four passes take about a minute.

**5. `content/book/05-resonance.md:50`** (134 words; definition, warning, test, stop rule and the 20× doctor sentence)
> Contemporary singers get a related effect from twang, narrowing the same region to add a ringing, sometimes nasal-sounding edge. Twang is efficient rather than effortful. … One rough check: if the brightness costs you nothing and you can still sing the same phrase quietly, it is coming from resonance. If holding it takes gripping, if your throat tightens, or if the sound turns rough, stop and go back to the plainer version — that is force, and force is not something to practise through. Pain, hoarseness that will not clear, or any blood is a doctor's question rather than a practice one — chapter six says more.

Rewrite (72 words):
> Contemporary singers get a related ring from twang: narrowing the same region for a bright, sometimes nasal edge. It brightens by reshaping the tube, not by pushing air, and it is easy to overdo. The check: if the brightness costs nothing and you can sing the same phrase quietly, it is resonance. If it takes gripping, a tight throat or a rough edge, it is force. Go back to the plain version.

(The doctor line is already said by chapter 6 and the site's `SafetyLine`; cut it here and in the 19 other chapters, keeping it in ch 6 and once in ch 1.)

Runners-up: `content/book/13-how-the-program-works.md:52` (52-word storage sentence: split at "keep the file outside the browser."), `content/atlas/23-latin-voices.md:9` (57-word list of six genres: make it a bullet list), `content/atlas/26-the-records.md:9` (restates the page subtitle almost word for word: "the lowest cited floors, the highest cited ceilings, the widest spans, and the short roster of voices with a documented whistle register"; cut to "Everything here is generated from the same data as the entries.").

---

## 5. Markdown extension proposal

### Syntax

**Pipe table** (GitHub subset: header row, separator row, body rows; no alignment, no multi-line cells):
```
| Voice type | Zone starts | Zone ends |
|---|---|---|
| Bass | G3 | C4 |
| Tenor | D4 | G4 |
```
First column renders as `<th scope="row">`. Cells take the existing inline grammar (bold, italic, code, site links).

**Figure directive**: one line, an id from a fixed registry, optional `key=value` args, optional caption after `|`:
```
::figure range-test | What the range test reports: two notes, and every key between them.
::figure strip low=C3 high=C6 belt=A5 | A full-voice ceiling (dashed) well below the cited top.
```
Unknown ids render nothing at runtime and fail a test (below), so a typo cannot ship a raw `::figure` line.

### Code (≈70 lines in `lib/markdown.tsx` + a 35-line registry)

`lib/markdown-figures.tsx` (new; every import is hook-free and server-safe, and also safe in the two `"use client"` readers because none uses hooks; it deliberately does not import singer data, so the client chapter bundle stays small):
```tsx
import type { ReactNode } from "react";
import { PianoRollFigure, RangeFigure, SpectrogramFigure, TraceFigure, WaveformFigure } from "@/components/figures";
import { ReferenceFigure, type ReferenceFigureKind } from "@/components/learn/reference-figure";
import { ChromaticStrip } from "@/components/singers/chromatic-strip";
import { labelToMidi } from "@/lib/audio/notes";

type Args = Record<string, string>;
const ref = (kind: ReferenceFigureKind) => () => <ReferenceFigure kind={kind} className="h-24 w-auto" />;

export const MARKDOWN_FIGURES: Record<string, (a: Args) => ReactNode> = {
  "range-test": () => <RangeFigure />,
  "pitch-trace": () => <TraceFigure />,
  "piano-roll": () => <PianoRollFigure />,
  waveform: () => <WaveformFigure />,
  spectrogram: () => <SpectrogramFigure />,
  semitone: ref("semitone"),
  registers: ref("registers"),
  spans: ref("spans"),
  support: ref("support"),
  harmonics: ref("harmonics"),
  strip: (a) => {
    const low = labelToMidi(a.low ?? ""), high = labelToMidi(a.high ?? "");
    if (low == null || high == null) return null;
    return <ChromaticStrip low={low} high={high} beltMidi={a.belt ? labelToMidi(a.belt) : null} label={a.label} />;
  },
};
```

In `lib/markdown.tsx`:
```tsx
import { FigureFrame } from "@/components/figures";
import { MARKDOWN_FIGURES } from "@/lib/markdown-figures";

const FIGURE = /^::figure\s+([a-z-]+)((?:\s+[a-z]+=[^\s|]+)*)\s*(?:\|\s*(.+))?$/;
const TABLE_SEP = /^\|?(\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?$/;
const cells = (l: string) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

// state, beside para/list/quote:
let table: string[] | null = null;
const flushTable = () => {
  if (!table) return;
  const rows = table; table = null;
  const hasHead = rows.length > 1 && TABLE_SEP.test(rows[1]);
  const head = hasHead ? cells(rows[0]) : null;
  const body = rows.slice(hasHead ? 2 : 0).map(cells);
  const key = k++;
  blocks.push(
    <div key={`t${key}`} className="mt-6 overflow-x-auto">
      <table className="w-full border-collapse text-left text-[0.95rem] leading-snug">
        {head && (
          <thead><tr>{head.map((c, i) => (
            <th key={i} scope="col" className="border-b border-line2 py-2 pr-4 font-mono text-[11px] font-normal uppercase tracking-[0.12em] text-dim">{renderInline(c, `t${key}-h${i}`)}</th>
          ))}</tr></thead>
        )}
        <tbody>{body.map((r, ri) => (
          <tr key={ri} className="border-b border-line/60 align-top">{r.map((c, ci) => ci === 0
            ? <th key={ci} scope="row" className="py-2 pr-4 font-medium text-ink">{renderInline(c, `t${key}-${ri}-${ci}`)}</th>
            : <td key={ci} className="py-2 pr-4 text-ink/85">{renderInline(c, `t${key}-${ri}-${ci}`)}</td>)}</tr>
        ))}</tbody>
      </table>
    </div>,
  );
};
// flushAll() gains flushTable(); flushPara/flushList/flushQuote callers that
// start a new block also call flushTable().

// in the line loop, before the heading test:
const fig = FIGURE.exec(line.trim());
if (fig) {
  flushAll();
  const draw = MARKDOWN_FIGURES[fig[1]];
  const args = Object.fromEntries(fig[2].trim().split(/\s+/).filter(Boolean).map((p) => p.split("=") as [string, string]));
  const drawn = draw?.(args);
  if (drawn) blocks.push(
    <figure key={`f${k++}`} className="mt-8">
      <FigureFrame caption={fig[3] ? renderInline(fig[3], `f${k}`) : undefined}><div className="p-4">{drawn}</div></FigureFrame>
    </figure>,
  );
  continue;
}
if (line.trimStart().startsWith("|")) {
  flushPara(); flushList(); flushQuote();
  (table ??= []).push(line);
  continue;
}
// …and the paragraph/bullet/quote/heading branches each call flushTable() first.
```
`FigureFrame`'s caption is a `<p>`; for semantics pass the caption into a `<figcaption>` instead (a 3-line change to `components/figures/frame.tsx` adding an `as="figure"` option) so the `aria-hidden` reference figures still have their meaning in text.

### Also required (or the PDFs print raw pipes)
- `scripts/build-book-pdf.mjs` and `scripts/build-atlas-pdf.mjs` each have their own `mdToHtml` (book `:55-97`, atlas `:35-60`). Add the same table branch (emit `<table>` with `esc()`/`inline()` per cell) and make `::figure` lines emit `<p class="fig-caption"><em>{caption}</em></p>` (the PDF cannot render the React figures without a server render step). Rebuild both PDFs.
- Tests in `lib/book-pages.test.tsx` beside the existing `markdown links` block: a table renders `<table>`/`<th scope="col">`, no raw `|` reaches HTML; `::figure range-test` renders an `<svg>`; an unknown id renders nothing; and one test that every `::figure` id in `BOOK`/`ATLAS` bodies is a key of `MARKDOWN_FIGURES`.
- `lib/voice-types.test.ts:219-228` changes from `**Bass:** G3 up to C4` to matching `| Bass | G3 | C4 |`.

### Which chapters would use it

| Chapter | Use | Replaces |
|---|---|---|
| Book 3 The passaggio | table `Voice type / Zone starts / Zone ends` (8 rows); `::figure registers` | 8 bullets (`:30-37`) |
| Book 8 Reading the range test (free) | table `Counts / Does not count`; `::figure range-test` | 165-word paragraph (`:26`) |
| Book 12 When the numbers lie (free) | table `Tell / Usually means` for the five mid-session tells | 80-word run-on (`:75`) |
| Book 5 Resonance | `::figure spectrogram` beside "Brightness, and why some voices carry" (its aria label already names the 2.8-3.2 kHz ring band) | prose only |
| Book 1 What your voice is (free) | `::figure harmonics` | prose only |
| Book 2 Registers / 10 Finding your break | `::figure registers` | prose only |
| Book 4 Breath | `::figure support` | prose only |
| Book 7 Range is not one number | `::figure spans` | prose only |
| Book 9 Pitch accuracy | `::figure pitch-trace` | prose only |
| Book 19-21 songs, transposition | `::figure piano-roll` | prose only |
| Atlas 1 How to read an entry (free) | `::figure strip low=… high=… belt=…` next to the full-voice-ceiling paragraph | 118-word paragraph (`:26`) |
| Atlas 2 Notes, octaves and the keyboard (free) | `::figure semitone`, `::figure range-test` | prose only |
| Atlas 4 A vocabulary for tone | table `Term / Where it is made / Hear it in` (7 rows) | 111-word italic run-on (`:44`) |
| Atlas 6 The safety rail | table `Sign / What it means / What to do` | 73-word sentence (`:28`) |
| Atlas 26 The records | `recordsMarkdown()` emits 5 tables | 60 bullets under "The tables that follow" |
| Atlas 27 Every voice by type | `voiceTypesMarkdown()` emits 8 two-column tables | 636 bullets |

---

## 6. What is good

- The book's prose is the house standard: ch 3, 5 and 12 average 15.8-16.1 words a sentence, ch 12 has no paragraph over 90 words, and every chapter outside the programme ends on a "Try this" that names one room and one action, enforced by `lib/book-pages.test.tsx` (every link resolves to a real `page.tsx`).
- Ch 3's "a place you go through rather than a thing that stops you" and ch 12's "Bad data does not feel like bad data. It feels like a verdict." are the voice the atlas should match.
- Book ch 3's numbers are tested against `VOICE_TYPE_PASSAGGIO` (`lib/voice-types.test.ts:210-236`), so book, atlas page and app cannot disagree.
- Song pages are carefully truthful about partial transcriptions: `isPhrase`/`isPartial` keep "lyrics" and `musicalKey` off phrase pages and out of JSON-LD (`app/songs/[slug]/page.tsx:52-77, 289-294`), and each line of lyrics prints its notes, the one thing a reader cannot get elsewhere.
- `/can-you-sing` rating sentences name which input decided the rating (`popDifficultyReason`), with the reason documented next to the function.
- Pass 4's fixes held: hub copy, course headers, the guides rails, the In-short cap with a compiler error, and the `--check` test over all four generated files.
- Free chapters render server-side and gated ones are `pageRobots(false)` shells only; every singer profile stays `pageRobots(true)` (`app/singers/[slug]/page.tsx:184`), as AGENTS.md requires. None of the proposals above changes either.
- The glossary is tight: 42 terms, only four definitions over 30 words ("Sharp and flat" 47, "Interval" 40, "Twang" 34, "Vocal dose" 33), each with a room link and the five reference figures beside their groups.
