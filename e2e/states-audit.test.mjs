import { afterEach, describe, expect, it, vi } from "vitest";
import { checkDestructiveActions } from "./audits/80-states.mjs";

afterEach(() => vi.unstubAllGlobals());
function element(textContent, tagName = "BUTTON", attrs = {}) {
  return { textContent, tagName, parentElement: null,
    getAttribute: (name) => attrs[name] ?? null,
    hasAttribute: (name) => Object.hasOwn(attrs, name),
  };
}
async function findingsFor(elements) {
  vi.stubGlobal("document", { querySelectorAll: () => elements });
  vi.stubGlobal("window", { __describe: (el) => el.textContent });
  const findings = [];
  await checkDestructiveActions({ page: { evaluate: async (fn) => fn() } }, findings);
  return findings;
}
describe("destructive control audit", () => {
  it("recognizes the Clear words Pro-pack navigation, not an erase command", async () => {
    expect(await findingsFor([element("Clear wordsProConsonants and vowels", "A", { href: "/pro" })])).toEqual([]);
  });
  it("still reports unconfirmed erase controls and links", async () => {
    const findings = await findingsFor([
      element("Clear history"), element("Delete take"),
      element("Clear words", "BUTTON"),
      element("Clear words", "A", { href: "/progress" }),
      element("Clear words", "A", { href: "/pro", role: "button" }),
    ]);
    expect(findings).toHaveLength(5);
    expect(findings.every((finding) => finding.severity === "major")).toBe(true);
  });
});
