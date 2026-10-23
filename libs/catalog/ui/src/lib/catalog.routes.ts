import type { Routes } from '@angular/router';
import { CatalogStore } from '@ngsample/catalog/application';
import { pageTitle } from '@ngsample/shared/domain';
import { ProductDetail } from './product-detail/product-detail';
import { ProductList } from './product-list/product-list';

export const catalogRoutes: Routes = [
  {
    path: '',
    providers: [CatalogStore],
    children: [
      { path: '', component: ProductList, title: pageTitle('Catalog') },
      { path: ':productId', component: ProductDetail, title: pageTitle('Product') },
    ],
  },
];
