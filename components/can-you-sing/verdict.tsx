"use client";

import {
  popFit,
  popNoteLabel,
  popRangeLabel,
  type PopSong,
} from "@/lib/pop-songs";
import { FREE_DAILY_MINUTES } from "@/lib/practice-limits";
import { useProgress } from "@/lib/progress";
import { songFirstPractice } from "@/lib/song-first-practice";
import { rangeTestHref } from "@/lib/site";
import { FreeOnly } from "@/components/pro/gate";
import { prepaintMarker, useHydrated } from "@/components/prepaint";
import { Card, LinkButton, SectionLabel, jumpInPage } from "@/components/ui";

/**
 * The range test, told which song to send the visitor back to: the result
 * screen reads `check=<slug>` and offers the way back to this song's verdict
 * rather than leaving the visitor to find the page again. `#start` lands a
 * phone on the start button rather than on the intro above it.
 */
function rangeTestFor(song: PopSong): string {
  return rangeTestHref({ check: song.slug });
}

/**
 * The header action's width, shared by both of its labels. The saved-range
 * label replaces the server's after the first paint, so it must take the same
 * room or the header moves: "Test my range for this song" is 222px and "See
 * how it fits your range ↓" 226px in the production build, which moved the
 * right-aligned action on a tablet and a desktop.
 */
const ACTION_WIDTH = "min-w-[14.5rem]";

/**
 * The page's one action, in the header where a phone sees it on the first
 * screen. The full verdict card sits under the stats, which put its button
 * a screen and a half down. With no saved range this starts the test; with
 * one it points at the personal answer below.
 */
export function CanYouSingAction({ song }: { song: PopSong }) {
  const progress = useProgress();
  return popFit(song, progress.range).verdict === "unknown" ? (
    <LinkButton href={rangeTestFor(song)} className={ACTION_WIDTH}>
      Test my range for this song
    </LinkButton>
  ) : (
    // `#fit` is the wrapper around CanYouSingVerdict on the song page. Not a
    // shared constant: a server page importing a value from this client
    // module would get a client reference, not the string. A plain anchor
    // with the history repair (jumpInPage in components/ui.tsx): next/link
    // makes no navigation once the address already ends in #fit, so a second
    // tap did nothing, and the Tab starting point stayed at the top.
    <LinkButton
      href="#fit"
      fullLoad
      onClick={jumpInPage}
      variant="outline"
      className={ACTION_WIDTH}
    >
      See how it fits your range ↓
    </LinkButton>
  );
}

/**
 * The personal answer on a popular-song page. Server HTML carries all the
 * factual content; this block hydrates against the visitor's saved range test
 * and is the only part of the page that differs per visitor. With no saved
 * range it sells the test instead of rendering an empty comparison.
 */
