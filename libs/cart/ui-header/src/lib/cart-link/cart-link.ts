import { Component, inject } from '@angular/core';
import { MatBadge } from '@angular/material/badge';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { provideTranslocoScope, TranslocoDirective } from '@jsverse/transloco';
import { CartStore } from '@ngsample/cart/application';
import { cartLinkLoader, cartLinkScope } from './cart-link-translations';

@Component({
  selector: 'app-cart-link',
  imports: [RouterLink, MatBadge, MatIconButton, MatIcon, TranslocoDirective],
  templateUrl: './cart-link.html',
  providers: [provideTranslocoScope({ scope: cartLinkScope, loader: cartLinkLoader })],
})
export class CartLink {
  protected readonly cart = inject(CartStore);
}
