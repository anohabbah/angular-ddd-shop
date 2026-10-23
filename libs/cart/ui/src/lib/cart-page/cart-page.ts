import { NgOptimizedImage } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  viewChild,
  viewChildren,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { CartStore } from '@ngsample/cart/application';
import { focusAfterRemoval, lineTotal } from '@ngsample/cart/domain';
import { formatMoney, type ProductId } from '@ngsample/shared/domain';

@Component({
  selector: 'app-cart-page',
  imports: [NgOptimizedImage, RouterLink, MatIconButton, MatDivider, MatIcon],
  templateUrl: './cart-page.html',
})
export class CartPage {
  protected readonly cart = inject(CartStore);
  readonly #injector = inject(Injector);
  private readonly removeButtons = viewChildren('removeButton', { read: ElementRef<HTMLElement> });
  private readonly empty = viewChild('empty', { read: ElementRef<HTMLElement> });

  protected readonly rows = computed(() =>
    this.cart.lines().map((line) => ({
      line,
      unitPrice: formatMoney(line.item.unitPrice),
      lineTotal: formatMoney(lineTotal(line)),
    })),
  );
  protected readonly total = computed(() => {
    const total = this.cart.total();
    return total && formatMoney(total);
  });

  /** Removes a Cart line, then moves focus to the next line, else the previous one, else the empty-cart message. */
  protected remove(productId: ProductId): void {
    const target = focusAfterRemoval(this.cart.lines(), productId);
    this.cart.remove(productId);
    afterNextRender(
      () => {
        const element =
          target === undefined
            ? this.empty()
            : this.removeButtons().find(
                (button) => button.nativeElement.dataset['productId'] === String(target),
              );
        element?.nativeElement.focus();
      },
      { injector: this.#injector },
    );
  }
}
