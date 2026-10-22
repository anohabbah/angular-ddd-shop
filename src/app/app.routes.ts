import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: 'catalog' },
  {
    path: 'catalog',
    loadChildren: () => import('@ngsample/catalog-ui').then((m) => m.catalogRoutes),
  },
  {
    path: 'cart',
    loadChildren: () => import('@ngsample/cart-ui').then((m) => m.cartRoutes),
  },
];
