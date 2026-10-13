import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SUPPORT_EMAIL } from "./organization";

/** Every source file under a directory, tests included. */
function sources(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...sources(path));
    else if (/\.(ts|tsx|mjs|md|json)$/.test(name)) out.push(path);
  }
  return out;
}

describe("one support address", () => {
  const root = join(__dirname, "..");
  // The source, the prose and data it is built from, and the operator docs.
  const files = [
    ...["app", "components", "lib", "content", "data"].flatMap((d) => sources(join(root, d))),
    join(root, "README.md"),
    join(root, ".env.example"),
  ];

  it("is the address /contact publishes", () => {
    expect(SUPPORT_EMAIL).toBe("support@suedeai.ai");
    const contact = readFileSync(join(root, "app/contact/page.tsx"), "utf8");
    expect(contact).toContain(`mailto:${SUPPORT_EMAIL}`);
  });

  it("is the only suedeai.ai inbox a buyer is ever told to email", () => {
    // Built rather than written, so this file is not its own match. The Pro
    // key, payment and portal messages used to name an inbox the company
    // publishes nowhere else.
    const retired = ["hey", "suedeai.ai"].join("@");
    const offenders = files.filter((f) => readFileSync(f, "utf8").includes(retired));
    expect(offenders).toEqual([]);
  });
});
