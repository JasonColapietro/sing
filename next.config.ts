import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  // The Pro book PDFs live outside public/ so they can't be fetched without a
  // subscription check; make sure the serving route's bundle includes them.
  outputFileTracingIncludes: {
    "/api/book/pdf": ["./content/pdfs/**"],
  },
  async redirects() {
    return [
      {
        // The library files this category as Contralto, but "alto" is the
        // commoner word and what the range test used to answer. Both the
        // stored label on a returning singer's device and anyone searching
        // "alto singers" should land somewhere real.
        source: "/singers/voice-type/alto",
        destination: "/singers/voice-type/contralto",
        permanent: true,
      },

      // --- Legacy paths Google still holds for this host (2026-08-08) ---
      // The 2026-08-02 consolidation moved the brand's marketing home from
      // print.suedeai.ai to this host. Google kept asking this host for the
      // old site's paths and got a 404 on every one; Next's not-found ships
      // `noindex`, which is why Search Console filed them under "Excluded by
      // 'noindex' tag" rather than "Not found (404)". Nothing on this site
      // links to any of them — they are inbound-only URLs, so a 404 throws
      // away whatever equity and traffic they still carry. Each one now lands
      // on its real successor.
      {
        // The browser studio IS the web app now. Deliberately not pointed at
        // print.suedeai.ai/app: that companion is `noindex` by design, so
        // redirecting a page Google wants to index into a noindexed one would
        // just move the exclusion rather than clear it.
        source: "/app",
        destination: "/studio",
        permanent: true,
      },
      {
        // Same mapping print.suedeai.ai/demo already uses, so both hosts'
        // copies of this URL converge on one destination.
        source: "/demo",
        destination: "/range",
        permanent: true,
      },
      // Policy and support live on the org site and are what both store
      // listings declare, so these are pointers, not pages to rebuild here.
      // Trailing slashes are the canonical form suedeai.org serves — linking
      // the unslashed form would add a second hop through its own 308.
      {
        source: "/privacy",
        destination: "https://suedeai.org/voice/privacy/",
        permanent: true,
      },
      {
        source: "/support",
        destination: "https://suedeai.org/voice/support/",
        permanent: true,
      },
      {
        source: "/terms",
        destination: "https://suedeai.org/voice/terms/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
