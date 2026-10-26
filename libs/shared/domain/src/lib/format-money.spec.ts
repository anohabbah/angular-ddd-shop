import { formatMoney } from './format-money';

describe('formatMoney', () => {
  it('shows an amount in its currency with two decimals', () => {
    expect(formatMoney({ amountMinor: 894, currency: 'USD' }, 'en-US')).toBe('$8.94');
    expect(formatMoney({ amountMinor: 2682, currency: 'USD' }, 'en-US')).toBe('$26.82');
  });

  it('follows the conventions of the Locale', () => {
    expect(formatMoney({ amountMinor: 894, currency: 'USD' }, 'fr-FR')).toBe('8,94\u00a0$US');
  });
});
