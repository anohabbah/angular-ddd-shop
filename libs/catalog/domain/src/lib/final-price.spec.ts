import { finalPrice } from './final-price';
import type { Product } from './product';

const product = (listPriceMinor: number, discount: number): Product => ({
  id: 1,
  title: 'Any product',
  description: '',
  category: 'beauty',
  thumbnail: '',
  listPrice: { amountMinor: listPriceMinor, currency: 'USD' },
  discount,
});

describe('finalPrice', () => {
  it('is the list price reduced by the discount', () => {
    expect(finalPrice(product(999, 10.48))).toEqual({ amountMinor: 894, currency: 'USD' });
  });

  it('equals the list price when there is no discount', () => {
    expect(finalPrice(product(1999, 0))).toEqual({ amountMinor: 1999, currency: 'USD' });
  });
});
