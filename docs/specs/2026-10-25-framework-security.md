# Framework security patch

Base: main 147e7208a0d0e3d8fb6ed18641f7f677a70f2b01. Preserve public indexing and PR #248 independently; do not merge #248 into production before this patch passes.

Pin Next and eslint-config-next to 16.4.1, regenerate the npm lock from the official registry, and require sharp >=0.35.5 and source-map-js >=1.2.2 in the resolved graph. Preserve React 19.2.4, supported by Next's peer range. No evidence of exploitation is asserted.

Sources checked 2026-10-25:
- https://nextjs.org/blog/nextjs-security-update-october-14-2026 (Cache Components typed arrays, image SVG, Server Actions)
- https://github.com/lovell/sharp/security/advisories/GHSA-wq5f-xc86-pv6w (sharp <0.35.5)
- https://github.com/advisories/GHSA-68fv-2mgg-jv7q (source-map-js <1.2.2)

Acceptance: clean dependency install; resolved patched versions; typecheck, lint, full unit tests and production build; CI's journeys, audio, audits and layout-shift suites on latest merge tree. Verify image generation, critical public routes and static content indexing without credentials. Independent review before merge. Observe automatic production deployment; never treat the deliberately ignored PR Vercel build as a preview.

After this patch merges, reconcile #248 with current main and rerun full checks, including microphone permission/release, count-in, focus and mobile/desktop journeys. No hosting settings or access changes.
