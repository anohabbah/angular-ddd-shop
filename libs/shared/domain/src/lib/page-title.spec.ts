import { pageTitle } from './page-title';

describe('pageTitle', () => {
  it('names the page, then the shop', () => {
    expect(pageTitle('Catalog')).toBe('Catalog | ngsample');
    expect(pageTitle('Essence Mascara Lash Princess')).toBe(
      'Essence Mascara Lash Princess | ngsample',
    );
  });
});
