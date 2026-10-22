import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { productDetail } from '@ngsample/catalog-application';
import { parseProductId, type ProductId } from '@ngsample/catalog-domain';
import { PriceTag } from '../price-tag/price-tag';
import { ProductThumbnail } from '../product-thumbnail/product-thumbnail';

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, PriceTag, ProductThumbnail],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetail {
  /** Bound from the `:productId` route parameter and parsed at this boundary. */
  readonly productId = input<ProductId | undefined, string>(undefined, {
    transform: parseProductId,
  });

  protected readonly detail = productDetail(this.productId);
}
