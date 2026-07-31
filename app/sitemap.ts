import type { MetadataRoute } from "next";
import {
  HUB_GENRES,
  SINGERS,
  VOICE_KINDS,
  genreSlug,
  voiceTypeSlug,
} from "@/lib/singers";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    "",
    "/studio",
    "/warmups",
    "/range",
    "/singers",
    "/ear-training",
    "/breath",
    "/songs",
    "/recorder",
    "/tools",
    "/progress",
    "/pro",
    "/book",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : path === "/singers" ? 0.9 : 0.7,
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

  const singers = SINGERS.map((s) => ({
    url: `${SITE_URL}/singers/${s.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...pages, ...hubs, ...singers];
}
