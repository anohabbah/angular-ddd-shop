import type { Money } from '@ngsample/shared-domain';
import { finalPrice } from './final-price';
import type { Product } from './product';

/** The prices shown for a product: the list price only when it differs from the final price. */
export interface PriceDisplay {
  final: Money;
  list?: Money;
}

export function priceDisplay(product: Product): PriceDisplay {
  const final = finalPrice(product);
  return final.amountMinor === product.listPrice.amountMinor
    ? { final }
    : { final, list: product.listPrice };
}
