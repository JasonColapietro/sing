/**
 * Every API route that hands a browser a buyer's entitlement (the Pro key that
 * unlocks Pro on any browser, and the buyer's email) marks its answers
 * `private, no-store`, so no shared cache keeps one buyer's key.
 *
 * /api/checkout and /api/entitlement had the header; /api/restore and
 * /api/redeem return the same payload and did not. This reads every route
 * under app/api, so a new route that returns an entitlement fails here until
 * it carries the header too. The per-route tests check the header on each
 * branch's actual response.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const API = new URL(".", import.meta.url).pathname;

function routes(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return routes(path);
    return name === "route.ts" ? [path] : [];
  });
}

function code(path: string): string {
  return readFileSync(path, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

/** Builds an entitlement with the buyer's email (not `null`), or names a Pro key. */
function returnsKeyOrEmail(src: string): boolean {
  const withEmail = [...src.matchAll(/entitlementFrom(?:Lifetime)?\(([^;]*?)\)\s*[;),]/g)].some(
    (m) => !/,\s*null\s*\)?$/.test(m[1].trim()),
  );
  return withEmail || /\bproKey\b/.test(src);
}

describe("API routes that return a Pro key or email", () => {
  const all = routes(API);
  const keyed = all.filter((p) => returnsKeyOrEmail(code(p)));
  const rel = (p: string) => p.slice(API.length);

  it("finds the routes that hand out an entitlement", () => {
    expect(keyed.map(rel).sort()).toEqual(
      expect.arrayContaining(["entitlement/route.ts", "redeem/route.ts", "restore/route.ts"]),
    );
  });

  it("marks every answer private, no-store, the rate limit's included", () => {
    for (const path of keyed) {
      const src = code(path);
      expect(src, rel(path)).toContain('"private, no-store"');
      // No bare NextResponse.json outside the json() helper that sets it.
      const bare = src.match(/NextResponse\.json\(/g) ?? [];
      expect(bare.length, `${rel(path)} answers without the helper`).toBeLessThanOrEqual(1);
      expect(src, `${rel(path)} passes the rate limit's answer through unmarked`).not.toMatch(
        /if \(limited\) return limited;/,
      );
    }
  });
});

/**
 * The wider class: every route but the Stripe webhook answers one browser
 * about one singer (a Pro key's book chapters, a billing-portal login link, a
 * synced progress record). Each must end up private, no-store. The routes in
 * PENDING are handed off to their owners; once a route carries the header,
 * this fails until it is taken off the list, so the list only shrinks and a
 * new route is held to the rule from its first commit.
 */
const PUBLIC_BY_DESIGN = new Set(["webhooks/stripe/route.ts"]);
const PENDING = new Set([
  "account/progress/route.ts",
  "book/route.ts",
  "portal/route.ts",
  "sync/route.ts",
]);

describe("every per-singer API route", () => {
  const all = routes(API);
  const rel = (p: string) => p.slice(API.length);

  it("marks its answers private, no-store, apart from the pending handoffs", () => {
    for (const path of all) {
      const name = rel(path);
      if (PUBLIC_BY_DESIGN.has(name)) continue;
      const marked = code(path).includes("private, no-store");
      if (PENDING.has(name)) {
        expect(marked, `${name} now carries the header: take it off PENDING`).toBe(false);
      } else {
        expect(marked, `${name} has no private, no-store header`).toBe(true);
      }
    }
  });
});
