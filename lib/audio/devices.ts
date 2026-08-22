"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

/**
 * Which microphone the singer sings into, and which speakers the app plays out
 * of.
 *
 * Every listening surface used to call `getUserMedia` with no `deviceId` at
 * all, which means the browser picked — and the browser picks badly. A laptop
 * with a USB interface plugged in still defaults to the lid mic six inches
 * from the fan. A phone paired to earbuds routes through the earbud mic, which
 * is a speech mic with a 4 kHz ceiling and aggressive processing of its own.
 * In both cases the singer is scored on the worst microphone in the room and
 * has no way to know, let alone change it: the range test tells them their top
 * note is a fifth lower than it is, and they believe it.
 *
 * The choice is persisted per-device rather than synced, because it is a fact
 * about the room someone is standing in, not about their account.
 */

const INPUT_KEY = "suede-sing:audio:input:v2";
const OUTPUT_KEY = "suede-sing:audio:output:v1";
const MONITOR_KEY = "suede-sing:audio:monitor:v1";

/**
 * Where the singer hears the app: through headphones, isolated from the mic,
 * or out loud into the same room the mic is listening to.
 *
 * This is not a cosmetic preference. Reference tones, drones and backing
 * melodies all play while the mic is open, so on speakers the app hears its
 * own output. Pitch detection cannot tell that tone apart from a voice — it
 * is a cleaner, steadier signal than a voice, so it wins — and the singer is
 * scored on the note the app just played to them. That is a perfect score for
 * standing silently in front of a laptop.
 */
export type Monitoring = "headphones" | "speakers";

export interface AudioDevice {
  deviceId: string;
  label: string;
}

/** The system default, chosen by not choosing. */
export const DEFAULT_DEVICE_ID = "";

/* ------------------------------------------------------------------ store */

interface Prefs {
  inputId: string;
  outputId: string;
  monitoring: Monitoring;
}

const DEFAULT_PREFS: Prefs = {
  inputId: DEFAULT_DEVICE_ID,
  outputId: DEFAULT_DEVICE_ID,
  monitoring: "headphones",
};

let prefs: Prefs | null = null;
const listeners = new Set<() => void>();

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function loadPrefs(): Prefs {
  if (prefs) return prefs;
  if (typeof window === "undefined") return DEFAULT_PREFS;
  const monitoring = read(MONITOR_KEY);
  prefs = {
    inputId: read(INPUT_KEY) ?? DEFAULT_DEVICE_ID,
    outputId: read(OUTPUT_KEY) ?? DEFAULT_DEVICE_ID,
    monitoring: monitoring === "speakers" ? "speakers" : "headphones",
  };
  return prefs;
}

function emit() {
  for (const l of listeners) l();
}

function write(key: string, value: string) {
  try {
    if (value) window.localStorage.setItem(key, value);
    else window.localStorage.removeItem(key);
  } catch {
    // storage unavailable — the in-memory preference still applies this session
  }
}

export function getAudioPrefs(): Prefs {
  return loadPrefs();
}

