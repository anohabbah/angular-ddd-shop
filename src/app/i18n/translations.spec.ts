import enUS from './en-US.json';
import frFR from './fr-FR.json';

/** Every key path of a translation file, e.g. `nav.cart`. */
function keysOf(translation: object, prefix = ''): string[] {
  return Object.entries(translation).flatMap(([key, value]) =>
    typeof value === 'object' ? keysOf(value, `${prefix}${key}.`) : [`${prefix}${key}`],
  );
}

describe('shell translations', () => {
  it('have the same keys in every Locale', () => {
    expect(keysOf(enUS).sort()).toEqual(keysOf(frFR).sort());
  });
});
