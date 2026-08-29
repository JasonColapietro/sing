/**
 * Document semantics and assistive-technology surface.
 *
 * Everything here is markup an AT user depends on that a mouse-only pass
 * never notices: heading outline, landmark regions, image/control naming,
 * ARIA wiring, and the couple of document-level attributes (lang, title)
 * that fire before any content does.
 *
 * Runs on every route, including /sign-in and /sign-up — Clerk renders its
 * own components there and every class it emits is prefixed "cl-", which we
 * cannot edit. Findings inside a `.cl-` subtree are downgraded to minor with
 * a vendor note instead of being dropped (so a real Clerk regression still
 * shows up) or reported at full severity (so it doesn't block a release on
 * markup nobody here owns).
 */
export const id = "semantics";
export const title = "Document semantics and assistive-technology surface";

export async function run(ctx) {
  const { page } = ctx;
  const raw = await page.evaluate(() => {
    const describe = window.__describe;
    const out = [];
    const add = (severity, summary, detail, el) =>
      out.push({
        severity,
        summary,
        detail: detail ?? "",
        selector: el ? describe(el) : "",
        clerk: el ? inClerkSubtree(el) : false,
      });

    // ---- shared helpers -----------------------------------------------

    function hasAncestorOrSelf(el, predicate) {
      for (let n = el; n; n = n.parentElement) {
        if (predicate(n)) return true;
      }
      return false;
    }

    // Clerk's BEM-ish class names (cl-formButtonPrimary, cl-card__main, ...)
    // all start with the literal "cl-" token. startsWith is deliberate over
    // a substring test: "circle"/"clear"/"clickable" all contain "cl" but
    // none has a hyphen as the third character, so real product classes
    // can't collide with it.
    const inClerkSubtree = (el) =>
      hasAncestorOrSelf(el, (n) => n.classList && [...n.classList].some((c) => c.startsWith("cl-")));

    // aria-hidden="true" is authors' explicit "skip this for AT" signal —
    // distinct from display:none, which just means "not shown yet" (an
    // unopened accordion, a closed dialog). Treat it as an opt-out for the
    // per-element naming checks below so a deliberately-duplicated,
    // AT-hidden clone doesn't get flagged for something real content
    // elsewhere already covers.
    const isAriaHiddenAncestor = (el) =>
      hasAncestorOrSelf(el, (n) => n.getAttribute && n.getAttribute("aria-hidden") === "true");

    // "Is this actually in the accessibility tree right now, at this
    // viewport?" checkVisibility() (real Chrome only — see run.mjs's
    // channel: "chrome") is the one cheap primitive that accounts for the
    // *entire* ancestor chain. A manual getComputedStyle(el).display check
    // does not: a display:none ancestor does not force a descendant's own
    // computed display to "none", so walking up by hand silently passes
    // content buried under a hidden parent.
    function isReachable(el) {
      if (typeof el.checkVisibility === "function") {
        return el.checkVisibility({ checkVisibilityCSS: true });
      }
      return el.getClientRects().length > 0;
    }

    function isFocusable(el) {
      if (!(el instanceof Element) || el.hasAttribute("disabled")) return false;
      const tabindex = el.getAttribute("tabindex");
      if (tabindex !== null) {
        const n = parseInt(tabindex, 10);
        return Number.isFinite(n) && n >= 0;
      }
      const tag = el.tagName.toLowerCase();
      if (tag === "a" || tag === "area") return el.hasAttribute("href");
      if (tag === "button" || tag === "select" || tag === "textarea") return true;
      if (tag === "input") return (el.getAttribute("type") || "text").toLowerCase() !== "hidden";
      if (tag === "iframe") return true;
      if (tag === "audio" || tag === "video") return el.hasAttribute("controls");
      if (tag === "summary") return el.parentElement?.tagName.toLowerCase() === "details";
      return !!el.isContentEditable;
    }

    // Accessible-name resolution shared by headings, buttons, and links.
    // Deliberately mirrors the real accname algorithm rather than using
    // innerText/textContent directly: aria-label wins, then aria-labelledby,
    // then visible subtree text, then title. The subtree walk (collectText)
    // is the load-bearing part — it *excludes* aria-hidden="true" and
    // display:none/visibility:hidden descendants (real ATs skip them too),
    // but *includes* sr-only-styled text (clip-path/absolute-position),
    // because that text is never display:none — hiding it visually is the
    // entire point of the pattern, and it must count as a real name.
    function collectText(node) {
      if (node.nodeType === Node.TEXT_NODE) return node.textContent;
      if (node.nodeType !== Node.ELEMENT_NODE) return "";
      if (node.getAttribute("aria-hidden") === "true") return "";
      const style = getComputedStyle(node);
      if (style.display === "none" || style.visibility === "hidden") return "";
      if (node.tagName === "IMG") return node.getAttribute("alt") || "";
      let text = "";
      for (const child of node.childNodes) text += " " + collectText(child);
      return text;
    }

    function idRefText(idList) {
      return idList
        .split(/\s+/)
        .filter(Boolean)
        .map((rid) => document.getElementById(rid)?.textContent || "")
        .join(" ")
        .trim();
    }

    function accName(el) {
      const label = el.getAttribute("aria-label");
      if (label && label.trim()) return label.trim();

      const labelledby = el.getAttribute("aria-labelledby");
      if (labelledby) {
        const text = idRefText(labelledby);
        if (text) return text;
      }

      const fromContent = collectText(el).replace(/\s+/g, " ").trim();
      if (fromContent) return fromContent;

      const title = el.getAttribute("title");
      return title ? title.trim() : "";
    }

    // Landmark names come from aria-label/aria-labelledby only — never from
    // subtree text. A <nav> full of links has plenty of textContent, but
    // that's the nav's *content*, not a name a human gave it; falling back
    // to it here would make almost any two navs look "distinguishable" by
    // their different links and silently pass the exact bug this exists to
    // catch.
    function landmarkName(el) {
      const label = el.getAttribute("aria-label");
      if (label && label.trim()) return label.trim();
      const labelledby = el.getAttribute("aria-labelledby");
      return labelledby ? idRefText(labelledby) : "";
    }

    // The platform already resolves both `<label for>` and wrapping `<label>`
    // associations via .labels (HTMLInputElement/Select/TextArea) — using it
    // instead of a hand-rolled `label[for="${id}"]` selector sidesteps every
    // id-escaping edge case (colons, leading digits, framework-generated
    // ids like React's useId) for free.
    function hasFormLabel(el) {
      const label = el.getAttribute("aria-label");
      if (label && label.trim()) return true;
      const labelledby = el.getAttribute("aria-labelledby");
      if (labelledby && idRefText(labelledby)) return true;
      if (el.labels && el.labels.length > 0) return true;
      const title = el.getAttribute("title");
      return !!(title && title.trim());
    }

    function looksLikeFilename(s) {
      if (/\.(jpe?g|png|gif|webp|svg|avif|bmp|tiff?)$/i.test(s)) return true;
      if (/^(img|dsc|image|photo|screen[-_ ]?shot)[-_ ]?\d+/i.test(s)) return true;
      return false;
    }

    // Concrete WAI-ARIA 1.2 roles (abstract roles like "widget"/"roletype"
    // are deliberately excluded — authors shouldn't use them either, so
    // "not in this set" correctly flags both typos and abstract misuse).
    const ARIA_ROLES = new Set([
      "alert", "alertdialog", "application", "article", "banner", "blockquote", "button", "caption",
      "cell", "checkbox", "code", "columnheader", "combobox", "comment", "complementary", "contentinfo",
      "definition", "deletion", "dialog", "directory", "document", "emphasis", "feed", "figure", "form",
      "generic", "grid", "gridcell", "group", "heading", "img", "insertion", "link", "list", "listbox",
      "listitem", "log", "main", "mark", "marquee", "math", "menu", "menubar", "menuitem",
      "menuitemcheckbox", "menuitemradio", "meter", "navigation", "none", "note", "option", "paragraph",
      "presentation", "progressbar", "radio", "radiogroup", "region", "row", "rowgroup", "rowheader",
      "scrollbar", "search", "searchbox", "separator", "slider", "spinbutton", "status", "strong",
      "subscript", "suggestion", "superscript", "switch", "tab", "table", "tablist", "tabpanel", "term",
      "textbox", "time", "timer", "toolbar", "tooltip", "tree", "treegrid", "treeitem",
    ]);
    function isValidRole(token) {
      const t = token.toLowerCase();
      // DPUB-ARIA (doc-*) and Graphics-ARIA (graphics-*) are real, narrower
      // spec modules used by reading- and diagram-heavy markup — allow the
      // prefix instead of hand-listing every module role.
      return t.startsWith("doc-") || t.startsWith("graphics-") || ARIA_ROLES.has(t);
    }

    // ---- 1. heading hierarchy ------------------------------------------
    (function checkHeadings() {
      const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter(
        (el) => !isAriaHiddenAncestor(el),
      );

      // Empty-name check runs against every heading regardless of current
      // visibility: the harness never opens accordions/dialogs, so a heading
      // sitting in a closed one only ever gets audited in this state — skip
      // it here and the bug never gets caught at all.
      for (const el of headings) {
        if (!accName(el)) {
          add(
            "major",
            "Heading has no accessible text",
            "textContent (excluding aria-hidden descendants) resolves to empty — announced as a bare 'heading level N' with nothing to navigate by.",
            el,
          );
        }
      }

      // Count/hierarchy checks are about the outline an AT user perceives
      // RIGHT NOW at this viewport, so they're scoped to reachable headings
      // only. Without that, a standard responsive pattern — a mobile nav
      // heading and a desktop nav heading, both in the DOM, CSS-toggled by
      // breakpoint — reads as a duplicate h1 or a bogus skipped level on
      // every single page.
      const visible = headings.filter(isReachable).map((el) => ({ el, level: Number(el.tagName[1]) }));

      const h1s = visible.filter((h) => h.level === 1);
      if (h1s.length === 0) {
        add("major", "Page has no reachable <h1>", "h1 count = 0 among headings currently exposed to assistive tech at this viewport.");
      } else {
        for (const extra of h1s.slice(1)) {
          add(
            "major",
            "Page has more than one <h1>",
            `h1 count = ${h1s.length} — ambiguous primary heading for AT users navigating by heading list.`,
            extra.el,
          );
        }
      }

      let prevLevel = 0;
      for (const h of visible) {
        if (prevLevel > 0 && h.level > prevLevel + 1) {
          add(
            "minor",
            "Heading level is skipped",
            `h${prevLevel} is followed directly by h${h.level} — heading navigation implies a level in between that doesn't exist.`,
            h.el,
          );
        }
        prevLevel = h.level;
      }
    })();

    // ---- 2. landmarks ----------------------------------------------------
    (function checkLandmarks() {
      const mains = [...document.querySelectorAll("main, [role~=main]")].filter(isReachable);
      if (mains.length === 0) {
        add("major", "Page has no reachable <main> landmark", "main count = 0 at this viewport — AT users relying on landmark navigation can't jump to primary content.");
      } else {
        for (const extra of mains.slice(1)) {
          add("major", "Page has more than one <main> landmark", `main count = ${mains.length} — landmark navigation can't tell which is primary.`, extra);
        }
      }

      const navs = [...document.querySelectorAll("nav, [role~=navigation]")].filter(isReachable);
      if (navs.length > 1) {
        const names = navs.map(landmarkName);
        navs.forEach((nav, i) => {
          const name = names[i];
          if (!name) {
            add(
              "minor",
              "Multiple <nav> landmarks but this one has no distinguishing name",
              `${navs.length} <nav> landmarks reachable at this viewport; this one has no aria-label/aria-labelledby so landmark navigation can't tell it apart from the rest.`,
              nav,
            );
          } else if (names.filter((n) => n === name).length > 1) {
            add(
              "minor",
              "Multiple <nav> landmarks share the same accessible name",
              `aria-label/aria-labelledby resolves to "${name}" for ${names.filter((n) => n === name).length} reachable <nav> landmarks.`,
              nav,
            );
          }
        });
      }

      // <footer> only carries the page-level "contentinfo" landmark role
      // when it isn't nested inside article/aside/main/nav/section — e.g. a
      // singer/song detail page's own <article><footer>citation</footer>
      // is real HTML but is NOT the page's contentinfo landmark. Counting
      // it would mask a genuinely missing page-level footer.
      const SECTIONING_ANCESTORS = "article, aside, main, nav, section";
      const footers = [...document.querySelectorAll("footer, [role~=contentinfo]")]
        .filter((el) => el.getAttribute("role") || !el.closest(SECTIONING_ANCESTORS))
        .filter(isReachable);
      if (footers.length === 0) {
        add("minor", "Page has no reachable <footer>/contentinfo landmark", "footer count = 0 at this viewport — AT landmark navigation has no way to jump to page-end content.");
      }
    })();

    // ---- 3. images --------------------------------------------------------
    (function checkImages() {
      for (const img of document.querySelectorAll("img")) {
        if (!img.hasAttribute("alt")) {
          add("major", "<img> has no alt attribute", "Missing alt entirely (not even alt=\"\") — screen readers fall back to announcing the filename or 'image'.", img);
          continue;
        }
        const alt = img.getAttribute("alt").trim();
        if (!alt) continue; // alt="" is the correct, deliberate decorative marker — never flag it.

        if (/^(image|picture) of\b/i.test(alt)) {
          add("minor", 'alt text starts with a redundant "image of"/"picture of"', `alt="${alt}" — screen readers already announce the role ("image"); the prefix is noise.`, img);
        } else if (looksLikeFilename(alt)) {
          add("minor", "alt text looks like a filename, not a description", `alt="${alt}"`, img);
        }
      }
    })();

    // ---- 4. form controls ---------------------------------------------
    (function checkFormControls() {
      // isReachable matters as much as the type=hidden test. The standard
      // "styled upload button" pattern puts a display:none <input type=file>
      // next to a visible <Button>Import JSON</Button> that clicks it, and a
      // display:none input is never in the accessibility tree at all -- so
      // reporting that a screen reader announces it unlabelled describes
      // something no screen reader reaches. The name that matters is the
      // visible button's, and that one is checked separately.
      const controls = [...document.querySelectorAll("input, select, textarea")].filter(
        (el) =>
          (el.getAttribute("type") || "").toLowerCase() !== "hidden" &&
          !isAriaHiddenAncestor(el) &&
          isReachable(el),
      );

      for (const el of controls) {
        const tag = el.tagName.toLowerCase();
        const type = tag === "input" ? (el.getAttribute("type") || "text").toLowerCase() : null;

        // submit/reset get a UA-supplied default label ("Submit"/"Reset")
        // even with no value attribute — requiring an explicit label would
        // be a false positive.
        if (type === "submit" || type === "reset") continue;

        if (type === "button") {
          // Unlike submit/reset, type=button has NO built-in default text —
          // an <input type="button"> with no value is a genuinely blank
          // button, not a false positive.
          const value = el.getAttribute("value");
          const named = (value && value.trim()) || hasFormLabel(el);
          if (!named) {
            add("major", "input[type=button] has no accessible name", "No value attribute, aria-label, or aria-labelledby, and type=button (unlike submit/reset) has no built-in default label.", el);
          }
          continue;
        }

        if (type === "image") {
          const alt = el.getAttribute("alt");
          if (!alt || !alt.trim()) {
            add("major", "input[type=image] has no alt text", "Acts as a graphical submit button with no accessible name.", el);
          }
          continue;
        }

        if (hasFormLabel(el)) continue;
        add(
          "major",
          `${tag}${type ? `[type=${type}]` : ""} has no accessible name`,
          "No <label for>, wrapping <label>, aria-label, or aria-labelledby — a screen reader announces the field type with no indication of what to enter.",
          el,
        );
      }
    })();

    /**
     * An accessible name can only be computed from markup the browser is
     * actually rendering. This app ships a desktop and a mobile nav at once and
     * CSS-toggles them, so at any given width one of them is display:none --
     * and every label inside it is invisible to the name computation for the
     * same reason it is invisible to a screen reader. Checking those produced
     * an exactly inverted result: the mobile menu button was flagged only at
     * tablet and desktop, and the desktop XP link only at the two phone widths,
     * each one reported precisely where it is not rendered.
     *
     * Nothing is lost by skipping them. The suite runs five viewports, so every
     * control is name-checked at the widths where it is on screen.
     */
    // ---- 5. buttons and links ----------------------------------------
    (function checkButtonsAndLinks() {
      const buttons = [...document.querySelectorAll("button, [role~=button]")].filter(
        (el) => !isAriaHiddenAncestor(el) && isReachable(el),
      );
      for (const btn of buttons) {
        if (!accName(btn)) {
          add("major", "Button has no accessible name", "No text content, aria-label, or aria-labelledby — announced as a bare 'button'. Icon-only buttons need an aria-label.", btn);
        }
      }

      const linkTextCounts = new Map();
      for (const a of document.querySelectorAll("a")) {
        if (isAriaHiddenAncestor(a)) continue;

        if (!a.hasAttribute("href")) {
          // A bare <a> has no link semantics at all — browsers expose it
          // with role "generic", not "link". Flag it only when something
          // clearly signals it's meant to be activated like a button, so a
          // legacy `<a name="section">` jump target (real HTML, not a
          // control) isn't a false positive.
          const actsAsControl = a.hasAttribute("onclick") || a.getAttribute("role") === "button" || a.hasAttribute("tabindex");
          if (actsAsControl) {
            add("major", "<a> used as a button has no href", "Anchors without href don't get native link semantics or guaranteed keyboard reachability. Use a <button>, or add a real href.", a);
          }
          continue;
        }

        const name = accName(a);
        if (!name && isReachable(a)) {
          add("major", "Link has no accessible name", "No text content, aria-label, or aria-labelledby — announced as a bare 'link' with no destination context.", a);
          continue;
        }

        // "is only" -> exact match, not substring, so real sentences that
        // happen to contain these words aren't swept up. Trailing
        // punctuation ("Click here.") is stripped before comparing.
        const normalized = name.toLowerCase().replace(/[.!,;:]+$/, "");
        if (["click here", "read more", "learn more"].includes(normalized)) {
          if (!linkTextCounts.has(normalized)) linkTextCounts.set(normalized, []);
          linkTextCounts.get(normalized).push(a);
        }
      }

      for (const [text, els] of linkTextCounts) {
        if (els.length > 2) {
          for (const a of els) {
            add(
              "minor",
              `Link text "${text}" is repeated ${els.length} times on this page`,
              "Identical ambiguous link text gives screen reader users (especially rotor/links-list navigation) no way to tell the links apart out of context.",
              a,
            );
          }
        }
      }
    })();

    // ---- 6. ARIA validity ------------------------------------------------
    (function checkAriaValidity() {
      const idRefAttrs = ["aria-labelledby", "aria-describedby", "aria-controls"];

      for (const el of document.querySelectorAll("*")) {
        for (const attr of idRefAttrs) {
          const val = el.getAttribute(attr);
          if (!val) continue;
          const missing = val.split(/\s+/).filter(Boolean).filter((rid) => !document.getElementById(rid));
          if (missing.length) {
            // aria-labelledby/aria-describedby feed the accessible name/
            // description directly, so a dangling reference can silently
            // leave a control unlabeled. aria-controls is a weaker
            // relationship hint with patchy AT support — same authoring
            // mistake, lower stakes.
            const severity = attr === "aria-controls" ? "minor" : "major";
            add(severity, `${attr} references an id that doesn't exist`, `${attr}="${val}" but ${missing.map((m) => `#${m}`).join(", ")} not found in document.`, el);
          }
        }

        const role = el.getAttribute("role");
        if (role) {
          const tokens = role.split(/\s+/).filter(Boolean);
          if (tokens.length && !tokens.some(isValidRole)) {
            add("major", "role attribute has no valid ARIA role", `role="${role}" — not a recognized WAI-ARIA role, so the intended semantics are silently dropped for AT users.`, el);
          }
        }

        if (el.getAttribute("aria-hidden") === "true") {
          const trapped = [el, ...el.querySelectorAll("*")].find((c) => isFocusable(c) && isReachable(c));
          if (trapped) {
            add(
              "major",
              'aria-hidden="true" hides a focusable control from assistive tech',
              `Contains ${describe(trapped)}, which is still in the tab order — keyboard users can reach it while screen reader/switch users can't perceive it exists.`,
              el,
            );
          }
        }
      }
    })();

    // ---- 7. duplicate ids -------------------------------------------------
    (function checkDuplicateIds() {
      const byId = new Map();
      for (const el of document.querySelectorAll("[id]")) {
        const elId = el.id.trim();
        if (!elId) continue;
        if (!byId.has(elId)) byId.set(elId, []);
        byId.get(elId).push(el);
      }
      for (const [elId, els] of byId) {
        if (els.length <= 1) continue;
        for (const el of els) {
          add(
            "major",
            `Duplicate id "${elId}"`,
            `id="${elId}" used by ${els.length} elements (${els.map((e) => e.tagName.toLowerCase()).join(", ")}) — getElementById only ever returns the first, so every aria-labelledby/aria-describedby/for/#hash reference to it is unreliable.`,
            el,
          );
        }
      }
    })();

    // ---- 8. language and title ---------------------------------------
    (function checkLangAndTitle() {
      const lang = document.documentElement.getAttribute("lang");
      if (!lang || !lang.trim()) {
        add("major", "<html> has no lang attribute", "Screen readers fall back to their default voice/pronunciation rules instead of the page's actual language.", document.documentElement);
      }

      const titleEl = document.querySelector("title");
      const titleText = (document.title || "").trim();
      const GENERIC_TITLES = new Set(["document", "react app", "next.js app", "create next app", "untitled", "vite + react"]);
      if (!titleText) {
        add("major", "Page has no <title>", "An empty title leaves screen reader users (announced first on load) and multi-tab/window switching with nothing to orient by.", titleEl);
      } else if (GENERIC_TITLES.has(titleText.toLowerCase())) {
        add("minor", "Page <title> looks like a framework placeholder", `title="${titleText}" — not unique to this page's content.`, titleEl);
      }
    })();

    // ---- 9. tables ---------------------------------------------------------
    (function checkTables() {
      for (const table of document.querySelectorAll("table")) {
        const role = (table.getAttribute("role") || "").toLowerCase();
        if (role === "presentation" || role === "none") continue; // explicitly opted out as layout-only

        const ths = [...table.querySelectorAll("th")];
        if (ths.length === 0) {
          add(
            "minor",
            "Table has no <th> header cells",
            'No column/row headers — a screen reader reading a cell can\'t announce what it\'s a value of. Add <th scope> headers, or role="presentation" if this is a layout table.',
            table,
          );
          continue;
        }
        const unscoped = ths.filter((th) => !th.getAttribute("scope"));
        if (unscoped.length) {
          add(
            "minor",
            `${unscoped.length} <th> cell(s) missing a scope attribute`,
            'scope="col"/"row" removes any ambiguity about which header a cell belongs to, especially in irregular tables.',
            unscoped[0],
          );
        }
      }
    })();

    return out;
  });

  return raw.map(downgradeVendorFindings);
}

/**
 * Clerk's own markup (anything under a `.cl-` class, tagged in-browser as
 * `clerk: true`) isn't ours to fix. Report it — a real Clerk regression
 * should still be visible — but never let it gate a release the way a
 * first-party bug does.
 */
function downgradeVendorFindings(f) {
  const { clerk, ...finding } = f;
  if (!clerk || finding.severity === "minor") return finding;
  return {
    ...finding,
    severity: "minor",
    detail: finding.detail
      ? `${finding.detail} Markup is vendor-controlled (Clerk .cl- component) — not ours to fix directly.`
      : "Markup is vendor-controlled (Clerk .cl- component) — not ours to fix directly.",
  };
}
