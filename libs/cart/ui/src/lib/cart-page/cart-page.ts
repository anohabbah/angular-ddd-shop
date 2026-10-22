import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartStore } from '@ngsample/cart/application';
import { lineTotal } from '@ngsample/cart/domain';
import { formatMoney } from '@ngsample/shared/domain';

@Component({
  selector: 'app-cart-page',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './cart-page.html',
})
export class CartPage {
  protected readonly cart = inject(CartStore);

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
}
