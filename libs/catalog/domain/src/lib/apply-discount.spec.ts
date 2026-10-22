import { applyDiscount } from './apply-discount';

describe('applyDiscount', () => {
  it('reduces the amount by the percentage, rounded to the nearest minor unit', () => {
    expect(applyDiscount({ amountMinor: 999, currency: 'USD' }, 10.48)).toEqual({
      amountMinor: 894,
      currency: 'USD',
    });
  });

  it('keeps the amount when the percentage is 0', () => {
    expect(applyDiscount({ amountMinor: 1999, currency: 'USD' }, 0)).toEqual({
      amountMinor: 1999,
      currency: 'USD',
    });
  });
});
