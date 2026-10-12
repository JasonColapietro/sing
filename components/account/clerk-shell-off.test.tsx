import { renderToStaticMarkup } from "react-dom/server";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import ClerkShellOff from "./clerk-shell-off";

/**
 * A build with accounts off may resolve "@/components/account/clerk-shell" to
 * this stand-in, so it has to take exactly what the layout passes the real
 * one. The annotation makes tsc hold the two signatures together; it is a
 * type-only reference, so no Clerk code loads here.
 */
const standIn: typeof import("./clerk-shell").default = ClerkShellOff;

describe("accounts-off ClerkShell stand-in", () => {
  it("renders the page untouched, with no provider around it", () => {
    const Shell = standIn;
    expect(
      renderToStaticMarkup(
        <Shell>
          <main>page</main>
        </Shell>,
      ),
    ).toBe("<main>page</main>");
  });
});

/**
 * The stand-in only keeps Clerk off the page if the build actually resolves
 * the layout's import to it. next.config.ts decides that from accountsReady()
 * when the config loads, so load it under each kind of key.
 */
describe("next.config.ts Clerk shell alias", () => {
  const ROOT = join(__dirname, "..", "..");

  async function loadConfig(key: string) {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", key);
    vi.stubEnv("NODE_ENV", "production");
    vi.resetModules();
    return (await import("@/next.config")).default;
  }

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("swaps in the stand-in for Turbopack and webpack when accounts are off", async () => {
    const config = await loadConfig("pk_test_x");
    const alias = config.turbopack?.resolveAlias as Record<string, string> | undefined;
    expect(alias).toEqual({
      "@/components/account/clerk-shell": "./components/account/clerk-shell-off.tsx",
    });
    expect(existsSync(join(ROOT, alias!["@/components/account/clerk-shell"]))).toBe(true);

    const webpack = config.webpack!({ resolve: { alias: { keep: "me" } } }, {} as never) as {
      resolve: { alias: Record<string, string> };
    };
    const off = join(ROOT, "components/account/clerk-shell-off.tsx");
    expect(webpack.resolve.alias).toEqual({
      keep: "me",
      "@/components/account/clerk-shell$": off,
      [`${join(ROOT, "components/account/clerk-shell")}$`]: off,
    });
  });

  it("leaves the real provider in place with a live key", async () => {
    const config = await loadConfig("pk_live_x");
    expect(config.turbopack?.resolveAlias).toBeUndefined();
    const webpack = config.webpack!({ resolve: { alias: { keep: "me" } } }, {} as never) as {
      resolve: { alias: Record<string, string> };
    };
    expect(webpack.resolve.alias).toEqual({ keep: "me" });
  });
});
