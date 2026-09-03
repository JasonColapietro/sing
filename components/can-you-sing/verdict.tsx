"use client";

import { midiToLabel } from "@/lib/audio/notes";
import {
  popFit,
  popRangeLabel,
  type PopSong,
} from "@/lib/pop-songs";
import { useProgress } from "@/lib/progress";
import { songFirstPractice } from "@/lib/song-first-practice";
import { FreeOnly } from "@/components/pro/gate";
import { Card, LinkButton, SectionLabel } from "@/components/ui";

/**
 * The personal answer on a popular-song page. Server HTML carries all the
 * factual content; this block hydrates against the visitor's saved range test
 * and is the only part of the page that differs per visitor. With no saved
 * range it sells the test instead of rendering an empty comparison.
 */
export function CanYouSingVerdict({ song }: { song: PopSong }) {
  const progress = useProgress();
  const fit = popFit(song, progress.range);
  const practice = songFirstPractice(fit, progress.range);

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
          <LinkButton href="/range">Find your range free</LinkButton>
        </div>
      </Card>
    );
  }

  const low = progress.range.lowMidi as number;
  const high = progress.range.highMidi as number;
  const yours = `${midiToLabel(low)}–${midiToLabel(high)}`;

  const message =
    fit.verdict === "fits"
      ? `As written, ${song.title} sits inside your range. The top of the song leaves you ${high - song.highMidi} semitone${high - song.highMidi === 1 ? "" : "s"} of headroom.`
      : fit.verdict === "high"
        ? `The top of ${song.title} is ${fit.offsetSemis} semitone${fit.offsetSemis === 1 ? "" : "s"} above your tested ceiling of ${midiToLabel(high)}. Dropping the key by ${fit.offsetSemis} would bring it inside.`
        : fit.verdict === "low"
          ? `The low end of ${song.title} is ${fit.offsetSemis} semitone${fit.offsetSemis === 1 ? "" : "s"} below your tested floor of ${midiToLabel(low)}. Raising the key by ${fit.offsetSemis} would bring it inside.`
          : `${song.title} spans more semitones than your tested range covers, so no key change puts every note inside that saved range. Start with a smaller pattern rather than pushing for the extremes.`;

  return (
    <Card>
      <SectionLabel>Can you sing it?</SectionLabel>
      <p className="mt-3 text-sm text-ink">{message}</p>
      <p className="mt-2 text-xs text-mut">
        Your saved range: {yours}. Song as written: {popRangeLabel(song)}.
      </p>
      <p className="mt-4 text-xs text-dim">
        Compared against the commonly cited studio-version range, not a
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
        <LinkButton href="/range" variant="ghost" size="sm">
          Retest your range
        </LinkButton>
      </div>
    </Card>
  );
}
