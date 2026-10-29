import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProSlot, ProSlotProvider, topEntry } from "./slot";

describe("ProSlot", () => {
  it("gives the slot to the highest priority, then the first registered", () => {
    expect(topEntry([{ id: "a", priority: 1, order: 0 }, { id: "b", priority: 3, order: 1 }])?.id).toBe("b");
    expect(topEntry([{ id: "a", priority: 2, order: 0 }, { id: "b", priority: 2, order: 1 }])?.id).toBe("a");
    expect(topEntry([])).toBeNull();
  });

  it("renders nothing slotted in the server HTML, and anything outside a provider", () => {
    const html = renderToStaticMarkup(
      <ProSlotProvider>
        <ProSlot priority={1}>ask</ProSlot>
      </ProSlotProvider>,
    );
    expect(html).toBe("");
    expect(renderToStaticMarkup(<ProSlot priority={1}>ask</ProSlot>)).toBe("ask");
  });
});
