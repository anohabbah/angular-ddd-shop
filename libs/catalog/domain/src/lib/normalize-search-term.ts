/** The search term without surrounding whitespace; the settled search term once typing pauses. */
export function normalizeSearchTerm(term: string): string {
  return term.trim();
}
