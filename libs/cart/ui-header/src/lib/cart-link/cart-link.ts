import { I18nPluralPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatBadge } from '@angular/material/badge';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { CartStore } from '@ngsample/cart/application';

@Component({
  selector: 'app-cart-link',
  imports: [RouterLink, MatBadge, MatIconButton, MatIcon, I18nPluralPipe],
  templateUrl: './cart-link.html',
})
export class CartLink {
  protected readonly cart = inject(CartStore);

  /** Keyed by the locale's plural categories; `#` is the item count. */
  protected readonly labels = { one: 'Cart, # item', other: 'Cart, # items' };
}
