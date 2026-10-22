import type { Money } from './money';

export function formatMoney(money: Money): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: money.currency }).format(
    money.amountMinor / 100,
  );
}
