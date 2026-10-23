import type { Routes } from '@angular/router';
import { pageTitle } from '@ngsample/shared/domain';
import { CartPage } from './cart-page/cart-page';

export const cartRoutes: Routes = [{ path: '', component: CartPage, title: pageTitle('Cart') }];
