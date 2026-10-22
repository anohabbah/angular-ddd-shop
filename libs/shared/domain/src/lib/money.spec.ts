import { Money } from './money';

describe('Money', () => {
  it('accepts a non-negative whole amount of minor units in a 3-letter currency', () => {
    expect(Money.safeParse({ amountMinor: 999, currency: 'USD' }).success).toBe(true);
  });

  it('rejects a negative amount', () => {
    expect(Money.safeParse({ amountMinor: -1, currency: 'USD' }).success).toBe(false);
  });

  it('rejects a fractional amount of minor units', () => {
    expect(Money.safeParse({ amountMinor: 9.99, currency: 'USD' }).success).toBe(false);
  });

  it('rejects a currency that is not 3 letters', () => {
    expect(Money.safeParse({ amountMinor: 999, currency: 'US' }).success).toBe(false);
    expect(Money.safeParse({ amountMinor: 999, currency: 'U$D' }).success).toBe(false);
  });
});
