import { TestBed } from '@angular/core/testing';
import type { CartItem } from '@ngsample/cart-domain';
import { CartStore } from './cart-store';

const mascara: CartItem = {
  productId: 1,
  title: 'Essence Mascara Lash Princess',
  thumbnail: 'mascara.webp',
  unitPrice: { amountMinor: 894, currency: 'USD' },
};

const eyeshadow: CartItem = {
  productId: 2,
  title: 'Eyeshadow Palette with Mirror',
  thumbnail: 'eyeshadow.webp',
  unitPrice: { amountMinor: 1999, currency: 'USD' },
};

describe('CartStore', () => {
  let store: CartStore;

  beforeEach(() => {
    store = TestBed.inject(CartStore);
  });

  it('starts as an empty Cart with no total', () => {
    expect(store.lines()).toEqual([]);
    expect(store.total()).toBeUndefined();
    expect(store.itemCount()).toBe(0);
  });

  it('derives the total and item count from the added products', () => {
    store.add(mascara);
    store.add(mascara);
    store.add(eyeshadow);

    expect(store.lines()).toEqual([
      { item: mascara, quantity: 2 },
      { item: eyeshadow, quantity: 1 },
    ]);
    expect(store.itemCount()).toBe(3);
    expect(store.total()).toEqual({ amountMinor: 3787, currency: 'USD' });
  });

  it('changes quantities and removes lines by product id', () => {
    store.add(mascara);
    store.add(eyeshadow);

    store.increase(1);
    store.increase(1);
    store.decrease(1);
    store.remove(2);

    expect(store.lines()).toEqual([{ item: mascara, quantity: 2 }]);
  });

  it('refuses a product in another currency and leaves the Cart unchanged', () => {
    store.add(mascara);

    expect(() =>
      store.add({ ...eyeshadow, unitPrice: { amountMinor: 1999, currency: 'EUR' } }),
    ).toThrow();
    expect(store.lines()).toEqual([{ item: mascara, quantity: 1 }]);
  });
});
