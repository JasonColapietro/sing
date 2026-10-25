# Framework security patch

Base: main 147e7208a0d0e3d8fb6ed18641f7f677a70f2b01. Preserve public indexing and PR #248 independently; do not merge #248 into production before this patch passes.

Pin Next and eslint-config-next to 16.4.1, regenerate the npm lock from the official registry, and require sharp >=0.35.5 and source-map-js >=1.2.2 in the resolved graph. Preserve React 19.2.4, supported by Next's peer range. No evidence of exploitation is asserted.

Sources checked 2026-10-25:
- https://nextjs.org/blog/nextjs-security-update-october-14-2026 (Cache Components typed arrays, image SVG, Server Actions)
- https://github.com/lovell/sharp/security/advisories/GHSA-wq5f-xc86-pv6w (sharp <0.35.5)
- https://github.com/advisories/GHSA-68fv-2mgg-jv7q (source-map-js <1.2.2)

Acceptance: clean dependency install; resolved patched versions; typecheck, lint, full unit tests and production build; CI's journeys, audio, audits and layout-shift suites on latest merge tree. Verify image generation, critical public routes and static content indexing without credentials. Independent review before merge. Observe automatic production deployment; never treat the deliberately ignored PR Vercel build as a preview.

After this patch merges, reconcile #248 with current main and rerun full checks, including microphone permission/release, count-in, focus and mobile/desktop journeys. No hosting settings or access changes.

## Regression found during verification

CI on the patched framework reproduced an inherited singer-directory Back failure. Five diagnostic desktop returns failed four times: the saved first-visible Andrea Bocelli anchor returned within 0.5px, but Annie Lennox moved from 521.42px to 528.42px. Departures were measured at 521.42px, ruling out an early test baseline; animation frames continued normally. The rows use content-visibility with 56px intrinsic estimates, so restoring one anchor did not preserve distances between visible rows as skipped rows materialized.

Use real layout for paginated rich directory rows on both departure and return by removing cv-auto from SingerRow only. Pagination already bounds the initial list to 48 rows and subsequent loaded batches. The global content-visibility utility and its other consumers remain unchanged. This trades off offscreen layout savings for stable geometry in the interactive paginated chart; full mobile, desktop and layout-shift suites must pass.

Return-only materialization and a commit-order guard were investigated and superseded: preserving only the first anchor cannot preserve distances between visible rows if estimated rows change between departure and return. The final implementation adds no state flags or scroll correction loops. Five independent desktop header/Back checks retain the original two-pixel/five-second assertion, with no predeparture diagnostic reads. Failure-only diagnostics capture actual row layout.

## Current-main reconciliation

Another authorized actor merged PR #248 at f0c2af7802955806ad7d94e6161b35e7d148af62 while this security work was validating. Reconcile that main, including its unrelated dormant intake commits, into this branch without changing those files. Repository instructions are unchanged. Preserve all five #248 changes and require independent review plus full CI/build/browser checks on the reconciled head. The earlier plan to merge security before #248 was overtaken by that external merge; no claim of prior deployment protection or exploitation is made.

## Combined-head microphone verification

Reconciled-head CI passed strict singer return checks but failed one silent warmup mic-retention assertion (opened1/stopped1/live0). Warmup application logic is unchanged by #248 and this patch. Instrument the existing media-track wrapper with stop time, elapsed-open duration, current headings/dialog text and stack; emit it only on failure. Repeat the strict silent-retention case across three contexts, retaining the 400ms idle override and expected live track count. Determine the stop source before changing release behavior.

A subsequent external merge, PR #252 at651a1c7b069fa6542183cecca0876f7ff7b5d8e1, updated public schema entities/categories and tests. Reconcile it unchanged and validate the combined head again before merge. Repository instructions remain unchanged.
