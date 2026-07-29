import type { MetadataRoute } from "next";
import { SINGERS } from "@/lib/singers";
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
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : path === "/singers" ? 0.9 : 0.7,
  }));

  const singers = SINGERS.map((s) => ({
    url: `${SITE_URL}/singers/${s.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...pages, ...singers];
}
