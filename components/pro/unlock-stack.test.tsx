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

  it("folds a free reader's locked chapters away, and unfolds them for an owner", () => {
    // Two full tables of contents ran to about two phone screens between the
    // buy card and the comparison table; the free rows stay in view and the
    // locked ones sit behind a details element that names what Pro opens.
    const locked = BOOK_CONTENTS.filter((e) => !e.free).length;
    let html = render();
    expect(html).toContain(`See the ${locked} chapters Pro opens`);
    expect(html.indexOf("<details")).toBeLessThan(html.indexOf('aria-label="Included with Pro"'));
    state.active = true;
    html = render();
    expect(html).not.toContain("<details");
    expect(html).not.toContain("chapters Pro opens");
  });

  it("prerenders the sales version until the entitlement is read", () => {
    state.active = true;
    state.ready = false;
    expect(render()).toContain("Everything below opens the second you upgrade");
  });
});
