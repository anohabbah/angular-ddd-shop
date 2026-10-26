import type { Locale } from './locale';
import type { Money } from './money';

export function formatMoney(money: Money, locale: Locale): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: money.currency }).format(
    money.amountMinor / 100,
  );
}
