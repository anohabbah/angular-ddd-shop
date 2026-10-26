import enUS from './en-US.json';
import frFR from './fr-FR.json';

describe('catalog translations', () => {
  it('have the same keys in every Locale', () => {
    expect(Object.keys(enUS).sort()).toEqual(Object.keys(frFR).sort());
  });
});