export function subscribeAudioPrefs(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function setInputDevice(deviceId: string): void {
  prefs = { ...loadPrefs(), inputId: deviceId };
  write(INPUT_KEY, deviceId);
  emit();
}

export function setOutputDevice(deviceId: string): void {
  prefs = { ...loadPrefs(), outputId: deviceId };
  write(OUTPUT_KEY, deviceId);
  emit();
}

export function setMonitoring(monitoring: Monitoring): void {
  prefs = { ...loadPrefs(), monitoring };
  write(MONITOR_KEY, monitoring);
  emit();
}

/** The chosen input, or "" for the system default. */
export function getInputDeviceId(): string {
  return loadPrefs().inputId;
}

export function getOutputDeviceId(): string {
  return loadPrefs().outputId;
}

export function getMonitoring(): Monitoring {
  return loadPrefs().monitoring;
}

/**
 * Forgets an input that no longer exists.
 *
 * A stored id survives the interface being unplugged, and reopening the mic
 * against a device that is gone throws OverconstrainedError — which the mic
 * error table reads as "that microphone couldn't be opened" and shows to a
 * singer who has done nothing wrong. Clearing the preference lets the next
 * attempt fall back to the system default and succeed.
 */
export function clearInputDevice(): void {
  setInputDevice(DEFAULT_DEVICE_ID);
}

/* ------------------------------------------------------------ enumeration */

/**
 * Whether the browser can even tell us what devices exist.
 *
 * Firefox has `enumerateDevices` but has never implemented `setSinkId`, so
 * output selection has to degrade to "whatever the OS is doing" rather than
 * render a control that does nothing.
 */
export function canListDevices(): boolean {
  return (
    typeof navigator !== "undefined" && !!navigator.mediaDevices?.enumerateDevices
  );
}

export function canChooseOutput(): boolean {
  if (typeof window === "undefined") return false;
  return (
    typeof AudioContext !== "undefined" &&
    "setSinkId" in AudioContext.prototype
  );
}

/**
 * Lists the audio devices the browser will admit to.
 *
 * Labels are empty strings until the origin has been granted microphone
 * permission once — the spec hides them so a page cannot fingerprint a machine
 * before asking for anything. That is why the picker is rendered *after* the
 * mic is running wherever possible, and why the fallback label below is
 * positional ("Microphone 2") rather than a lie about what the device is.
 */
export async function listDevices(): Promise<{
  inputs: AudioDevice[];
  outputs: AudioDevice[];
}> {
  if (!canListDevices()) return { inputs: [], outputs: [] };
  let devices: MediaDeviceInfo[];
  try {
    devices = await navigator.mediaDevices.enumerateDevices();
  } catch {
    return { inputs: [], outputs: [] };
  }

  const take = (kind: MediaDeviceKind, noun: string): AudioDevice[] => {
    const of = devices.filter((d) => d.kind === kind);
    return of.map((d, i) => ({
      deviceId: d.deviceId,
      label: d.label || `${noun} ${i + 1}`,
    }));
  };

  return {
    // "default" and "communications" are Chrome's aliases for the same physical
    // device the OS has selected, and listing all three makes one microphone
    // look like three. The explicit default option in the picker covers them.
    inputs: take("audioinput", "Microphone").filter(
      (d) => d.deviceId !== "default" && d.deviceId !== "communications",
    ),
    outputs: take("audiooutput", "Output").filter(
      (d) => d.deviceId !== "default" && d.deviceId !== "communications",
    ),
  };
}

/* ------------------------------------------------------------------ hooks */

const NOT_READY = () => DEFAULT_PREFS;

export function useAudioPrefs(): Prefs {
  return useSyncExternalStore(subscribeAudioPrefs, getAudioPrefs, NOT_READY);
}

export interface UseAudioDevicesResult {
  inputs: AudioDevice[];
  outputs: AudioDevice[];
  /** True once enumeration has run at least once. */
  loaded: boolean;
  /** True when labels are still hidden because permission has not been granted. */
  needsPermission: boolean;
  refresh: () => void;
}

/**
 * Keeps the device list current.
 *
 * `devicechange` fires when an interface is plugged in or earbuds connect, and
 * a picker that does not listen for it shows a stale list at exactly the moment
 * the singer went looking for the device they just plugged in.
 */
export function useAudioDevices(): UseAudioDevicesResult {
  const [inputs, setInputs] = useState<AudioDevice[]>([]);
  const [outputs, setOutputs] = useState<AudioDevice[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(() => {
    void listDevices().then(({ inputs, outputs }) => {
      setInputs(inputs);
      setOutputs(outputs);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    refresh();
    const md = navigator.mediaDevices;
    if (!md?.addEventListener) return;
    md.addEventListener("devicechange", refresh);
    return () => md.removeEventListener("devicechange", refresh);
  }, [refresh]);

  return {
    inputs,
    outputs,
    loaded,
    // Every label blank with devices present is the pre-permission state; a
    // machine with genuinely unnamed devices is not a case that exists.
    needsPermission:
      loaded && inputs.length > 0 && inputs.every((d) => !d.deviceId),
    refresh,
  };
}
