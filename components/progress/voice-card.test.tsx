/**
 * The voice card on /progress, while Recovery week runs.
 *
 * The coach a few cards up says to leave the range test until the week is
 * over (components/practice/program-range-note.ts recoveryRangeNote). The card
 * used to offer the test anyway: a filled "Take the range test" to a singer
 * with no saved range, "Retake the test" to one with a range. The same page
 * told the singer two opposite things about the same measurement.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { VoiceCard } from "./voice-card";
import { recoveryRangeLine } from "@/components/practice/program-range-note";
import { rangeTestHref } from "@/lib/site";

const RECOVERY = "Recovery week";
const saved = { lowMidi: 48, highMidi: 67, testedAt: "2026-09-01T12:00:00.000Z" };

/** React escapes an apostrophe in text as &#x27;; compare against the markup's own spelling. */
const escaped = (text: string) => text.replace(/'/g, "&#x27;");

describe("VoiceCard", () => {
  it("asks a singer with no saved range to take the test", () => {
    const html = renderToStaticMarkup(<VoiceCard range={{}} />);
    expect(html).toContain("No range on file");
    expect(html).toContain("Take the range test");
    expect(html).toContain(`href="${rangeTestHref()}"`);
  });

  it("offers no test to a singer with no saved range during Recovery week, and says why", () => {
    const html = renderToStaticMarkup(<VoiceCard range={{}} recovering={RECOVERY} />);
    expect(html).toContain("No range on file");
    expect(html).toContain(escaped(recoveryRangeLine(RECOVERY)));
    expect(html).not.toContain("Take the range test");
    expect(html).not.toContain("/range");
  });

  it("offers a retest beside the singers link once a range is saved", () => {
    const html = renderToStaticMarkup(<VoiceCard range={saved} />);
    expect(html).toContain("Retake the test");
    expect(html).toContain(`href="${rangeTestHref()}"`);
    expect(html).toContain('href="/singers"');
  });

  it("keeps the singers link but drops the retest during Recovery week", () => {
    const html = renderToStaticMarkup(<VoiceCard range={saved} recovering={RECOVERY} />);
    expect(html).not.toContain("Retake the test");
    expect(html).not.toContain("/range");
    expect(html).toContain('href="/singers"');
    expect(html).toContain("See yourself among famous voices");
  });
});
