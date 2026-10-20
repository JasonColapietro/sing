import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const src = readFileSync(join(__dirname, "recorder-page.tsx"), "utf8");

describe("the XP note after a logged take", () => {
  it("sits in the record deck on a phone, where it covers nothing", () => {
    // The corner toast sat over REC and the "stop automatically at 5:00" line
    // on a 375x667 phone for six seconds after every logged take.
    const deck = src.slice(src.indexOf("{/* Record deck */}"), src.indexOf("{/* Self-review prompt */}"));
    expect(deck).toMatch(/<TakeLoggedNote[\s\S]*?className="mt-4 sm:hidden"/);
  });

  it("keeps the corner toast from sm up only, so one copy shows at any width", () => {
    const corner = src.slice(src.indexOf("{toast && toastFloating && ("));
    expect(corner).toMatch(/className="animate-fadeup fixed right-4 bottom-4 z-50 hidden w-72 shadow-lg sm:block"/);
    expect(src.match(/<TakeLoggedNote\b/g)).toHaveLength(2);
  });

  it("dismisses only the corner copy on a timer, so the phone's page does not jump", () => {
    expect(src).toMatch(/window\.setTimeout\(\(\) => setToastFloating\(false\), 6000\)/);
    expect(src).not.toMatch(/window\.setTimeout\(\(\) => setToast\(null\)/);
  });
});
