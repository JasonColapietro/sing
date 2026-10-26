import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const prefs = vi.hoisted(() => ({ inputId: "B", monitoring: "headphones" }));
vi.mock("./devices", () => ({
  getInputDeviceId: () => prefs.inputId,
  getMonitoring: () => prefs.monitoring,
  clearInputDevice: () => { prefs.inputId = ""; },
}));
vi.mock("@/lib/account-gate", () => ({ requireAccountToUse: () => true }));
import { openMic } from "./mic";

beforeEach(() => { prefs.inputId = "B"; prefs.monitoring = "headphones"; });
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
    expect(getUserMedia).toHaveBeenCalledTimes(2);
  });

  it("forgets the failed input when it is still selected and falls back once", async () => {
    const fallback = {} as MediaStream;
    const getUserMedia = vi.fn().mockRejectedValueOnce({ name: "OverconstrainedError" }).mockResolvedValueOnce(fallback);
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
    expect(await openMic()).toEqual({ stream: fallback, error: null });
    expect(prefs.inputId).toBe("");
    expect(getUserMedia).toHaveBeenCalledTimes(2);
    expect(getUserMedia.mock.calls[1][0].audio.deviceId).toBeUndefined();
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
