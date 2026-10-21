/**
 * /sign-in and /sign-up metadata follows the same switch as their body.
 *
 * The metadata is a static export evaluated once per module, so the account
 * state is set before each fresh import. With accounts closed both routes
 * render "Accounts are not open yet"; a tab title or description offering a
 * free account or a backup above that page would be untrue.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

const ROUTES = {
  "/sign-in": () => import("@/app/sign-in/[[...sign-in]]/page"),
  "/sign-up": () => import("@/app/sign-up/[[...sign-up]]/page"),
} as const;

async function metadataWith(key: string, route: keyof typeof ROUTES) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", key);
  return (await ROUTES[route]()).metadata;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("account route metadata", () => {
  it.each(Object.keys(ROUTES) as (keyof typeof ROUTES)[])(
    "%s: says accounts are not open while they are not, and promises nothing",
    async (route) => {
      const meta = await metadataWith("", route);
      expect(meta.title).toBe("Accounts are not open yet");
      expect(String(meta.description)).toContain("stay saved in this browser");
      expect(`${String(meta.title)} ${String(meta.description)}`).not.toMatch(/\bfree\b|\bback ?up\b|\bbackup\b|sign in to/i);
      expect(meta.robots).toEqual({ index: false, follow: false });
    },
  );

  it.each(Object.keys(ROUTES) as (keyof typeof ROUTES)[])(
    "%s: keeps the account offer once accounts are open",
    async (route) => {
      // A test key counts as open outside production (lib/accounts.ts).
      const meta = await metadataWith("pk_test_example", route);
      expect(meta.title).not.toBe("Accounts are not open yet");
      expect(String(meta.description)).toMatch(/back ?up/i);
      expect(meta.robots).toEqual({ index: false, follow: false });
    },
  );
});
