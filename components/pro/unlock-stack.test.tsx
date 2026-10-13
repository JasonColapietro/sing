import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BOOK_CONTENTS } from "@/lib/book-data";

const state = vi.hoisted(() => ({ active: false, ready: true }));
vi.mock("@/lib/pro", () => ({
  useProState: () => ({ active: state.active }),
  useProReady: () => state.ready,
}));

import { UnlockStack } from "./unlock-stack";

const paid = BOOK_CONTENTS.find((e) => !e.free)!;
const render = () => renderToStaticMarkup(<UnlockStack />);

describe("the unlock stack on /pro", () => {
  beforeEach(() => {
    state.active = false;
    state.ready = true;
  });

  it("sells the locked chapters to a free reader", () => {
    const html = render();
    expect(html).toContain("Everything below opens the second you upgrade");
    expect(html).toContain("with Pro.");
    expect(html).toContain('aria-label="Included with Pro"');
    expect(html).not.toContain(`href="/book/${paid.slug}"`);
  });

  it("opens every chapter to an owner, without calling paid chapters free", () => {
    state.active = true;
    const html = render();
    expect(html).toContain("Everything below is open to you now");
    expect(html).toContain(`All ${BOOK_CONTENTS.length} chapters are open to you`);
    expect(html).toContain(`href="/book/${paid.slug}"`);
    expect(html).not.toContain('aria-label="Included with Pro"');
    const freeLabels = html.match(/>Free</g)?.length ?? 0;
    const freeChapters = html.match(/href="\/(book|atlas)\/[^"]+"/g)?.length ?? 0;
    expect(freeLabels).toBeLessThan(freeChapters);
  });

  it("prerenders the sales version until the entitlement is read", () => {
    state.active = true;
    state.ready = false;
    expect(render()).toContain("Everything below opens the second you upgrade");
  });
});
