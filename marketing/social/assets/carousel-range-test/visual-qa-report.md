# Visual QA: chapter 8 carousel

## Review contract

- Output: seven Instagram portrait slides at 1080x1350.
- Source text: `content/book/08-reading-the-range-test.md`.
- Brand references: the committed `CODEX-carousel-brief.md` and the existing
  `carousel-book`, `carousel-numbers`, and `carousel-range` assets.
- Signature visual: a stable two-beat pitch trace beside a broken edge trace.

## Technical audit

| Dimension | Score | Finding |
|---|---:|---|
| Accessibility | 3/4 | Paste-ready alt text covers every exported frame; the HTML is a render source rather than a browsable page. |
| Performance | 4/4 | Static HTML and SVG render without animation, dependencies, or raster source assets. |
| Responsive design | 4/4 | The fixed 1080x1350 canvas is intentional and every export matches it exactly. |
| Theming | 4/4 | All recurring colors use the established carousel tokens. |
| Anti-patterns | 4/4 | No gradients, glass effects, fake metrics, stock card grid, or decorative copy. |
| **Total** | **19/20** | **Excellent** |

Instrument Serif, Manrope, and IBM Plex Mono are preserved because they are
explicit requirements of the established carousel system. The generic font
warning therefore does not apply to this brand extension.

## Frame review

| Slide | Result | Notes |
|---|---|---|
| 1 | Pass | Opener remains legible at feed size; the italic turn carries the hook. |
| 2 | Pass | Quote, floor/ceiling pair, editorial note, and footer remain separate. |
| 3 | Pass | Four protocol rows scan in order with no rule crossing text. |
| 4 | Pass | Both traces read distinctly; captions and card edges clear the footer. |
| 5 | Pass | Five causes and discard rule fit without crowding or orphaned copy. |
| 6 | Pass | Comparison columns and closing guidance retain clear hierarchy. |
| 7 | Pass | Book title, free-access promise, URL, and footer remain unobstructed. |

## Verification

- Rendered every slide with Playwright using installed Chrome.
- Inspected every full frame and each lower 500-pixel crop.
- Confirmed every PNG is exactly 1080x1350.
- Confirmed all sixteen serif quotations across the four carousel directories
  are verbatim, with zero quote-checker problems.
- P0/P1/P2 findings: none.

Final result: passed.
