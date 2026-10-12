"use client";

import { midiToLabel } from "@/lib/audio/notes";
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
import { Card, LinkButton, SectionLabel } from "@/components/ui";

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
 * The page's one action, in the header where a phone sees it on the first
 * screen. The full verdict card sits under the stats, which put its button
 * a screen and a half down. With no saved range this starts the test; with
 * one it points at the personal answer below.
 */
export function CanYouSingAction({ song }: { song: PopSong }) {
  const progress = useProgress();
  return popFit(song, progress.range).verdict === "unknown" ? (
    <LinkButton href={rangeTestFor(song)}>Test my range for this song</LinkButton>
  ) : (
    // `#fit` is the wrapper around CanYouSingVerdict on the song page. Not a
    // shared constant: a server page importing a value from this client
    // module would get a client reference, not the string.
    <LinkButton href="#fit" variant="outline">
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
  const fit = popFit(song, progress.range);

  if (fit.verdict === "unknown") {
    return (
      <Card>
        <SectionLabel>Can you sing it?</SectionLabel>
        <p className="mt-3 text-sm text-mut">
          This song asks for {popRangeLabel(song)}. Take the free range test
          and this page will tell you whether it sits inside your voice — and
          by how much when it does not.
        </p>
        <div className="mt-4">
          <LinkButton href={rangeTestFor(song)}>
            {/* Quoted: several titles are styled lowercase ("vampire", "drop dead"). */}
            See if “{song.title}” fits my voice
          </LinkButton>
        </div>
      </Card>
    );
  }

  const low = progress.range.lowMidi as number;
  const high = progress.range.highMidi as number;
  const yours = `${midiToLabel(low)}–${midiToLabel(high)}`;

  // The range test reports limits, not a comfortable band, so an end note on
  // (or a semitone inside) a tested limit is not called a plain fit, and key
  // advice names the shift that centres the song when it differs from the
  // minimum one that parks an end on a limit. Centring a song that is no
  // wider than the range keeps both ends inside it. A song that already fits
  // is only told to move when centring leaves at least two semitones at each
  // end, so the advice never lands it on the limit this message warns about.
  const headroom = high - song.highMidi;
  const footroom = song.lowMidi - low;
  const centre = Math.round((low + high) / 2 - (song.lowMidi + song.highMidi) / 2);
  const roomToCentre = headroom + footroom >= 4;
  const limitsNote = "A range test finds your limits, not your comfortable band";

  // A song pitched for a higher or lower voice is usually sung an octave away
  // in its written key (the either-octave rule the songbook scores by). When
  // that octave puts every note inside the saved range, say so, and practise
  // for a fit rather than for the extreme the written octave misses.
  const octave = fit.verdict === "high" ? -12 : fit.verdict === "low" ? 12 : 0;
  const octLow = song.lowMidi + octave;
  const octHigh = song.highMidi + octave;
  const octaveFits = octave !== 0 && octLow >= low && octHigh <= high;
  const octaveEdge = high - octHigh <= 1 ? "top" : octLow - low <= 1 ? "bottom" : null;
  const octaveNote = octaveFits
    ? ` Sung an octave ${octave < 0 ? "lower" : "higher"} in the written key, it runs ${popNoteLabel(song, octLow)}–${popNoteLabel(song, octHigh)}, inside your tested range${octaveEdge ? `. ${limitsNote}, so expect the ${octaveEdge} of it to be work` : ""}.`
    : "";
  const practice = songFirstPractice(
    octaveFits ? { verdict: "fits", offsetSemis: 0 } : fit,
    progress.range,
  );

  const message =
    fit.verdict === "fits"
      ? headroom <= 1
        ? `As written, every note of ${song.title} is inside your tested range, but its top note is ${headroom === 0 ? "your tested ceiling" : "one semitone under your tested ceiling"}. ${limitsNote}, so expect the top of this song to be work.${roomToCentre && -centre >= 1 ? ` Dropping the key by ${-centre} centres it in your range.` : ""}`
        : footroom <= 1
          ? `As written, every note of ${song.title} is inside your tested range, but its lowest note is ${footroom === 0 ? "your tested floor" : "one semitone above your tested floor"}. ${limitsNote}, so expect the bottom of this song to be work.${roomToCentre && centre >= 1 ? ` Raising the key by ${centre} centres it in your range.` : ""}`
          : `As written, ${song.title} sits inside your range. The top of the song leaves you ${headroom} semitones of headroom.`
      : fit.verdict === "high"
        ? `The top of ${song.title} is ${fit.offsetSemis} semitone${fit.offsetSemis === 1 ? "" : "s"} above your tested ceiling of ${midiToLabel(high)}. Dropping the key by ${fit.offsetSemis} would bring it inside, with the top note on that ceiling${-centre > fit.offsetSemis ? `; dropping it by ${-centre} centres it in your range` : ""}.${octaveNote}`
        : fit.verdict === "low"
          ? `The low end of ${song.title} is ${fit.offsetSemis} semitone${fit.offsetSemis === 1 ? "" : "s"} below your tested floor of ${midiToLabel(low)}. Raising the key by ${fit.offsetSemis} would bring it inside, with the bottom note on that floor${centre > fit.offsetSemis ? `; raising it by ${centre} centres it in your range` : ""}.${octaveNote}`
          : `${song.title} spans more semitones than your tested range covers, so no key change puts every note inside that saved range. Start with a smaller pattern rather than pushing for the extremes.`;

  return (
    <Card>
      <SectionLabel>Can you sing it?</SectionLabel>
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
