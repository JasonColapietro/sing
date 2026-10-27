import type { MetadataRoute } from "next";
import { RELEASE_DATE as CHANGELOG_RELEASE_DATE } from "@/app/changelog/page";
import { SONGS } from "@/components/songs/data";
import { ATLAS_CONTENTS } from "@/lib/atlas-data";
import { BOOK_CONTENTS } from "@/lib/book-data";
import {
  HUB_GENRES,
  SINGERS,
  VOICE_KINDS,
  genreSlug,
  singersByGenre,
  singersByVoiceType,
  voiceTypeSlug,
  type Singer,
} from "@/lib/singers";
import { POP_SONGS } from "@/lib/pop-songs";
import { getSingerPageLastModified } from "@/lib/singer-evidence";
import { SITE_URL } from "@/lib/site";
import { VOICE_LEARN_PATH, coursePaths } from "@/lib/voice-lessons";

/**
 * A hub's lastmod: the latest page date among the singers it lists, since a
 * hub changes when one of its rows does. Each date is the hand-set content
 * date getSingerPageLastModified returns ("YYYY-MM-DD", so the string sort is
 * the date sort), never the build time.
 */
function latestSingerPageDate(singers: readonly Singer[]): string | undefined {
  return singers.map((s) => getSingerPageLastModified(s.slug)).sort().at(-1);
}

/**
 * Dated pages outside the singer catalog, by their own recorded content date.
 * Every other static page, song, can-you-sing and course page has no such
 * date yet, so it is listed without a lastmod rather than with an invented
 * one. /singers/methodology is prose that lists no singers, so the catalog's
 * dates say nothing about when it changed.
 */
const PAGE_LAST_MODIFIED: Readonly<Record<string, string | undefined>> = {
  // /singers lists every profile in its chart and A-Z index.
  "/singers": latestSingerPageDate(SINGERS),
  "/changelog": CHANGELOG_RELEASE_DATE,
};

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    "",
    "/studio",
    "/warmups",
    "/programs",
    "/range",
    "/learn",
    VOICE_LEARN_PATH,
    "/voice",
    "/singers",
    "/singers/methodology",
    "/contact",
    "/ear-training",
    "/breath",
    "/songs",
    "/recorder",
    "/tools",
    "/extension",
    "/analyze",
    "/progress",
    "/pro",
    "/book",
    "/atlas",
    "/can-you-sing",
    // Not a chapter: a standalone reference page under /atlas, so it is
    // listed here rather than derived from ATLAS_CONTENTS below.
    "/atlas/vocal-range-by-voice-type",
    "/glossary",
    "/changelog",
    // Both books' free sample chapters are real, indexable content; the gated
    // chapters are robots-noindexed and stay out of the sitemap.
    ...ATLAS_CONTENTS.filter((c) => c.free).map((c) => `/atlas/${c.slug}`),
    ...BOOK_CONTENTS.filter((c) => c.free).map((c) => `/book/${c.slug}`),
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly" as const,
    priority:
      path === ""
        ? 1
        : path === "/learn" || path === "/singers" || path === "/atlas"
          ? 0.9
          : 0.7,
    ...(PAGE_LAST_MODIFIED[path] ? { lastModified: PAGE_LAST_MODIFIED[path] } : {}),
  }));

  // Hubs sit above the leaves in priority: they are the pages that gather the
  // 357 and the ones worth crawling first.
  // Each is dated by the singers it lists. The records page ranks every
  // profile against the whole catalog (its ranks and counts move when any
  // profile does), so it takes the catalog's latest date.
  const hubs = [
    { url: `${SITE_URL}/singers/records`, priority: 0.8, singers: SINGERS },
    ...VOICE_KINDS.map((v) => ({
      url: `${SITE_URL}/singers/voice-type/${voiceTypeSlug(v)}`,
      priority: 0.8,
      singers: singersByVoiceType(v),
    })),
    ...HUB_GENRES.map((g) => ({
      url: `${SITE_URL}/singers/genre/${genreSlug(g)}`,
      priority: 0.7,
      singers: singersByGenre(g),
    })),
  ].map(({ singers, ...h }) => {
    const lastModified = latestSingerPageDate(singers);
    return {
      ...h,
      changeFrequency: "monthly" as const,
      ...(lastModified ? { lastModified } : {}),
    };
  });

  // All public singer profiles are indexable. Each page keeps its evidence
  // status and caveats visible while the sitemap uses its actual content date.
  const singers = SINGERS.map((s) => ({
    url: `${SITE_URL}/singers/${s.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
    lastModified: getSingerPageLastModified(s.slug),
  }));

  // Free song pages are leaves under /songs, so they get the same 0.6 the
  // singer leaves get. PRO_SONGS pages are robots-noindexed for the same reason
  // the gated atlas chapters are, and so stay out of the sitemap — listing a
  // noindexed URL only asks a crawler to fetch a page we told it to drop.
  const songs = SONGS.map((s) => ({
    url: `${SITE_URL}/songs/${s.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Popular-song range pages: facts only, always indexable, same leaf
  // priority as the singer pages they cross-link.
  const popSongs = POP_SONGS.map((s) => ({
    url: `${SITE_URL}/can-you-sing/${s.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Voice-course stage, module and lesson pages. Every one is free and
  // indexable; a lesson not yet ported has no page and so no entry.
  const { stages, modules, lessons } = coursePaths();
  const course = [
    ...[...stages, ...modules].map((path) => ({ path, priority: 0.7 })),
    ...lessons.map((path) => ({ path, priority: 0.6 })),
  ].map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "monthly" as const,
    priority,
  }));

  return [...pages, ...hubs, ...singers, ...songs, ...popSongs, ...course];
}
