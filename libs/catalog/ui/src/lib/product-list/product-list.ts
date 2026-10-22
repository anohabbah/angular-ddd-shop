import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogStore } from '@ngsample/catalog/application';
import { PriceTag } from '../price-tag/price-tag';
import { ProductThumbnail } from '../product-thumbnail/product-thumbnail';

@Component({
  selector: 'app-product-list',
  imports: [RouterLink, PriceTag, ProductThumbnail],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList {
  protected readonly store = inject(CatalogStore);
}
