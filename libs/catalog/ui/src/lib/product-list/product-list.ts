import { I18nPluralPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBar } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { CatalogStore } from '@ngsample/catalog/application';
import { PriceTag } from '../price-tag/price-tag';
import { ProductThumbnail } from '../product-thumbnail/product-thumbnail';

@Component({
  selector: 'app-product-list',
  imports: [
    I18nPluralPipe,
    RouterLink,
    MatButton,
    MatCard,
    MatCardContent,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBar,
    PriceTag,
    ProductThumbnail,
  ],
  templateUrl: './product-list.html',
})
export class ProductList {
  protected readonly store = inject(CatalogStore);

  /** Keyed by the locale's plural categories; `#` is the number of matching products. */
  protected readonly outcomeLabels = { one: '# product', other: '# products' };
}
