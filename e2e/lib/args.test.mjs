import { describe, expect, it } from "vitest";
import { browserTarget, cliArgs } from "./args.mjs";

describe("cliArgs", () => {
  it("reads the base URL, the browser build and named flags", () => {
    const args = cliArgs("http://localhost:3000", [
      "http://127.0.0.1:3100/",
      "--executable=/opt/pw-browsers/chromium",
      "--route=a,b",
      "--returning",
    ]);
    expect(args.base).toBe("http://127.0.0.1:3100");
    expect(args.executable).toBe("/opt/pw-browsers/chromium");
    expect(args.flag("route")).toBe("a,b");
    expect(args.flag("json")).toBeUndefined();
    expect(args.has("returning")).toBe(true);
    expect(args.has("route")).toBe(false);
  });

  it("falls back to the script's default base URL", () => {
    const args = cliArgs("http://localhost:3197", ["--viewport=mobile-375"]);
    expect(args.base).toBe("http://localhost:3197");
    expect(args.executable).toBeUndefined();
    expect(args.positional).toEqual([]);
  });
});

describe("browserTarget", () => {
  it("prefers the given build, else the fallback", () => {
    expect(browserTarget("/opt/chromium")).toEqual({ executablePath: "/opt/chromium" });
    expect(browserTarget(undefined)).toEqual({ channel: "chrome" });
    expect(browserTarget(undefined, {})).toEqual({});
  });
});
