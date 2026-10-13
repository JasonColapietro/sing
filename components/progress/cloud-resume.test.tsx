import type { ButtonHTMLAttributes, ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ProgressState } from "@/lib/progress-shape";

const controls = vi.hoisted(() => ({
  buttons: [] as ButtonHTMLAttributes<HTMLButtonElement>[],
}));

vi.mock("@/lib/accounts", () => ({ accountsReady: () => true }));
vi.mock("next/link", () => ({ default: (props: ComponentProps<"a">) => <a {...props} /> }));
vi.mock("next/navigation", () => ({ usePathname: () => "/progress" }));
vi.mock("@/lib/use-account-auth", () => ({
  useAccountAuth: () => ({ isLoaded: true, isSignedIn: true }),
}));
vi.mock("@/lib/pro", async (original) => ({
  ...await original<typeof import("@/lib/pro")>(),
  useIsPro: () => true,
  getProState: () => ({ active: true, proKey: "isolated-test-key" }),
}));
vi.mock("@/lib/progress-cloud", async (original) => {
  const cloud = await original<typeof import("@/lib/progress-cloud")>();
  return { ...cloud, useProgressCloudState: cloud.getProgressCloudState };
});
vi.mock("@/components/ui", async (original) => ({
  ...await original<typeof import("@/components/ui")>(),
  Button: (props: ButtonHTMLAttributes<HTMLButtonElement>) => {
    controls.buttons.push(props);
    return <button disabled={props.disabled}>{props.children}</button>;
  },
}));

function record(id: string): ProgressState {
  return {
    xp: 10,
    sessions: [{ id, type: "pitch", day: "2026-10-11", date: "2026-10-11T12:00:00Z", durationSec: 60, xp: 10 }],
    streak: { current: 1, best: 1, lastDay: "2026-10-11" },
    range: {}, rangeHistory: [], achievements: [],
  };
}

async function pausedBrowser() {
  vi.resetModules();
  const storage = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    },
    addEventListener() {},
  });
  const progress = await import("@/lib/progress");
  progress.importProgress(JSON.stringify(record("erased")));
  progress.clearProgress();
  progress.importProgress(JSON.stringify(record("new-practice")));
  controls.buttons = [];
  return { progress, cloud: await import("@/lib/progress-cloud") };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("explicit resume after a browser-only erase", () => {
  it("explains the account backup and only restores after Resume is clicked", async () => {
    const { progress, cloud } = await pausedBrowser();
    let saved: ProgressState | undefined;
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      if (init.method === "GET") return Response.json({ state: record("cloud"), savedAt: null, updatedAt: null });
      saved = JSON.parse(String(init.body)).state;
      return Response.json({ ok: true, savedAt: "2026-10-11T12:00:00Z" });
    });
    vi.stubGlobal("fetch", fetchMock);
    const { AccountBackupControls } = await import("./account-backup-sync");
    const html = renderToStaticMarkup(<AccountBackupControls />);
    expect(html).toContain("Backup is paused on this browser");
    expect(html).toContain("Resuming restores your saved account progress");
    expect(html).not.toContain("Backs up in the background");
    expect(fetchMock).not.toHaveBeenCalled();
    const button = controls.buttons.find(({ children }) => children === "Resume backup and restore");
    expect(button?.onClick).toBeTypeOf("function");
    button!.onClick!({} as never);
    await vi.waitFor(() => expect(saved?.sessions.map(({ id }) => id).sort()).toEqual(["cloud", "new-practice"]));
    expect(progress.getState().sessions.map(({ id }) => id).sort()).toEqual(["cloud", "new-practice"]);
    expect(cloud.getProgressCloudState().paused).toBe(false);
  });

  it("resumes Pro sync explicitly and keeps practice made since the erase", async () => {
    const { progress, cloud } = await pausedBrowser();
    let saved: ProgressState | undefined;
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body));
      if (!body.state) return Response.json({ state: record("cloud") });
      saved = body.state;
      return Response.json({ ok: true });
    });
    vi.stubGlobal("fetch", fetchMock);
    const { SyncControls } = await import("./sync-controls");
    const html = renderToStaticMarkup(<SyncControls />);
    expect(html).toContain("Cloud sync is paused on this browser");
    expect(html).toContain("Resuming restores your saved cloud progress");
    expect(html).not.toContain("Syncs automatically as you practice");
    expect(fetchMock).not.toHaveBeenCalled();
    const button = controls.buttons.find(({ children }) => children === "Resume sync and restore");
    expect(button?.onClick).toBeTypeOf("function");
    button!.onClick!({} as never);
    await vi.waitFor(() => expect(saved?.sessions.map(({ id }) => id).sort()).toEqual(["cloud", "new-practice"]));
    expect(progress.getState().sessions.map(({ id }) => id).sort()).toEqual(["cloud", "new-practice"]);
    expect(cloud.getProgressCloudState().paused).toBe(false);
  });
});
