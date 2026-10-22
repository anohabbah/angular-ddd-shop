import {
  addItem,
  type CartItem,
  cartTotal,
  CurrencyMismatchError,
  decreaseQuantity,
  increaseQuantity,
  itemCount,
  lineTotal,
  removeLine,
} from './cart';

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

describe('addItem', () => {
  it('adds a product that is not in the Cart as a new line with a quantity of 1', () => {
    expect(addItem([], mascara)).toEqual([{ item: mascara, quantity: 1 }]);
  });

  it('keeps Cart lines in the order their products were first added', () => {
    const lines = addItem(addItem([], mascara), eyeshadow);

    expect(lines).toEqual([
      { item: mascara, quantity: 1 },
      { item: eyeshadow, quantity: 1 },
    ]);
  });

  it('increases the quantity of a product already in the Cart', () => {
    const lines = addItem(addItem([], mascara), mascara);

    expect(lines).toEqual([{ item: mascara, quantity: 2 }]);
  });

  it('keeps the unit price the product was first added with', () => {
    const repriced = { ...mascara, unitPrice: { amountMinor: 799, currency: 'USD' } };

    const lines = addItem(addItem([], mascara), repriced);

    expect(lines).toEqual([
      { item: { ...mascara, unitPrice: { amountMinor: 894, currency: 'USD' } }, quantity: 2 },
    ]);
  });

  it('refuses a product in another currency and leaves the Cart unchanged', () => {
    const lines = addItem([], mascara);
    const inEuros = { ...eyeshadow, unitPrice: { amountMinor: 1999, currency: 'EUR' } };

    expect(() => addItem(lines, inEuros)).toThrow(CurrencyMismatchError);
    expect(lines).toEqual([{ item: mascara, quantity: 1 }]);
  });
});

describe('increaseQuantity', () => {
  it('increases a Cart line quantity by 1', () => {
    expect(increaseQuantity([{ item: mascara, quantity: 2 }], 1)).toEqual([
      { item: mascara, quantity: 3 },
    ]);
  });
});

describe('decreaseQuantity', () => {
  it('decreases a Cart line quantity by 1', () => {
    expect(decreaseQuantity([{ item: mascara, quantity: 2 }], 1)).toEqual([
      { item: mascara, quantity: 1 },
    ]);
  });

  it('keeps a quantity of 1 and the line in the Cart', () => {
    expect(decreaseQuantity([{ item: mascara, quantity: 1 }], 1)).toEqual([
      { item: mascara, quantity: 1 },
    ]);
  });
});

describe('removeLine', () => {
  it('removes a Cart line whatever its quantity and keeps the others', () => {
    const lines = [
      { item: mascara, quantity: 3 },
      { item: eyeshadow, quantity: 1 },
    ];

    expect(removeLine(lines, 1)).toEqual([{ item: eyeshadow, quantity: 1 }]);
  });
});

describe('lineTotal', () => {
  it('is the unit price multiplied by the quantity', () => {
    expect(lineTotal({ item: mascara, quantity: 3 })).toEqual({
      amountMinor: 2682,
      currency: 'USD',
    });
  });
});

describe('cartTotal', () => {
  it('is the sum of the line totals', () => {
    const lines = [
      { item: mascara, quantity: 3 },
      { item: eyeshadow, quantity: 1 },
    ];

    expect(cartTotal(lines)).toEqual({ amountMinor: 4681, currency: 'USD' });
  });

  it('is absent for an empty Cart', () => {
    expect(cartTotal([])).toBeUndefined();
  });
});

describe('itemCount', () => {
  it('is the sum of the quantities', () => {
    const lines = [
      { item: mascara, quantity: 3 },
      { item: eyeshadow, quantity: 1 },
    ];

    expect(itemCount(lines)).toBe(4);
  });

  it('is 0 for an empty Cart', () => {
    expect(itemCount([])).toBe(0);
  });
});
