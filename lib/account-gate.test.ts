import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ ready: true }));
vi.mock("./accounts", () => ({ accountsReady: () => state.ready }));

const assign = vi.fn();

function visit(path: string, clerk?: { loaded?: boolean; user?: unknown }) {
  vi.stubGlobal("window", {
    location: { pathname: path.split("?")[0], search: path.includes("?") ? `?${path.split("?")[1]}` : "", assign },
    Clerk: clerk,
  });
}

async function gate() {
  vi.resetModules();
  return import("./account-gate");
}

beforeEach(() => {
  state.ready = true;
  assign.mockReset();
});
afterEach(() => vi.unstubAllGlobals());

describe("account gate", () => {
  it("sends a signed-out singer who presses start to sign-in and back", async () => {
    visit("/warmups?ex=hum", { loaded: true, user: null });
    const { requireAccountToUse } = await gate();
    expect(requireAccountToUse()).toBe(false);
    expect(assign).toHaveBeenCalledWith("/sign-in?redirect_url=%2Fwarmups%3Fex%3Dhum");
  });

  it("lets a signed-in singer use every tool", async () => {
    visit("/studio", { loaded: true, user: { id: "user_1" } });
    const { requireAccountToUse } = await gate();
    expect(requireAccountToUse()).toBe(true);
    expect(assign).not.toHaveBeenCalled();
  });

  it("leaves famous singers' ranges open", async () => {
    visit("/singers/adele", { loaded: true, user: null });
    const { requireAccountToUse } = await gate();
    expect(requireAccountToUse()).toBe(true);
  });

  it("never gates while accounts are not configured", async () => {
    state.ready = false;
    visit("/studio", { loaded: true, user: null });
    const { requireAccountToUse } = await gate();
    expect(requireAccountToUse()).toBe(true);
  });

  it("does not bounce anyone before Clerk has loaded", async () => {
    visit("/studio", { loaded: false });
    const { requireAccountToUse } = await gate();
    expect(requireAccountToUse()).toBe(true);
  });

  it("redirects only once when several entry points fire together", async () => {
    visit("/songs/x", { loaded: true, user: null });
    const { requireAccountToUse } = await gate();
    requireAccountToUse();
    requireAccountToUse();
    expect(assign).toHaveBeenCalledOnce();
  });
});
