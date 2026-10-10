import { buildLlmsFullTxt } from "@/lib/llms-txt";

/**
 * /llms-full.txt: /llms.txt plus the answers the pages give, in one file.
 *
 * Same pattern as app/llms.txt/route.ts — composed at build time from the
 * exports the pages render, prerendered with `force-static`, served as plain
 * text with the same revalidation header. See buildLlmsFullTxt() for what it
 * contains and what it deliberately leaves out.
 */
export const dynamic = "force-static";

export function GET(): Response {
  return new Response(buildLlmsFullTxt(), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
