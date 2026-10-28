/**
 * Shared by the content compilers: write a generated file, or with `--check`
 * report whether the committed copy is stale instead of writing anything.
 */
import { readFileSync, writeFileSync } from "node:fs";

export const CHECK = process.argv.includes("--check");

/** "lib/singers-data.ts" for a file URL. */
const nameOf = (url) => url.pathname.split("/").slice(-2).join("/");

/** Line counts and the first line that differs. */
export function diffSummary(current, next) {
  const a = current.split("\n");
  const b = next.split("\n");
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  const show = (line) =>
    line === undefined ? "<end of file>" : JSON.stringify(line.length > 80 ? `${line.slice(0, 77)}...` : line);
  return `${a.length} committed lines vs ${b.length} generated; first difference at line ${i + 1}: ${show(a[i])} vs ${show(b[i])}`;
}

/**
 * Writes `text` to `target` and returns null. With `--check`, writes nothing
 * and returns why the file is stale, or null when it is current; a missing
 * file counts as stale.
 */
export function emit(target, text, compiler) {
  if (!CHECK) {
    writeFileSync(target, text);
    return null;
  }
  let current = "";
  try {
    current = readFileSync(target, "utf8");
  } catch {
    // Missing counts as stale.
  }
  if (current === text) return null;
  return `${nameOf(target)} is stale (${diffSummary(current, text)}): run node scripts/${compiler}`;
}
