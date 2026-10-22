import type { Product } from './product';
import { toCartItem } from './to-cart-item';

const mascara: Product = {
  id: 1,
  title: 'Essence Mascara Lash Princess',
  description: 'A volumizing and lengthening mascara.',
  category: 'beauty',
  thumbnail: 'mascara.webp',
  listPrice: { amountMinor: 999, currency: 'USD' },
  discount: 10.48,
};

describe('toCartItem', () => {
  it('snapshots the product with its final price as the unit price', () => {
    expect(toCartItem(mascara)).toEqual({
      productId: 1,
      title: 'Essence Mascara Lash Princess',
      thumbnail: 'mascara.webp',
      unitPrice: { amountMinor: 894, currency: 'USD' },
    });
  });
});
