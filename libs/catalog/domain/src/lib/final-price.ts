import type { Money } from '@ngsample/shared-domain';
import { applyDiscount } from './apply-discount';
import type { Product } from './product';

export function finalPrice(product: Product): Money {
  return applyDiscount(product.listPrice, product.discount);
}
