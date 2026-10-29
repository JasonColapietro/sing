import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

/**
 * The #259 copy conventions, guarded in the practice rooms a singer reads
 * mid-session: American spelling, and no em dashes in rendered copy (ranges
 * take an en dash, "C3–C5"). Only string literals, template text and JSX text
 * are checked, so code comments and identifiers (`analyser`, `centreShift`)
 * never trip it. A bare "—" is the empty-value placeholder in score and note
 * readouts, not prose, and is allowed.
 */

const ROOT = join(__dirname, "..");

const SOURCES = [
  "components/analyze",
  "app/analyze",
  "components/tools",
  "components/ear",
  "components/breath",
  "components/warmups",
  "components/progress",
  "components/practice",
  "components/recorder",
  "components/studio",
  "components/songs",
  "components/figures",
  "lib/daily-three.ts",
  "lib/vocal-learning.ts",
  "lib/weekly-report.ts",
];

/** British forms the site has switched to American spelling. */
const BRITISH =
  /\b(practis(e|es|ed|ing)|unpractised|centre[sd]?|colour(s|ed|ing|ful)?|favour(s|ed|ite|ites|ing)?|analys(e|es|ed|ing)|judgement|recognis(e|es|ed|ing|able|ably)|labell(ed|ing)|travell(ed|ing)|programme[s]?|metre[s]?|behaviour[s]?)\b/i;

const EM_DASH = /—|&mdash;|&#8212;/;

function walk(path: string): string[] {
  const abs = join(ROOT, path);
  if (!statSync(abs).isDirectory()) return [path];
  return readdirSync(abs).flatMap((name) => walk(join(path, name)));
}

function files(): string[] {
  return SOURCES.flatMap(walk).filter(
    (f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f),
  );
}

type Hit = { file: string; line: number; text: string };

/** Every piece of literal text in a file that could reach a singer. */
function literals(file: string): Hit[] {
  const source = readFileSync(join(ROOT, file), "utf8");
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const out: Hit[] = [];
  const add = (node: ts.Node, text: string) =>
    out.push({ file, line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1, text });
  const visit = (node: ts.Node) => {
    // Module specifiers are paths, not copy.
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) return;
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) add(node, node.text);
    else if (ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) add(node, node.text);
    else if (ts.isJsxText(node)) add(node, node.getText(sf));
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}

const ALL = files().flatMap(literals);

const show = (hits: Hit[]) => hits.map((h) => `${relative(".", h.file)}:${h.line} ${JSON.stringify(h.text.trim())}`);

describe("practice-room copy conventions (#259)", () => {
  it("scans the practice rooms", () => {
    expect(files().length).toBeGreaterThan(40);
    expect(ALL.length).toBeGreaterThan(500);
  });

  it("uses American spelling in rendered strings", () => {
    expect(show(ALL.filter((h) => BRITISH.test(h.text)))).toEqual([]);
  });

  it("keeps em dashes out of rendered strings (a bare placeholder is fine)", () => {
    expect(show(ALL.filter((h) => EM_DASH.test(h.text) && h.text.trim() !== "—"))).toEqual([]);
  });

  it("would catch the forms it guards", () => {
    for (const s of ["What would you like to practise?", "off centre", "no favourite", "it does not analyse"]) {
      expect(BRITISH.test(s), s).toBe(true);
    }
    for (const s of ["practice", "analysis", "analyser", "center", "favorite", "Practiced"]) {
      expect(BRITISH.test(s), s).toBe(false);
    }
  });
});
