import { normalizeSearchTerm } from './normalize-search-term';

describe('normalizeSearchTerm', () => {
  it('removes surrounding whitespace', () => {
    expect(normalizeSearchTerm('  phone  ')).toBe('phone');
  });

  it('turns a blank term into the empty term', () => {
    expect(normalizeSearchTerm('   ')).toBe('');
  });
});
