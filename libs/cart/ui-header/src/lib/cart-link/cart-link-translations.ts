import { type EnvironmentProviders, inject, provideAppInitializer } from '@angular/core';
import { type InlineLoader, TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';

export const cartLinkScope = 'cartHeader';

export const cartLinkLoader: InlineLoader = {
  'fr-FR': () => import('../../i18n/fr-FR.json'),
  'en-US': () => import('../../i18n/en-US.json'),
};

/** Loads the Cart link's texts before the first render, so the toolbar shows with it. */
export function provideCartLinkTranslations(): EnvironmentProviders {
  return provideAppInitializer(() => {
    const transloco = inject(TranslocoService);
    const lang = transloco.getActiveLang();
    // An inline loader passed to `load` is keyed by the full path, scope included.
    const path = `${cartLinkScope}/${lang}`;
    return firstValueFrom(transloco.load(path, { inlineLoader: { [path]: cartLinkLoader[lang] } }));
  });
}
