import {
  type EnvironmentProviders,
  inject,
  isDevMode,
  LOCALE_ID,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import {
  type InlineLoader,
  provideTransloco,
  type Translation,
  TRANSLOCO_LOADER,
  type TranslocoLoader,
  TranslocoService,
} from '@jsverse/transloco';
import { provideTranslocoMessageformat } from '@jsverse/transloco-messageformat';
import { defaultLocale, Locale, resolveLocale } from '@ngsample/shared/domain';
import { firstValueFrom } from 'rxjs';

/**
 * Shows the shop in the Locale resolved from the Shopper's Preferred languages, with the shell's
 * translations loaded by `shellLoader` before the first render.
 */
export function provideLocalization(shellLoader: InlineLoader): EnvironmentProviders {
  const locale = resolveLocale(globalThis.navigator?.languages ?? []);
  const loader: TranslocoLoader = {
    getTranslation: (lang) =>
      shellLoader[lang]().then((res: Translation) => (res['default'] ?? res) as Translation),
  };

  return makeEnvironmentProviders([
    { provide: LOCALE_ID, useValue: locale },
    provideTransloco({
      config: {
        availableLangs: [...Locale.options],
        defaultLang: locale,
        fallbackLang: defaultLocale,
        reRenderOnLangChange: false,
        prodMode: !isDevMode(),
      },
    }),
    { provide: TRANSLOCO_LOADER, useValue: loader },
    // The transpiler only hears of later language changes, so it starts in the Locale.
    provideTranslocoMessageformat({ locales: locale }),
    provideAppInitializer(() => {
      document.documentElement.lang = locale;
      return firstValueFrom(inject(TranslocoService).load(locale));
    }),
  ]);
}
