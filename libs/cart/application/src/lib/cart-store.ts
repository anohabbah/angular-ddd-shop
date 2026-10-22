import { computed, Injectable, signal } from '@angular/core';
import {
  addItem,
  type CartItem,
  type CartLine,
  cartTotal,
  decreaseQuantity,
  increaseQuantity,
  itemCount,
  removeLine,
} from '@ngsample/cart-domain';
import type { ProductId } from '@ngsample/shared-domain';

/** One Cart for the whole session, shared by the header, the catalog and the cart page. */
@Injectable({ providedIn: 'root' })
export class CartStore {
  readonly #lines = signal<readonly CartLine[]>([]);
  readonly lines = this.#lines.asReadonly();

  readonly total = computed(() => cartTotal(this.lines()));
  readonly itemCount = computed(() => itemCount(this.lines()));

  add(item: CartItem): void {
    this.#lines.update((lines) => addItem(lines, item));
  }

  increase(productId: ProductId): void {
    this.#lines.update((lines) => increaseQuantity(lines, productId));
  }

  decrease(productId: ProductId): void {
    this.#lines.update((lines) => decreaseQuantity(lines, productId));
  }

  remove(productId: ProductId): void {
    this.#lines.update((lines) => removeLine(lines, productId));
  }
}
