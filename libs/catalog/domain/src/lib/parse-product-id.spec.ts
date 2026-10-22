import { parseProductId } from './parse-product-id';

describe('parseProductId', () => {
  it('reads a positive whole number', () => {
    expect(parseProductId('1')).toBe(1);
  });

  it.each(['abc', '0', '-1', '1.5', ' 1', ''])('rejects %j', (raw) => {
    expect(parseProductId(raw)).toBeUndefined();
  });
});
