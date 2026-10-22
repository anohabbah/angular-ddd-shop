import type { Money } from '@ngsample/shared/domain';
import type { Discount } from './product';

export function applyDiscount(money: Money, discount: Discount): Money {
  return { ...money, amountMinor: Math.round(money.amountMinor * (1 - discount / 100)) };
}
