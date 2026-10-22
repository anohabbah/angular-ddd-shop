import { Product } from './product';

const mascara = {
  id: 1,
  title: 'Essence Mascara Lash Princess',
  description: 'A volumizing and lengthening mascara.',
  category: 'beauty',
  thumbnail:
    'https://cdn.dummyjson.com/product-images/beauty/essence-mascara-lash-princess/thumbnail.webp',
  listPrice: { amountMinor: 999, currency: 'USD' },
  discount: 10.48,
};

describe('Product', () => {
  it('accepts a valid product', () => {
    expect(Product.safeParse(mascara).success).toBe(true);
  });

  it('rejects a negative list price', () => {
    const product = { ...mascara, listPrice: { amountMinor: -100, currency: 'USD' } };
    expect(Product.safeParse(product).success).toBe(false);
  });

  it('rejects a discount above 100%', () => {
    expect(Product.safeParse({ ...mascara, discount: 120 }).success).toBe(false);
  });

  it('accepts discounts of exactly 0% and 100%', () => {
    expect(Product.safeParse({ ...mascara, discount: 0 }).success).toBe(true);
    expect(Product.safeParse({ ...mascara, discount: 100 }).success).toBe(true);
  });
});
