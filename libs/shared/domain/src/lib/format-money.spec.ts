import { formatMoney } from './format-money';

describe('formatMoney', () => {
  it('shows an amount in its currency with two decimals', () => {
    expect(formatMoney({ amountMinor: 894, currency: 'USD' })).toBe('$8.94');
    expect(formatMoney({ amountMinor: 2682, currency: 'USD' })).toBe('$26.82');
  });
});
