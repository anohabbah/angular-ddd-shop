import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { CatalogStore } from '@ngsample/catalog/application';
import { ProductSource } from '@ngsample/catalog/domain';
import { FakeProductSource, product } from '@ngsample/catalog/testing';
import { ProductList } from './product-list';

const mascara = { ...product(1, 'Essence Mascara Lash Princess'), thumbnail: 'mascara.webp' };
const lipstick = { ...product(2, 'Red Lipstick'), discount: 0, thumbnail: 'lipstick.webp' };

describe('ProductList', () => {
  let source: FakeProductSource;

  async function render({ settle = true } = {}): Promise<HTMLElement> {
    TestBed.configureTestingModule({
      providers: [
        CatalogStore,
        { provide: ProductSource, useValue: source },
        provideRouter([{ path: 'catalog', component: ProductList }]),
      ],
    });
    const harness = await RouterTestingHarness.create('/catalog');
    if (settle) await TestBed.inject(ApplicationRef).whenStable();
    return harness.routeNativeElement as HTMLElement;
  }

  beforeEach(() => {
    source = new FakeProductSource();
    source.productsByTerm[''] = [mascara, lipstick];
  });

  it('shows each product with its title, thumbnail and price tag', async () => {
    const element = await render();

    const items = [...element.querySelectorAll('li')];
    expect(items.map((li) => li.querySelector('h2')?.textContent?.trim())).toEqual([
      'Essence Mascara Lash Princess',
      'Red Lipstick',
    ]);
    expect(items[0].querySelector('img')?.getAttribute('src')).toBe('mascara.webp');
    expect(items[0].querySelector('app-price-tag')?.textContent).toContain('$8.94');
    expect(items[1].querySelector('app-price-tag')?.textContent?.trim()).toBe('$9.99');
  });

  it('links each product to its product detail', async () => {
    const element = await render();

    expect(element.querySelector('li a')?.getAttribute('href')).toBe('/catalog/1');
  });

  it('shows a loading indicator while products are loading', async () => {
    source.hold = true;

    const element = await render({ settle: false });
    TestBed.tick();

    expect(element.querySelector('output')?.textContent).toContain('Loading');
  });

  it('shows an error message when the product source fails', async () => {
    source.unavailable = true;

    const element = await render();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Products could not be loaded',
    );
    expect(element.querySelectorAll('li')).toHaveLength(0);
  });

  it('loads the products again when the shopper retries after a failure', async () => {
    source.unavailable = true;
    const element = await render();

    source.unavailable = false;
    const retry = [...element.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Try again'),
    );
    retry?.click();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(element.querySelector('[role="alert"]')).toBeNull();
    expect(element.querySelectorAll('li')).toHaveLength(2);
  });

  describe('searching', () => {
    afterEach(() => vi.useRealTimers());

    const titles = (element: HTMLElement) =>
      [...element.querySelectorAll('li h2')].map((h2) => h2.textContent?.trim());

    it('shows the products matching the search term once the shopper pauses typing', async () => {
      source.productsByTerm['phone'] = [product(3, 'iPhone 9')];
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const element = await render();

      const searchBox = element.querySelector('input[type="search"]') as HTMLInputElement;
      searchBox.value = 'phone';
      searchBox.dispatchEvent(new Event('input'));
      TestBed.tick();
      await vi.advanceTimersByTimeAsync(300);
      TestBed.tick();
      await vi.advanceTimersByTimeAsync(0);
      TestBed.tick();

      expect(titles(element)).toEqual(['iPhone 9']);
    });

    it('says when no products match the settled search term', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const element = await render();

      const searchBox = element.querySelector('input[type="search"]') as HTMLInputElement;
      searchBox.value = 'zzzz';
      searchBox.dispatchEvent(new Event('input'));
      TestBed.tick();
      await vi.advanceTimersByTimeAsync(300);
      TestBed.tick();
      await vi.advanceTimersByTimeAsync(0);
      TestBed.tick();

      expect(element.textContent).toContain('No products match "zzzz"');
    });
  });
});
