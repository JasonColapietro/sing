import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const exec = promisify(execFile);
const auditFile = fileURLToPath(new URL("./audit-mic-gate.mjs", import.meta.url));

/** Run the real CLI against the current room structure, without a browser install. */
async function runAudit({ rows = 2, broken = false, alerts = 1, missingAlert = false, wrongContinue = false, continueKicker = 'Continue your path' } = {}) {
  const browserModule = `
    const settings = ${JSON.stringify({ rows, broken, alerts, missingAlert, wrongContinue, continueKicker })};
    const rowSelector = 'main li > button[aria-describedby~="practice-mic-note"]';
    function page() {
      let url = '', shown = false, ready = false, source = '';
      const pageWindow = {};
      const locator = (kind, index = 0) => ({
        first() { return this; }, last() { return locator(kind, settings.rows - 1); },
        nth(n) { return locator(kind, n); },
        locator: () => locator('titles'),
        allTextContents: async () => kind === 'titles'
          ? Array.from({ length: settings.rows }, (_, n) => 'Exercise ' + (n + 1)) : [],
        count: async () => kind === 'rows' ? settings.rows : kind === 'alert' ? (shown ? settings.alerts : 0) : 1,
        boundingBox: async () => ({ x: 0, y: kind === 'alert' ? 156 : 100, width: 400, height: kind === 'alert' ? 20 : 56 }),
        scrollIntoViewIfNeeded: async () => {},
        click: async () => { source = kind; shown = !pageWindow.__micAuditAllow && !settings.missingAlert; ready = !!pageWindow.__micAuditAllow; },
        waitFor: async () => {
          if ((kind === 'alert' && !shown) || (kind === 'ready' && !ready)) throw new Error('element missing');
        },
        evaluate: async (fn) => fn({ parentElement: {
          querySelector: (selector) => selector === '#practice-mic-note' ? {} : null,
          textContent: source === 'continue' && !settings.wrongContinue ? settings.continueKicker : '',
        } }),
      });
      return {
        goto: async (next) => { if (settings.broken) throw new Error('fixture navigation failure'); url = next; shown = false; ready = false; console.log('VISIT ' + next); },
        locator: (selector) => locator(selector === rowSelector ? 'rows' : selector === 'main [role="alert"]' ? 'alert' : 'unknown'),
        getByRole: (_role, { name }) => {
          if (['Start free range test', 'Retake test'].includes(name) && !url.includes('/range?mode=range')) throw new Error('range mode is not open');
          return locator(name === 'Start recording' ? 'ready' : name === 'Enable mic and start' ? 'continue' : 'control');
        },
        waitForTimeout: async () => {},
        evaluate: async (fn) => { const previous = globalThis.window; globalThis.window = pageWindow; try { return fn(); } finally { globalThis.window = previous; } },
      };
    }
    export default { chromium: { launch: async (options) => {
      console.log('LAUNCH ' + JSON.stringify(options));
      return {
        newContext: async () => ({ clearPermissions: async () => {}, addInitScript: async () => {}, newPage: async () => page(), close: async () => {} }),
        close: async () => console.log('BROWSER_CLOSED'),
      };
    } } };
  `;
  const hook = `
    import { registerHooks } from 'node:module';
    const browserUrl = ${JSON.stringify(`data:text/javascript,${encodeURIComponent(browserModule)}`)};
    registerHooks({ resolve(specifier, context, next) {
      return specifier === 'playwright' ? { url: browserUrl, shortCircuit: true } : next(specifier, context);
    } });
  `;
  try {
    const result = await exec(process.execPath, [
      '--import', `data:text/javascript,${encodeURIComponent(hook)}`,
      auditFile, '--executable=/fixture/chromium', 'http://127.0.0.1:3100',
    ], { timeout: 10_000 });
    return { code: 0, ...result };
  } catch (error) {
    if (typeof error.code !== 'number') throw error;
    return { code: error.code, stdout: error.stdout, stderr: error.stderr };
  }
}

describe('microphone audit CLI', () => {
  it('covers current path rows, explicit range mode and recorder recovery with the requested binary', async () => {
    const result = await runAudit();
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('"executablePath":"/fixture/chromium"');
    expect(result.stdout).toContain('2 exercise rows');
    expect(result.stdout).toContain('http://127.0.0.1:3100/range?mode=range');
    expect(result.stdout).toContain('  ok  default pitch meter (Start singing)');
    expect(result.stdout).toContain('recorder retry opens the record deck');
    expect(result.stdout).toContain('  ok  continue-card refusal stays in the card, not its matching path row');
    expect(result.stdout).toContain('BROWSER_CLOSED');
  });

  it("finds a fresh visitor's continue card, which is titled Start here", async () => {
    // CI runs on a clean profile, so the card it presses is the new singer's
    // (components/warmups/warmups-client.tsx), not the returning one's.
    const result = await runAudit({ continueKicker: 'Start here' });
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('  ok  continue-card refusal stays in the card, not its matching path row');
  });

  it('fails when the continue-card refusal lands in its matching path row', async () => {
    const result = await runAudit({ wrongContinue: true });
    expect(result.code).toBe(1);
    expect(result.stdout).toContain('FAIL  continue-card refusal stays in the card, not its matching path row');
    expect(result.stdout).toContain('BROWSER_CLOSED');
  });

  it('fails instead of treating an empty exercise selection as coverage', async () => {
    const result = await runAudit({ rows: 0 });
    expect(result.code).toBe(1);
    expect(result.stdout).toContain('FAIL');
    expect(result.stdout).not.toContain('Every room shows');
    expect(result.stdout).toContain('BROWSER_CLOSED');
  });

  it.each([{ alerts: 2 }, { missingAlert: true }])('fails when denial feedback is duplicated or missing: %o', async (scenario) => {
    const result = await runAudit(scenario);
    expect(result.code).toBe(1);
    expect(result.stdout).not.toContain('Every room shows');
    expect(result.stdout).toContain('BROWSER_CLOSED');
  });

  it('returns a failure and closes the browser if the page cannot be checked', async () => {
    const result = await runAudit({ broken: true });
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('fixture navigation failure');
    expect(result.stdout).toContain('BROWSER_CLOSED');
  });
});
