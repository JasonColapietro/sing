/**
 * Which glossary terms each voice module trains, so the two page sets link to
 * each other: a module page names its terms with a link to each definition,
 * and a glossary entry can point to the free lessons that practise the word.
 *
 * Keyed by module ID, like lib/lesson-practice.ts, and listing only terms the
 * module is about rather than every word it happens to use. A term belongs to
 * one module. The names are the glossary's own `term` strings; the test holds
 * each to an entry this site publishes, so a renamed term fails rather than
 * linking to an anchor that no longer exists.
 */
import { SING_GLOSSARY_TERMS, termId } from "@/lib/glossary";
import { COURSE, type CourseModule } from "@/lib/voice-lessons";

export const MODULE_TERMS: Record<string, readonly string[]> = {
  "v-l1-m2": ["Vocal range"],
  "v-l1-m3": ["Breath support"],
  "v-l2-m1": ["Lip trill"],
  "v-l2-m2": ["Onset"],
  "v-l2-m4": ["Transposition"],
  "v-l3-m1": ["Register", "Chest voice", "Head voice", "Falsetto"],
  "v-l3-m2": ["Siren"],
  "v-l3-m3": ["Vowel"],
  "v-l3-m5": ["Pressed phonation"],
  "v-l4-m1": ["Intonation"],
  "v-l4-m2": ["Metronome", "Count-in"],
  "v-l4-m4": ["Staccato"],
  "v-l4-m5": ["Dynamics"],
  "v-l5-m1": ["Passaggio"],
  "v-l5-m3": ["Twang", "Resonance"],
  "v-l5-m4": ["Mix", "Belt"],
  "v-l6-m3": ["Vibrato"],
};

const PUBLISHED = new Map(SING_GLOSSARY_TERMS.map((e) => [e.term, e]));

/** A module's glossary terms with their anchors on /glossary. */
export function moduleTerms(moduleId: string): Array<{ term: string; href: string }> {
  return (MODULE_TERMS[moduleId] ?? [])
    .filter((term) => PUBLISHED.has(term))
    .map((term) => ({ term, href: `/glossary#${termId(term)}` }));
}

const MODULE_FOR_TERM = new Map<string, CourseModule>(
  COURSE.flatMap((s) => s.modules).flatMap((m) =>
    (MODULE_TERMS[m.catalog.id] ?? []).map((term) => [term, m] as const),
  ),
);

/**
 * The free lessons that train a glossary term, for a link from its entry:
 * the module's name and page, or undefined when no module is about it.
 */
export function courseModuleForTerm(term: string): { name: string; href: string } | undefined {
  const m = MODULE_FOR_TERM.get(term);
  return m?.href ? { name: m.catalog.name, href: m.href } : undefined;
}