export function CanYouSingVerdict({ song }: { song: PopSong }) {
  const progress = useProgress();
  const hydrated = useHydrated();
  const fit = popFit(song, progress.range);

  if (fit.verdict === "unknown") {
    // Until hydration this is every visitor's card, and for one with a saved
    // range the personal answer, three times its height, replaces it once the
    // range is read. The slot (app/globals.css "song-verdict") holds it at
    // about that height from the first paint when the pre-paint script found
    // a saved range, so the cards under it are already near where they end up.
    return (
      <div className="flex flex-col" {...prepaintMarker(hydrated, { slot: "song-verdict" })}>
        <Card className="flex-1">
          <SectionLabel>Your fit</SectionLabel>
          <p className="mt-3 text-sm text-mut">
            This song asks for {popRangeLabel(song)}. Take the free range test
            and this page will tell you whether it sits inside your voice, and
            by how much when it does not.
          </p>
          <div className="mt-4">
            <LinkButton href={rangeTestFor(song)} variant="outline">
              {/* Quoted: several titles are styled lowercase ("vampire", "drop dead"). */}
              See if “{song.title}” fits my voice
            </LinkButton>
          </div>
        </Card>
      </div>
    );
  }

  const low = progress.range.lowMidi as number;
  const high = progress.range.highMidi as number;
  // Spelled in the song's key, like the song's own notes beside it: a flat
  // key's Bb4 against a saved A#4 reads as two notes when it is one.
  const yours = `${popNoteLabel(song, low)}–${popNoteLabel(song, high)}`;

  // The range test reports limits, not a comfortable band, so an end note on
  // (or a semitone inside) a tested limit is not called a plain fit, and key
  // advice names the shift that centres the song when it differs from the
  // minimum one that parks an end on a limit. In every branch, centring is
  // offered only when it leaves at least two semitones at each end, so the
  // advice never lands the song on the limit this message warns about.
  const headroom = high - song.highMidi;
  const footroom = song.lowMidi - low;
  const centre = Math.round((low + high) / 2 - (song.lowMidi + song.highMidi) / 2);
  // Semitones the saved range has to spare. A key change keeps this the same:
  // the minimum shift parks one end on a limit and leaves the other `slack`
  // inside its limit; centring splits it, so only slack >= 4 leaves two
  // semitones at each end.
  const slack = high - low - (song.highMidi - song.lowMidi);
  const roomToCentre = slack >= 4;
  const limitsNote = "A range test finds your limits, not your comfortable band";
  // Quoted: several titles are styled lowercase ("vampire", "drop dead").
  const name = `“${song.title}”`;
  // After the minimum shift, the end that did not move can land on (or a
  // semitone inside) the opposite limit too. Name it rather than letting the
  // advice silently park the song's other extreme on a limit.
  const otherEnd = (end: "top" | "lowest") =>
    slack > 1
      ? ""
      : ` That also puts its ${end} note ${
          end === "top"
            ? slack === 0 ? "on your tested ceiling" : "one semitone under your tested ceiling"
            : slack === 0 ? "on your tested floor" : "one semitone above your tested floor"
        }, so expect both ends of the song to be work.`;

  // A song pitched for a higher or lower voice is usually sung an octave away
  // in its written key (the either-octave rule the songbook scores by). When
  // that octave puts every note inside the saved range, say so, and practise
  // for a fit rather than for the extreme the written octave misses.
  const octave = fit.verdict === "high" ? -12 : fit.verdict === "low" ? 12 : 0;
  const octLow = song.lowMidi + octave;
  const octHigh = song.highMidi + octave;
  const octaveFits = octave !== 0 && octLow >= low && octHigh <= high;
  const octTop = high - octHigh <= 1;
  const octBottom = octLow - low <= 1;
  const octaveEdge = octTop && octBottom ? "top and bottom" : octTop ? "top" : octBottom ? "bottom" : null;
  const octaveNote = octaveFits
    ? ` Sung an octave ${octave < 0 ? "lower" : "higher"} in the written key, it runs ${popNoteLabel(song, octLow)}–${popNoteLabel(song, octHigh)}, inside your tested range${octaveEdge ? `. ${limitsNote}, so expect the ${octaveEdge} of it to be work` : ""}.`
    : "";
  const practice = songFirstPractice(
    octaveFits ? { verdict: "fits", offsetSemis: 0 } : fit,
    progress.range,
  );

  // Twelve semitones is the written key an octave away, which octaveNote
  // names, not a key change; a move past twelve is that octave (or two) plus
  // the rest. No sentence asks for a key change of an octave or more, which
  // no key control (the songbook's stops at twelve) offers.
  const shift = (verb: "dropping" | "raising", semis: number, short: boolean) => {
    if (semis < 12) return `${verb} ${short ? "it" : "the key"} by ${semis}`;
    const octaves = Math.floor(semis / 12);
    const rest = semis % 12;
    return `singing it ${octaves === 1 ? "an octave" : `${octaves === 2 ? "two" : octaves} octaves`} ${verb === "dropping" ? "lower" : "higher"}${rest ? ` and ${verb} the key by ${rest} more` : ""}`;
  };
  const lead = (words: string) => words.charAt(0).toUpperCase() + words.slice(1);
  const semitones = `${fit.offsetSemis} semitone${fit.offsetSemis === 1 ? "" : "s"}`;
  // Over or under the limit: the minimum shift parks that end on it, and the
  // centring shift (when there is room for one) is named after it.
  const outside = (
    verb: "dropping" | "raising",
    opening: string,
    landing: string,
    centring: number,
    other: string,
  ) =>
    fit.offsetSemis === 12
      ? `${opening}${octaveNote}${roomToCentre && centring > 12 ? ` ${lead(shift(verb, centring, false))} centers it in your range.` : ""}`
      : `${opening} ${lead(shift(verb, fit.offsetSemis, false))} would bring it inside, ${landing}${
          // A centring shift of exactly twelve is the octave octaveNote names.
          roomToCentre && centring > fit.offsetSemis && centring !== 12
            ? `; ${shift(verb, centring, true)} centers it in your range`
            : ""
        }.${other}${octaveNote}`;

  const message =
    fit.verdict === "fits"
      ? headroom <= 1 && footroom <= 1
        ? `As written, every note of ${name} is inside your tested range, but its top note is ${headroom === 0 ? "your tested ceiling" : "one semitone under your tested ceiling"} and its lowest note is ${footroom === 0 ? "your tested floor" : "one semitone above your tested floor"}. ${limitsNote}, so expect both ends of this song to be work.`
        : headroom <= 1
          ? `As written, every note of ${name} is inside your tested range, but its top note is ${headroom === 0 ? "your tested ceiling" : "one semitone under your tested ceiling"}. ${limitsNote}, so expect the top of this song to be work.${roomToCentre && -centre >= 1 ? ` ${lead(shift("dropping", -centre, false))} centers it in your range.` : ""}`
          : footroom <= 1
            ? `As written, every note of ${name} is inside your tested range, but its lowest note is ${footroom === 0 ? "your tested floor" : "one semitone above your tested floor"}. ${limitsNote}, so expect the bottom of this song to be work.${roomToCentre && centre >= 1 ? ` ${lead(shift("raising", centre, false))} centers it in your range.` : ""}`
            : `As written, ${name} sits inside your range. The top of the song leaves you ${headroom} semitones of headroom.`
      : fit.verdict === "high"
        ? outside(
            "dropping",
            `The top of ${name} is ${semitones} above your tested ceiling of ${popNoteLabel(song, high)}.`,
            "with the top note on that ceiling",
            -centre,
            otherEnd("lowest"),
          )
        : fit.verdict === "low"
          ? outside(
              "raising",
              `The low end of ${name} is ${semitones} below your tested floor of ${popNoteLabel(song, low)}.`,
              "with the bottom note on that floor",
              centre,
              otherEnd("top"),
            )
          : `${name} spans more semitones than your tested range covers, so no key change puts every note inside that saved range. Start with a smaller pattern rather than pushing for the extremes.`;

  return (
    <Card>
      <SectionLabel>Your fit</SectionLabel>
      <p className="mt-3 text-sm text-ink">{message}</p>
      <p className="mt-2 text-xs text-mut">
        Your saved range: {yours}. Song as written: {popRangeLabel(song)}.
      </p>
      <p className="mt-4 text-xs text-dim">
        Compared against the commonly cited lead-vocal range, not a
        judgment of your voice on this material. Note bounds alone do not
        establish comfort, tone, or readiness to perform it.
      </p>
      {practice && (
        <section aria-label="Your first practice" className="mt-6 border-t border-line pt-5">
          <h2 className="text-lg text-ink">Your first practice</h2>
          <p className="mt-2 text-sm text-mut">{practice.free.reason}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <LinkButton href={practice.free.href} size="sm">
              {practice.free.label}
            </LinkButton>
          </div>
          {/* Songs and warmups are guided practice, on the free day's clock; the studio is not. */}
          {!practice.free.href.startsWith("/studio") && (
            <FreeOnly>
              <p className="mt-2 text-xs text-mut">
                Guided practice is free for {FREE_DAILY_MINUTES} minutes a day.
              </p>
            </FreeOnly>
          )}
          <p className="mt-3 text-xs text-dim">
            These tools use exercises and public-domain melodies, not this
            popular song’s audio or melody. Stop if singing feels strained.
          </p>
          <FreeOnly>
            <div className="mt-5 border-t border-line pt-4">
              <SectionLabel>Optional with Pro</SectionLabel>
              <p className="mt-2 text-xs text-mut">{practice.pro}</p>
              <div className="mt-3">
                <LinkButton href="/pro#plans" variant="outline" size="sm">
                  See Pro plans
                </LinkButton>
              </div>
            </div>
          </FreeOnly>
        </section>
      )}
      <div className="mt-5">
        <LinkButton href={rangeTestFor(song)} variant="ghost" size="sm">
          Retest your range
        </LinkButton>
      </div>
    </Card>
  );
}
