import type { ButtonHTMLAttributes } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ProgressState, SessionLog } from "@/lib/progress-shape";

const controls = vi.hoisted(() => ({
  buttons: [] as ButtonHTMLAttributes<HTMLButtonElement>[],
}));

vi.mock("@/lib/accounts", () => ({ accountsReady: () => true }));
vi.mock("@/lib/use-account-auth", () => ({ useAccountAuth: () => ({}) }));
vi.mock("@/components/ui", () => ({
  Button: (props: ButtonHTMLAttributes<HTMLButtonElement>) => {
    controls.buttons.push(props);
    return <button>{props.children}</button>;
  },
}));

function record(id: string): ProgressState {
  const session: SessionLog = {
    id,
    type: "pitch",
    day: "2026-10-10",
    date: "2026-10-10T12:00:00Z",
    durationSec: 60,
    xp: 10,
  };
  return {
    xp: 10,
    sessions: [session],
    streak: { current: 1, best: 1, lastDay: session.day },
    range: {},
    rangeHistory: [],
    achievements: [],
  };
}

async function manualBackup() {
  const storage = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    },
  });
  vi.resetModules();
  const progress = await import("@/lib/progress");
  progress.importProgress(JSON.stringify(record("laptop")));
  const { AccountBackupControls } = await import("./account-backup-sync");
  controls.buttons = [];
  renderToStaticMarkup(<AccountBackupControls />);
  const button = controls.buttons.find(({ children }) => children === "Back up now");
  expect(button?.onClick).toBeTypeOf("function");
  button!.onClick!({} as never);
  return progress;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("manual account backup", () => {
  it("keeps another device's sessions when Back up now is pressed", async () => {
    let remote = record("phone");
    const requests: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init: RequestInit) => {
      requests.push(init.method!);
      if (init.method === "GET") {
        return Response.json({ state: remote, updatedAt: null, savedAt: null });
      }
      remote = JSON.parse(String(init.body)).state;
      return Response.json({ ok: true, savedAt: "2026-10-11T12:00:00Z" });
    }));

    const progress = await manualBackup();
    await vi.waitFor(() => expect(requests).toEqual(["GET", "PUT"]));
    expect(remote.sessions.map(({ id }) => id).sort()).toEqual(["laptop", "phone"]);
    expect(progress.getState().sessions.map(({ id }) => id).sort()).toEqual(["laptop", "phone"]);
  });

  it("does not replace the remote record when the initial read fails", async () => {
    const fetchMock = vi.fn(async () => Response.json({ error: "Unavailable" }, { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);
    const progress = await manualBackup();

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0]).toEqual(["/api/account/progress", { method: "GET" }]);
    expect(progress.getState().sessions.map(({ id }) => id)).toEqual(["laptop"]);
  });
});
