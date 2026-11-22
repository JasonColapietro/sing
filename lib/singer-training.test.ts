import { describe, expect, it } from "vitest";
import { SINGERS } from "@/lib/singers";
import { singerTraining } from "@/lib/singer-training";
import { programById } from "@/lib/programs";
import { routineById } from "@/components/warmups/routines";

const bySlug = (slug: string) => SINGERS.find((s) => s.slug === slug)!;

describe("singer training CTA", () => {
  it("gives every singer a workflow that exists", () => {
    for (const s of SINGERS) {
      const t = singerTraining(s);
      if (t.kind === "program") {
        expect(programById(t.id), s.slug).not.toBeNull();
        expect(t.href).toBe(`/programs/${t.id}`);
      } else {
        expect(routineById(t.id), s.slug).not.toBeNull();
        expect(t.href).toBe(`/warmups?routine=${t.id}`);
      }
      expect(t.why).toContain(s.name);
    }
  });

  it("matches the workflow to the style", () => {
    expect(singerTraining(bySlug("luciano-pavarotti")).id).toBe("vibrato-3w");
    expect(singerTraining(bySlug("stevie-wonder")).id).toBe("agility");
    expect(singerTraining(bySlug("peter-steele")).id).toBe("range");
    expect(singerTraining(bySlug("axl-rose")).id).toBe("mix-4w");
    expect(singerTraining(bySlug("mariah-carey")).id).toBe("high-notes-6w");
    expect(singerTraining(bySlug("ian-gillan")).id).toBe("mix-4w");
  });

  it("writes the pitch without hedges, disclaimers or em dashes", () => {
    const HEDGE = /\b(may|might|could|perhaps|possibly|reported|reportedly|not a|no guarantee|results vary|disclaimer)\b/i;
    for (const s of SINGERS) {
      const t = singerTraining(s);
      expect(t.why, s.slug).not.toMatch(HEDGE);
      expect(t.why).not.toContain("—");
    }
  });
});
