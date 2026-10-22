import { ProductId } from './product-id';

describe('ProductId', () => {
  it('accepts a positive whole number', () => {
    expect(ProductId.safeParse(1).success).toBe(true);
  });

  it('rejects zero, negative and fractional numbers', () => {
    expect(ProductId.safeParse(0).success).toBe(false);
    expect(ProductId.safeParse(-1).success).toBe(false);
    expect(ProductId.safeParse(1.5).success).toBe(false);
  });
});
