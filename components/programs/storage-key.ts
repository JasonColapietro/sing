/**
 * The localStorage key of the singer's place in a program. Its own module so
 * the header (components/nav.tsx) can tell whether a program is stored without
 * importing lib/programs, which carries every program and the song catalog.
 */
export const PROGRAM_STORAGE_KEY = "suede-sing:program:v1";

/** True when this browser holds a program record (a left program is stored as null). */
export function hasStoredProgram(): boolean {
  try {
    const raw = window.localStorage.getItem(PROGRAM_STORAGE_KEY);
    return raw !== null && raw !== "null";
  } catch {
    return false;
  }
}
