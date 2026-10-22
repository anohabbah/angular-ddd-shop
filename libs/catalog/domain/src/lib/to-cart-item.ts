import type { CartItem } from '@ngsample/cart/domain';
import { finalPrice } from './final-price';
import type { Product } from './product';

/** Translates a Product into the Cart's own terms (ADR 0001). */
export function toCartItem(product: Product): CartItem {
  return {
    productId: product.id,
    title: product.title,
    thumbnail: product.thumbnail,
    unitPrice: finalPrice(product),
  };
}
