import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ProductSource } from '@ngsample/catalog/domain';
import { FakeProductSource, product } from '@ngsample/catalog/testing';
import { CatalogStore } from './catalog-store';

const mascara = product(1, 'Essence Mascara Lash Princess');

describe('CatalogStore', () => {
  let source: FakeProductSource;
  let store: CatalogStore;
  const settle = () => TestBed.inject(ApplicationRef).whenStable();

  beforeEach(() => {
    source = new FakeProductSource();
    TestBed.configureTestingModule({
      providers: [CatalogStore, { provide: ProductSource, useValue: source }],
    });
    store = TestBed.inject(CatalogStore);
  });

  it('lists the first page of all products before any search term is typed', async () => {
    source.productsByTerm[''] = [mascara];

    await settle();

    expect(source.searchedTerms).toEqual(['']);
    expect(store.products.value()).toEqual([mascara]);
  });

  it('has no matches when the product source returns no products', async () => {
    await settle();

    expect(store.hasNoMatches()).toBe(true);
  });

  it('has matches when the product source returns products', async () => {
    source.productsByTerm[''] = [mascara];

    await settle();

    expect(store.hasNoMatches()).toBe(false);
  });

  it('exposes an error when the product source fails', async () => {
    source.unavailable = true;

    await settle();

    expect(store.products.error()).toBeDefined();
    expect(store.hasNoMatches()).toBe(false);
  });

  it('loads the products again on reload, after the product source failed', async () => {
    source.unavailable = true;
    await settle();

    source.unavailable = false;
    source.productsByTerm[''] = [mascara];
    store.reload();
    await settle();

    expect(source.searchedTerms).toEqual(['', '']);
    expect(store.products.value()).toEqual([mascara]);
  });

  describe('while the shopper types', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    /** Lets signals, effects and timers run for `ms` milliseconds of fake time. */
    const elapse = async (ms: number) => {
      TestBed.tick();
      await vi.advanceTimersByTimeAsync(ms);
      TestBed.tick();
      await vi.advanceTimersByTimeAsync(0);
    };

    it('searches only for the term typed last, 300 ms after the last keystroke', async () => {
      await elapse(0);

      store.setSearchTerm('p');
      await elapse(100);
      store.setSearchTerm('ph');
      await elapse(100);
      store.setSearchTerm('pho');
      await elapse(299);
      expect(source.searchedTerms).toEqual(['']);

      await elapse(1);
      expect(source.searchedTerms).toEqual(['', 'pho']);
    });

    it('sends no new search when the settled search term does not change', async () => {
      await elapse(0);
      store.setSearchTerm('phone');
      await elapse(300);
      expect(source.searchedTerms).toEqual(['', 'phone']);

      store.setSearchTerm('  phone  ');
      await elapse(300);
      store.setSearchTerm('phone ');
      await elapse(100);
      store.setSearchTerm('phone');
      await elapse(300);

      expect(source.searchedTerms).toEqual(['', 'phone']);
    });

    it('keeps listing the first page of all products for a blank search term', async () => {
      source.productsByTerm[''] = [mascara];
      await elapse(0);

      store.setSearchTerm('   ');
      await elapse(300);

      expect(store.settledSearchTerm()).toBe('');
      expect(source.searchedTerms).toEqual(['']);
      expect(store.products.value()).toEqual([mascara]);
    });
  });
});
