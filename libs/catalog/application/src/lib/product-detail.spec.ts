import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ProductSource } from '@ngsample/catalog-domain';
import { FakeProductSource, product } from '@ngsample/catalog-testing';
import { productDetail } from './product-detail';

const mascara = product(1, 'Essence Mascara Lash Princess');

describe('productDetail', () => {
  let source: FakeProductSource;
  const settle = () => TestBed.inject(ApplicationRef).whenStable();

  beforeEach(() => {
    source = new FakeProductSource();
    source.productsById[1] = mascara;
    TestBed.configureTestingModule({ providers: [{ provide: ProductSource, useValue: source }] });
  });

  it('is not found, without asking the product source, when there is no valid product id', async () => {
    const detail = TestBed.runInInjectionContext(() => productDetail(() => undefined));

    await settle();

    expect(detail.notFound()).toBe(true);
    expect(source.requestedIds).toEqual([]);
  });

  it('shows the product with that id', async () => {
    const detail = TestBed.runInInjectionContext(() => productDetail(() => 1));

    await settle();

    expect(detail.product.value()).toEqual(mascara);
    expect(detail.notFound()).toBe(false);
  });

  it('is not found when the product source has no product with that id', async () => {
    const detail = TestBed.runInInjectionContext(() => productDetail(() => 99999));

    await settle();

    expect(detail.notFound()).toBe(true);
  });
});
