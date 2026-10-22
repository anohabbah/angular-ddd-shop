import type { Routes } from '@angular/router';
import { CatalogStore } from '@ngsample/catalog-application';
import { ProductDetail } from './product-detail/product-detail';
import { ProductList } from './product-list/product-list';

export const catalogRoutes: Routes = [
  {
    path: '',
    providers: [CatalogStore],
    children: [
      { path: '', component: ProductList },
      { path: ':productId', component: ProductDetail },
    ],
  },
];
