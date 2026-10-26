import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { MAT_RIPPLE_GLOBAL_OPTIONS } from '@angular/material/core';
import { MAT_ICON_DEFAULT_OPTIONS } from '@angular/material/icon';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideCartLinkTranslations } from '@ngsample/cart/ui/header';
import { provideCatalogInfrastructure } from '@ngsample/catalog/infrastructure';
import { provideLocalization } from '@ngsample/shared/infrastructure';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes, withComponentInputBinding()),
    provideCatalogInfrastructure(),
    provideLocalization({
      'fr-FR': () => import('./i18n/fr-FR.json'),
      'en-US': () => import('./i18n/en-US.json'),
    }),
    provideCartLinkTranslations(),
    { provide: MAT_RIPPLE_GLOBAL_OPTIONS, useValue: { disabled: true } },
    { provide: MAT_ICON_DEFAULT_OPTIONS, useValue: { fontSet: 'material-symbols-outlined' } },
  ],
};
