import { inject } from '@angular/core';
import type { Routes } from '@angular/router';
import { provideTranslocoScope, TranslocoService, type ProviderScope } from '@jsverse/transloco';
import { CatalogStore } from '@ngsample/catalog/application';
import { pageTitle } from '@ngsample/shared/domain';
import { map } from 'rxjs';
import { ProductDetail } from './product-detail/product-detail';
import { ProductList } from './product-list/product-list';

const catalogScope: ProviderScope = {
  scope: 'catalog',
  loader: {
    'fr-FR': () => import('../i18n/fr-FR.json'),
    'en-US': () => import('../i18n/en-US.json'),
  },
};

export const catalogRoutes: Routes = [
  {
    path: '',
    providers: [CatalogStore, provideTranslocoScope(catalogScope)],
    children: [
      {
        path: '',
        component: ProductList,
        title: () =>
          inject(TranslocoService).selectTranslate('title', {}, catalogScope).pipe(map(pageTitle)),
      },
      {
        path: ':productId',
        component: ProductDetail,
        title: () =>
          inject(TranslocoService)
            .selectTranslate('product', {}, catalogScope)
            .pipe(map(pageTitle)),
      },
    ],
  },
];
