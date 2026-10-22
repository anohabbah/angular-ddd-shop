import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { CartStore } from '@ngsample/cart-application';
import { ProductSource } from '@ngsample/catalog-domain';
import { FakeProductSource, product } from '@ngsample/catalog-testing';
import { catalogRoutes } from '../catalog.routes';

const mascara = {
  ...product(1, 'Essence Mascara Lash Princess'),
  description: 'A volumizing and lengthening mascara.',
};

describe('ProductDetail', () => {
  let source: FakeProductSource;

  async function open(url: string, { settle = true } = {}): Promise<HTMLElement> {
    TestBed.configureTestingModule({
      providers: [
        { provide: ProductSource, useValue: source },
        provideRouter(catalogRoutes, withComponentInputBinding()),
      ],
    });
    const harness = await RouterTestingHarness.create(url);
    if (settle) await TestBed.inject(ApplicationRef).whenStable();
    return harness.routeNativeElement as HTMLElement;
  }

  beforeEach(() => {
    source = new FakeProductSource();
    source.productsById[1] = mascara;
  });

  it('shows the product the URL points to, with its prices', async () => {
    const element = await open('/1');

    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Essence Mascara Lash Princess');
    expect(element.textContent).toContain('A volumizing and lengthening mascara.');
    expect(element.textContent).toContain('beauty');
    expect(element.querySelector('app-price-tag')?.textContent).toContain('$8.94');
    expect(element.querySelector('app-price-tag s')?.textContent).toBe('$9.99');
  });

  it('says the product is not found, without asking the product source, for a non-numeric id', async () => {
    const element = await open('/abc');

    expect(element.textContent).toContain('Product not found');
    expect(source.requestedIds).toEqual([]);
  });

  it('says the product is not found when the product source has no product with that id', async () => {
    const element = await open('/99999');

    expect(element.textContent).toContain('Product not found');
    expect(source.requestedIds).toEqual([99999]);
  });

  it('shows an error state, and no product, when the product source fails', async () => {
    source.unavailable = true;

    const element = await open('/1');

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Product could not be loaded. Please try again later.',
    );
    expect(element.querySelector('h1')).toBeNull();
  });

  it('shows a loading indicator while the product is loading', async () => {
    source.hold = true;

    const element = await open('/1', { settle: false });
    TestBed.tick();

    expect(element.querySelector('output')?.textContent).toContain('Loading product');
  });

  it('links back to the catalog', async () => {
    const element = await open('/1');

    const back = [...element.querySelectorAll('a')].find((a) =>
      a.textContent?.includes('Back to catalog'),
    );
    expect(back?.getAttribute('href')).toBe('/');
  });

  it('adds the product to the Cart, once per click, at its final price', async () => {
    const element = await open('/1');
    const addToCart = [...element.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Add to cart'),
    );

    addToCart?.click();
    addToCart?.click();

    expect(TestBed.inject(CartStore).lines()).toEqual([
      {
        item: {
          productId: 1,
          title: 'Essence Mascara Lash Princess',
          thumbnail: '',
          unitPrice: { amountMinor: 894, currency: 'USD' },
        },
        quantity: 2,
      },
    ]);
  });
});
