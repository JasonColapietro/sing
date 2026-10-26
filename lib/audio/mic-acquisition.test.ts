import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const prefs = vi.hoisted(() => ({ inputId: "B", monitoring: "headphones", afterClear: null as null | (() => void) }));
vi.mock("./devices", () => ({
  getInputDeviceId: () => prefs.inputId,
  getMonitoring: () => prefs.monitoring,
  clearInputDevice: () => { prefs.inputId = ""; prefs.afterClear?.(); },
}));
vi.mock("@/lib/account-gate", () => ({ requireAccountToUse: () => true }));
import { openMic } from "./mic";

beforeEach(() => { prefs.inputId = "B"; prefs.monitoring = "headphones"; prefs.afterClear = null; });
afterEach(() => vi.unstubAllGlobals());

describe("microphone fallback preferences", () => {
  it("does not erase C when the earlier B request becomes overconstrained", async () => {
    let reject!: (error: unknown) => void;
    const fallback = {} as MediaStream;
    const getUserMedia = vi.fn()
      .mockReturnValueOnce(new Promise<MediaStream>((_resolve, no) => { reject = no; }))
      .mockResolvedValueOnce(fallback);
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
    const opening = openMic();
    prefs.inputId = "C";
    reject({ name: "OverconstrainedError" });
    await opening;
    expect(prefs.inputId).toBe("C");
    expect(getUserMedia).toHaveBeenCalledTimes(1);
  });

  it("forgets the failed input when it is still selected and falls back once", async () => {
    const fallback = {} as MediaStream;
    const getUserMedia = vi.fn().mockRejectedValueOnce({ name: "OverconstrainedError" }).mockResolvedValueOnce(fallback);
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
    expect(await openMic()).toEqual({ stream: fallback, error: null, inputId: "" });
    expect(prefs.inputId).toBe("");
    expect(getUserMedia).toHaveBeenCalledTimes(2);
    expect(getUserMedia.mock.calls[1][0].audio.deviceId).toBeUndefined();
  });

  it("skips acquisition when its owner is already canceled", async () => {
    const getUserMedia = vi.fn(); vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
    expect((await openMic({ isCancelled: () => true })).stream).toBeNull();
    expect(getUserMedia).not.toHaveBeenCalled(); expect(prefs.inputId).toBe("B");
  });

  it("does not fall back with old echo settings after only monitoring changes", async () => {
    let reject!: (error: unknown) => void;
    const getUserMedia = vi.fn().mockReturnValueOnce(new Promise((_resolve, no) => { reject = no; }));
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
    const opening = openMic(); prefs.monitoring = "speakers"; reject({ name: "OverconstrainedError" });
    expect((await opening).stream).toBeNull();
    expect(getUserMedia).toHaveBeenCalledOnce(); expect(prefs.inputId).toBe("B");
  });

  it.each(["cancel", "input", "monitoring"])("rechecks %s after notifying fallback preference subscribers", async (action) => {
    let canceled = false;
    prefs.afterClear = () => {
      if (action === "cancel") canceled = true;
      else if (action === "input") prefs.inputId = "C";
      else prefs.monitoring = "speakers";
    };
    const getUserMedia = vi.fn().mockRejectedValueOnce({ name: "OverconstrainedError" });
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
    expect((await openMic({ isCancelled: () => canceled })).stream).toBeNull();
    expect(getUserMedia).toHaveBeenCalledOnce();
    if (action === "input") expect(prefs.inputId).toBe("C");
  });

  it.each(["headphones", "speakers"] as const)("applies the requested %s monitoring constraint", async (monitoring) => {
    const getUserMedia = vi.fn().mockResolvedValue({});
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
    await openMic({ deviceId: "C", monitoring });
    expect(getUserMedia).toHaveBeenCalledExactlyOnceWith({ audio: {
      deviceId: { exact: "C" }, echoCancellation: monitoring === "speakers", noiseSuppression: false, autoGainControl: false,
    } });
  });
});
