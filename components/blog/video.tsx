"use client";

import { useState } from "react";
import type { BlogVideo } from "@/lib/blog/types";

/**
 * A click-to-load YouTube embed. The page ships only a thumbnail and a button;
 * the YouTube iframe (and its ~1MB of script and cookies) loads when the
 * reader asks for it, through youtube-nocookie.com. The link under the player
 * works without JavaScript.
 */
export function BlogVideoEmbed({ video }: { video: BlogVideo }) {
  const [playing, setPlaying] = useState(false);
  const watch = `https://www.youtube.com/watch?v=${video.youtubeId}`;
  return (
    <figure className="mt-8 overflow-hidden rounded-2xl border border-line bg-panel" data-video={video.youtubeId}>
      <div className="relative aspect-video bg-ink">
        {playing ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 h-full w-full"
            aria-label={`Play video: ${video.title}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- a remote thumbnail, lazy and sized by its box */}
            <img
              src={`https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
            />
            <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-rec text-panel shadow-lg">
              <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 5v14l11-7z" fill="currentColor" />
              </svg>
            </span>
          </button>
        )}
      </div>
      <figcaption className="border-t border-line px-4 py-3 text-sm leading-snug sm:px-5">
        <span className="block font-semibold text-ink">{video.title}</span>
        <span className="mt-0.5 block text-mut">
          {video.why}{" "}
          <a href={watch} className="underline underline-offset-2 hover:text-ink" rel="noopener">
            Watch on YouTube ({video.channel})
          </a>
        </span>
      </figcaption>
    </figure>
  );
}
