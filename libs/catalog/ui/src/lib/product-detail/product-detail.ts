import { Component, inject, input } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { CartStore } from '@ngsample/cart/application';
import { productDetail } from '@ngsample/catalog/application';
import { parseProductId, type Product, toCartItem } from '@ngsample/catalog/domain';
import type { ProductId } from '@ngsample/shared/domain';
import { PriceTag } from '../price-tag/price-tag';
import { ProductThumbnail } from '../product-thumbnail/product-thumbnail';

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, MatButton, MatIcon, MatProgressBar, PriceTag, ProductThumbnail],
  templateUrl: './product-detail.html',
})
export class ProductDetail {
  readonly #cart = inject(CartStore);
  readonly #snackBar = inject(MatSnackBar);
  readonly #router = inject(Router);

  /** Bound from the `:productId` route parameter and parsed at this boundary. */
  readonly productId = input<ProductId | undefined, string>(undefined, {
    transform: parseProductId,
  });

  protected readonly detail = productDetail(this.productId);

  protected addToCart(product: Product): void {
    this.#cart.add(toCartItem(product));
    this.#snackBar
      .open('Added to cart', 'View cart', { duration: 4000 })
      .onAction()
      .subscribe(() => this.#router.navigateByUrl('/cart'));
  }
}
