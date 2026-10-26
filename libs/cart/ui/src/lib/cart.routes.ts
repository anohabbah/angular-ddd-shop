import { inject } from '@angular/core';
import type { Routes } from '@angular/router';
import { provideTranslocoScope, TranslocoService, type ProviderScope } from '@jsverse/transloco';
import { pageTitle } from '@ngsample/shared/domain';
import { map } from 'rxjs';
import { CartPage } from './cart-page/cart-page';

const cartScope: ProviderScope = {
  scope: 'cart',
  loader: {
    'fr-FR': () => import('../i18n/fr-FR.json'),
    'en-US': () => import('../i18n/en-US.json'),
  },
};

export const cartRoutes: Routes = [
  {
    path: '',
    component: CartPage,
    providers: [provideTranslocoScope(cartScope)],
    title: () =>
      inject(TranslocoService).selectTranslate('title', {}, cartScope).pipe(map(pageTitle)),
  },
];
