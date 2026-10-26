import { resolveLocale } from './locale';

describe('resolveLocale', () => {
  it('picks the Locale that exactly matches a Preferred language', () => {
    expect(resolveLocale(['en-US'])).toBe('en-US');
    expect(resolveLocale(['fr-FR'])).toBe('fr-FR');
  });

  it('matches on the language part, the first Preferred language winning', () => {
    expect(resolveLocale(['en-GB'])).toBe('en-US');
    expect(resolveLocale(['fr-CA', 'en-US'])).toBe('fr-FR');
  });

  it('skips Preferred languages the shop does not support', () => {
    expect(resolveLocale(['de-DE', 'en-GB'])).toBe('en-US');
  });

  it('falls back to fr-FR when no Preferred language is supported', () => {
    expect(resolveLocale(['de-DE', 'es-ES'])).toBe('fr-FR');
    expect(resolveLocale([])).toBe('fr-FR');
  });

  it('ignores case and never throws on bare or malformed tags', () => {
    expect(resolveLocale(['EN'])).toBe('en-US');
    expect(resolveLocale(['', 'x', 'en-US'])).toBe('en-US');
  });
});
