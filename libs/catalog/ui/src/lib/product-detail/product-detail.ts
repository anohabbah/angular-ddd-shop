import { Component, computed, effect, inject, input } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBar } from '@angular/material/progress-bar';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { CartStore } from '@ngsample/cart/application';
import { lineQuantity } from '@ngsample/cart/domain';
import { productDetail } from '@ngsample/catalog/application';
import { parseProductId, type Product, toCartItem } from '@ngsample/catalog/domain';
import { pageTitle, type ProductId } from '@ngsample/shared/domain';
import { PriceTag } from '../price-tag/price-tag';
import { ProductThumbnail } from '../product-thumbnail/product-thumbnail';

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, MatButton, MatIcon, MatProgressBar, PriceTag, ProductThumbnail],
  templateUrl: './product-detail.html',
})
export class ProductDetail {
  readonly #cart = inject(CartStore);

  /** Bound from the `:productId` route parameter and parsed at this boundary. */
  readonly productId = input<ProductId | undefined, string>(undefined, {
    transform: parseProductId,
  });

  protected readonly detail = productDetail(this.productId);

  protected readonly quantityInCart = computed(() =>
    this.detail.product.hasValue()
      ? lineQuantity(this.#cart.lines(), this.detail.product.value().id)
      : undefined,
  );

  readonly #pageName = computed(() => {
    if (this.detail.notFound()) return 'Product not found';
    return this.detail.product.hasValue() ? this.detail.product.value().title : 'Product';
  });

  constructor() {
    const title = inject(Title);
    effect(() => title.setTitle(pageTitle(this.#pageName())));
  }

  protected addToCart(product: Product): void {
    this.#cart.add(toCartItem(product));
  }
}
