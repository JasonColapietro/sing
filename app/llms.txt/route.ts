import { buildLlmsTxt } from "@/lib/llms-txt";

/**
 * /llms.txt.
 *
 * It was public/llms.txt until the hand-written genre list in it drifted off
 * the router (see lib/llms-txt.ts). Serving it from a route is what lets the
 * list be derived instead of transcribed. `force-static` prerenders the body at
 * build time, so this stays a static file on the CDN exactly as the public/
 * asset was — the only difference is that the build now composes it.
 *
 * The public/ copy had to go: static assets shadow routes at the same path, so
 * leaving it there would have served the stale text forever.
 */
export const dynamic = "force-static";

export function GET(): Response {
  return new Response(buildLlmsTxt(), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      // What Vercel served for the public/ asset. Keeps crawler-facing
      // revalidation behaviour identical across the move.
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
