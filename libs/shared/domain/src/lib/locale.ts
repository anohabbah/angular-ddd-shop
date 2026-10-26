import * as z from 'zod/mini';

export const Locale = z.enum(['fr-FR', 'en-US']);
export type Locale = z.infer<typeof Locale>;
export const defaultLocale: Locale = 'fr-FR';

export function resolveLocale(preferredLanguages: readonly string[]): Locale {
  for (const preferred of preferredLanguages) {
    const language = preferred.split('-')[0].toLowerCase();
    const locale = Locale.options.find((option) => option.startsWith(`${language}-`));
    if (locale) return locale;
  }
  return defaultLocale;
}
