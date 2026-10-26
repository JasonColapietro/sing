import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";

/**
 * A fresh browser whose visibility belongs to Chromium, not focus emulation.
 * Playwright's normal launch owns a visible-capture handle on its own CDP
 * session. Disabling focus on a second session cannot release that handle.
 * `noDefaults` avoids creating it, but applies only to the default context.
 * https://playwright.dev/docs/api/class-browsertype#browser-type-connect-over-cdp-option-no-defaults
 * Chromium's per-session ownership: EmulationHandler::SetFocusEmulationEnabled
 * https://chromium.googlesource.com/chromium/src/+/main/content/browser/devtools/protocol/emulation_handler.cc
 */
export async function launchLifecycleBrowser(executablePath, args) {
  if (!executablePath) throw new Error("Visibility cases require --executable=<Chromium path> or --channel=chromium.");
  const profile = await mkdtemp(path.join(os.tmpdir(), "sing-lifecycle-"));
  let child;
  let browser;
  let stderr = "";
  let closed = false;
  let exited;

  const waitForExit = (ms) => new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), ms);
    exited.then(() => { clearTimeout(timer); resolve(true); });
  });

  const close = async () => {
    if (closed) return;
    closed = true;
    // CDP browser.close disconnects this client; the owned child still needs
    // termination. Kill first so a stuck protocol cannot stall cleanup.
    if (child?.pid && child.exitCode === null && child.signalCode === null) {
      child.kill("SIGTERM");
      if (!(await waitForExit(3000))) {
        child.kill("SIGKILL");
        if (!(await waitForExit(3000))) throw new Error(`Chromium did not exit; profile retained at ${profile}`);
      }
    }
    try {
      await browser?.close();
    } finally {
      // Chromium's utility processes can finish profile writes just after the
      // browser process exits. Retry transient ENOTEMPTY/EBUSY removal races;
      // keep persistent cleanup failures fatal rather than hiding them.
      await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    }
  };

  try {
    child = spawn(executablePath, [
      "--headless=new", "--no-sandbox", "--disable-dev-shm-usage",
      "--no-first-run", "--no-default-browser-check",
      "--disable-background-networking", "--disable-component-update",
      "--disable-extensions", "--disable-sync",
      "--password-store=basic", "--use-mock-keychain",
      "--remote-debugging-address=127.0.0.1", "--remote-debugging-port=0",
      `--user-data-dir=${profile}`, ...args, "about:blank",
    ], { stdio: ["ignore", "ignore", "pipe"] });
    exited = new Promise((resolve) => child.once("exit", resolve));
    // Keep draining diagnostics after startup, including asynchronous process
    // errors during teardown; startup's own listener still rejects below.
    child.on("error", (error) => { stderr = (stderr + `\n${error.message}`).slice(-16_384); });
    const endpoint = await new Promise((resolve, reject) => {
      let settled = false;
      const done = (error, url) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        child.off("error", onError);
        child.off("exit", onExit);
        if (error) reject(error);
        else resolve(url);
      };
      const onError = (error) => done(error);
      const onExit = (code, signal) => done(new Error(`Chromium exited before DevTools was ready (${code ?? signal})`));
      const timer = setTimeout(() => done(new Error("Chromium DevTools startup exceeded 20 seconds")), 20_000);
      child.once("error", onError);
      child.once("exit", onExit);
      child.stderr.on("data", (chunk) => {
        stderr = (stderr + chunk.toString()).slice(-16_384);
        const match = /DevTools listening on (ws:\/\/[^\s]+)/.exec(stderr);
        if (match) done(null, match[1]);
      });
    });
    const url = new URL(endpoint);
    if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)) {
      throw new Error("Chromium returned a non-loopback DevTools endpoint");
    }
    browser = await chromium.connectOverCDP(endpoint, { noDefaults: true, timeout: 10_000 });
    const context = browser.contexts()[0];
    if (!context) throw new Error("Chromium did not expose its default context");
    return { browser, context, close, diagnostics: () => stderr };
  } catch (error) {
    console.error(`Lifecycle Chromium startup failed: ${error.message}\n${stderr}`);
    try { await close(); }
    catch (cleanupError) { console.error(`Lifecycle Chromium cleanup failed: ${cleanupError.message}`); }
    throw error;
  }
}
