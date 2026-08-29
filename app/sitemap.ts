import type { MetadataRoute } from "next";
import { SONGS } from "@/components/songs/data";
import { ATLAS_CONTENTS } from "@/lib/atlas-data";
import { BOOK_CONTENTS } from "@/lib/book-data";
import {
  HUB_GENRES,
  SINGERS,
  VOICE_KINDS,
  genreSlug,
  voiceTypeSlug,
} from "@/lib/singers";
import { getSingerLastModified } from "@/lib/singer-evidence";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    "",
    "/studio",
    "/warmups",
    "/range",
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
      path === "" ? 1 : path === "/singers" || path === "/atlas" ? 0.9 : 0.7,
  }));

  // Hubs sit above the leaves in priority: they are the pages that gather the
  // 357 and the ones worth crawling first.
  const hubs = [
    { url: `${SITE_URL}/singers/records`, priority: 0.8 },
    ...VOICE_KINDS.map((v) => ({
      url: `${SITE_URL}/singers/voice-type/${voiceTypeSlug(v)}`,
      priority: 0.8,
    })),
    ...HUB_GENRES.map((g) => ({
      url: `${SITE_URL}/singers/genre/${genreSlug(g)}`,
      priority: 0.7,
    })),
  ].map((h) => ({ ...h, changeFrequency: "monthly" as const }));

  const singers = SINGERS.map((s) => {
    const lastModified = getSingerLastModified(s.slug);
    return {
      url: `${SITE_URL}/singers/${s.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
      ...(lastModified ? { lastModified } : {}),
    };
  });

  // Free song pages are leaves under /songs, so they get the same 0.6 the
  // singer leaves get. PRO_SONGS pages are robots-noindexed for the same reason
  // the gated atlas chapters are, and so stay out of the sitemap — listing a
  // noindexed URL only asks a crawler to fetch a page we told it to drop.
  const songs = SONGS.map((s) => ({
    url: `${SITE_URL}/songs/${s.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...pages, ...hubs, ...singers, ...songs];
}
