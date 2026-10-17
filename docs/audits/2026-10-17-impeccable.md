# Suede Sing: Impeccable audit and polish

Date: October 17, 2026. Baseline: `cfab003` on `origin/main`.

## Verdict

The existing paper surfaces, founder portrait, editorial headings, and instrument typography give Sing a recognizable identity. Preserve them. This pass improves the path into browser practice and shared interaction details rather than replacing the visual system.

Scoped health score: **15/20, Good**. These are conservative review scores, not a WCAG certification or a performance benchmark.

| Dimension | Score | Evidence and remaining scope |
| --- | --- | --- |
| Accessibility | 3/4 | Shared hover text now exceeds 8:1; fields retain visible keyboard focus. Assistive-technology testing remains a separate manual check. |
| Performance | 3/4 | No new dependencies, assets, client state, or effects. Reduced motion now also removes entrance delays and card hover translation. No new field performance benchmark was run. |
| Responsive design | 3/4 | Homepage checked at 320, 375, 768, and 1280px; fields and song filters checked interactively on phones. Physical-device testing was not performed. |
| Theming | 3/4 | Existing light-paper theme retained; field styling and hover colors use shared tokens. Older one-off styles remain elsewhere. |
| Anti-patterns | 3/4 | Hero action competition and repeated copy reduced. Existing dense reference and practice surfaces remain intentionally functional. |

## Findings addressed

- **P1, accessibility: primary-button hover contrast.** The shared violet hover fill rendered white text at 4.23:1. The darker hover token with paper-colored text measures **8.07:1**; the recording-button hover measures **8.32:1**. Fixed in `components/ui.tsx` and `app/globals.css`. Impeccable command: polish.
- **P2, responsive controls: undersized field typography and inconsistent shapes.** Singer filters, song search/sort, and audio device selection each repeated their own 14px styling and padding. They now share a 44px minimum height, 16px type, the existing field-border token, and keyboard focus treatment. Measured singer-field boundary contrast is **3.80:1**. The existing global stylesheet already corrected resting field-border contrast; this pass reuses it and keeps the same token on focus. Impeccable commands: adapt, polish.
- **P2, layout: song search competes with sorting on narrow screens.** Search now occupies its own row on phones, with sorting and the discovery action underneath. Search and sort were exercised after entering the actual library through “Continue without a mic.” Impeccable command: adapt.
- **P2, reading: a lesson paragraph stretches across the full practice panel.** The baseline audit measured approximately 124 characters per line. The paragraph now uses the established prose width. Impeccable command: typeset.
- **P3, hierarchy: the homepage presents three equally prominent starting actions.** Browser pitch and range remain the two hero actions; the phone companion has a secondary text link, with its existing store promotion farther down the page. Repeated browser/install copy is removed. Official portrait, logo, route targets, and free-practice disclosure are preserved. Impeccable commands: distill, clarify.
- **P3, motion: reduced-motion mode still moved lifted cards and retained entrance delays.** Both are now suppressed. Impeccable command: polish.

Root causes were one-off control implementations, a missing hover color token, and a crowded hero hierarchy. Shared fixes were preferred over screen-specific overrides.

## Validation

- Lint and TypeScript checks passed.
- Full unit suite: **2,816 passed, 5 skipped**, across 196 passing files and one skipped file; the separate IndexNow suite passed **12/12**.
- Independent review found no blocking issues; its targeted regression run passed **229 tests**.
- Before and after: four browser audits (contrast, tap targets, layout, semantics), **11 routes × two viewports**. Routes: home, tools, studio, warmups, range, songs, progress, learn, book, singers, and a voice lesson. Both completed without harness errors or blocker/major findings. Distinct minor diagnostic groups changed from 17 to 15.
- Additional interaction checks covered homepage reflow at 320/375/768/1280px, singer search and URL updates, keyboard focus, reduced-motion hover, song search/sort at 375px, and expanded audio setup at 320px.

Most remaining minor diagnostic groups are the existing contrast audit comparing an offset focus outline with the button fill rather than its surrounding surface. A focused recording button was verified with a real keyboard transition: its outline has a 2px offset and **6.33:1** contrast against the surrounding panel. The range control's joined segments also retain an advisory spacing warning. These diagnostics were not used to justify changing working interactions.

## Continuing the work

Use `PRODUCT.md` for the implementation-derived product context. An optional Impeccable document pass can capture the complete visual token and component inventory in `DESIGN.md`. For deeper coverage, audit active microphone-driven practice states with controlled audio fixtures, then run Impeccable polish on any verified findings. Re-run the audit after future changes; do not infer accessibility conformance from the numeric score alone.
