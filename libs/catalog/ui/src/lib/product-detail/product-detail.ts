import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartStore } from '@ngsample/cart-application';
import { productDetail } from '@ngsample/catalog-application';
import { parseProductId, type Product, toCartItem } from '@ngsample/catalog-domain';
import type { ProductId } from '@ngsample/shared-domain';
import { PriceTag } from '../price-tag/price-tag';
import { ProductThumbnail } from '../product-thumbnail/product-thumbnail';

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, PriceTag, ProductThumbnail],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetail {
  readonly #cart = inject(CartStore);

  /** Bound from the `:productId` route parameter and parsed at this boundary. */
  readonly productId = input<ProductId | undefined, string>(undefined, {
    transform: parseProductId,
  });

  protected readonly detail = productDetail(this.productId);

  protected addToCart(product: Product): void {
    this.#cart.add(toCartItem(product));
  }
}
