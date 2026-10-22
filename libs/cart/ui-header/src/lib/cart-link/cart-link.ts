import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartStore } from '@ngsample/cart/application';

@Component({
  selector: 'app-cart-link',
  imports: [RouterLink],
  templateUrl: './cart-link.html',
})
export class CartLink {
  protected readonly cart = inject(CartStore);
}
