import { priceDisplay } from './price-display';
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

describe('priceDisplay', () => {
  it('shows the list price next to the final price when they differ', () => {
    expect(priceDisplay(product(999, 10.48))).toEqual({
      final: { amountMinor: 894, currency: 'USD' },
      list: { amountMinor: 999, currency: 'USD' },
    });
  });

  it('shows only the final price when it equals the list price', () => {
    const display = priceDisplay(product(1999, 0));
    expect(display.final).toEqual({ amountMinor: 1999, currency: 'USD' });
    expect(display).not.toHaveProperty('list');
  });
});
