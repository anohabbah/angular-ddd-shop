# Design

## Context

See proposal.md for motivation and specs/localization/spec.md for behavior. Today:

- UI texts are literals in templates (`product-list.html`, `product-detail.html`, `cart-page.html`, `price-tag.html`, `app.html`), in route `title`s (`pageTitle('Catalog')`), in component code (`ProductDetail.#pageName`, `CartLink.labels`, `ProductList.outcomeLabels`) and in concatenated `aria-label` bindings.
- `formatMoney` (`libs/shared/domain`) hardcodes `en-US`. `src/index.html` hardcodes `lang="en"`.
- The app may depend only on `ui` and `infrastructure` libs, so it cannot call a domain function to resolve the Locale itself.
- The app is browser-only (no SSR), so `navigator.languages` is available when `app.config.ts` is evaluated.

## Goals / Non-Goals

**Goals:**

- One constant Locale per page load, available synchronously to DI, Transloco and `<html lang>` before the first render.
- Each bounded context owns its translations, next to its components.
- No flash of untranslated keys and no HTTP request for translations.

**Non-Goals:**

- Changing the Locale at runtime, or SSR-safe detection (`Accept-Language`).
- Translating product content or converting currency.
- Angular's built-in i18n (`@angular/localize`) or its locale data: no Angular pipe that needs locale data stays in use once `i18nPlural` goes.

## Decisions

### 1. Domain: `Locale` and `resolveLocale` in `libs/shared/domain`

```ts
export const Locale = z.enum(['fr-FR', 'en-US']);
export type Locale = z.infer<typeof Locale>;
export const defaultLocale: Locale = 'fr-FR';
export function resolveLocale(preferredLanguages: readonly string[]): Locale;
export function formatMoney(money: Money, locale: Locale): string; // gains `locale`
```

`resolveLocale` is a pure function mapping any strings to a supported Locale (the worked examples in the spec are its unit cases). It is the parsing step for the untrusted Preferred languages: any malformed entry is no match, never an error. Tag rules live in the domain, not in Transloco's `getBrowserLang()`, because ours walks the whole `navigator.languages` list and maps the language part to a region, which Transloco's helper does not.

Alternative: a domain port `PreferredLanguages` implemented by a browser adapter. Rejected: the value is read once, synchronously, before DI exists for Transloco's config; a port adds a class and a provider for a single `navigator.languages` read.

### 2. Infrastructure: new `libs/shared/infrastructure` with `provideLocalization()`

`@nx/angular:library`, tags `scope:shared`, `type:infrastructure`. Depends on `@ngsample/shared/domain` (`infrastructure → domain`, `scope:shared → scope:shared`: allowed). Exports one function:

```ts
export function provideLocalization(shellLoader: InlineLoader): EnvironmentProviders;
```

When called (as `app.config.ts` is evaluated), it reads `globalThis.navigator?.languages ?? []` (the boundary for this untrusted input), calls `resolveLocale`, and returns:

- `{ provide: LOCALE_ID, useValue: locale }`
- `provideTransloco({ config: { availableLangs: Locale.options, defaultLang: locale, fallbackLang: defaultLocale, reRenderOnLangChange: false, prodMode: !isDevMode() }, loader })`, where `loader` adapts the shell's inline loader to `TranslocoLoader`.
- `provideTranslocoMessageformat({ locales: Locale.options })` for ICU plurals.
- `provideAppInitializer` that sets `document.documentElement.lang = locale` and awaits loading the shell translations for `locale`, so the shell's first render is translated.

The app shell's translations live in `src/app/i18n/{fr-FR,en-US}.json` and are passed in from `app.config.ts`, since the shell belongs to the app. `src/index.html` gets `lang="fr-FR"`, the default, until the initializer runs.

`type:app → infrastructure` allows `app.config.ts` to call it.

### 3. Translations: one Transloco scope per context `ui` lib, inline loaders

| Lib                   | Scope           | Files                                             |
| --------------------- | --------------- | ------------------------------------------------- |
| `src/app` (shell)     | root (no scope) | `src/app/i18n/{fr-FR,en-US}.json`                 |
| `libs/catalog/ui`     | `catalog`       | `libs/catalog/ui/src/i18n/{fr-FR,en-US}.json`     |
| `libs/cart/ui`        | `cart`          | `libs/cart/ui/src/i18n/{fr-FR,en-US}.json`        |
| `libs/cart/ui-header` | `cartHeader`    | `libs/cart/ui-header/src/i18n/{fr-FR,en-US}.json` |

Each scope is provided with `provideTranslocoScope({ scope, loader })`, where `loader` maps each Locale to `() => import('./i18n/<locale>.json')`: in the route's `providers` for `catalogRoutes` and `cartRoutes`, and in `CartLink`'s component `providers`. Only the active Locale's file is fetched, as a lazy chunk; no HTTP loader, so the e2e fixtures need no new stub.

Templates use the `transloco` structural directive (`*transloco="let t; prefix: 'catalog'"`) or pipe. Parametrised texts use params (`"decrease": "Diminuer la quantité – {{title}}"` — with the messageformat transpiler, ICU `{title}`). Plurals are ICU: `"count": "Panier, {count, plural, one {# article} other {# articles}}"`.

Alternative: one global file per Locale in the app. Rejected: it couples the shell to every context's texts and breaks the "each context owns its ui" rule.

### 4. Page titles

`pageTitle(page)` (shared domain) stays: it appends the untranslated shop name. Route titles become resolver functions that translate the page name in the route's scope:

```ts
title: () => inject(TranslocoService).selectTranslate('title', {}, 'catalog').pipe(map(pageTitle));
```

The Router accepts an `Observable` from a title resolver, so nothing subscribes by hand. This is the one RxJS use the change adds; it is Transloco's API for async translation loading, handed straight to the Router.

`ProductDetail.#pageName` becomes a `computed` reading `translateSignal('notFoundTitle')` / `translateSignal('title')` for its two fixed names. Its existing `effect()` still syncs only to the external `Title` service.

Alternative: a custom `TitleStrategy` keyed by translation keys in route `data`. Rejected: two routes' titles do not justify a strategy, and `ProductDetail` sets its title itself anyway.

### 5. Money in `ui`

`PriceTag` and `CartPage` read `inject(LOCALE_ID) as Locale` and pass it to `formatMoney` inside their existing `computed`s. The cast is safe because `provideLocalization` is the only provider of `LOCALE_ID`, and it provides a `Locale`. Alternative: re-parse with `Locale.parse` in the component; rejected as re-parsing trusted data.

### 6. Product content language

The product source serves English. Each element that shows a product's title, description or category as its own text gets a static `lang="en"`: the list entry's `h2`, the detail's `h1`, category and description, and the Cart line's title link. It is static, not tied to the Locale: the content is English in both Locales, and `lang="en"` inside an `en-US` page is harmless. Accessible names that embed a title (`aria-label`) cannot mark part of their text and stay as they are; product titles are mostly proper names, which 3.1.2 exempts.

Alternative: a `lang` field on `Product` in the domain. Rejected: the source has one fixed language, so a constant in the markup says the same with no new state.

### 7. e2e

- `e2e/playwright.config.mts`: `use.locale: 'en-US'`, so every existing behavior spec keeps its English locators unchanged.
- `accessibility.spec.ts`: `test.use({ locale: 'fr-FR' })`, locators and expected texts switched to French.
- New `locale.spec.ts`: one `test.describe` per Preferred-languages example, using `test.use({ locale })` (Playwright sets `navigator.languages` from it). Asserts `<html lang>`, a translated heading, a formatted price and a plural.

### State and reactivity

No writable signal is added. The Locale is a DI constant. Derived values stay `computed` (`PriceTag.final`, `CartPage.rows`, `ProductDetail.#pageName`). The only `effect()` touched is `ProductDetail`'s, syncing to `Title`.

### Dependency check

| Edge                                                        | Rule                                                 |
| ----------------------------------------------------------- | ---------------------------------------------------- |
| app → `shared/infrastructure`                               | `type:app → infrastructure`                          |
| `shared/infrastructure` → `shared/domain`                   | `type:infrastructure → domain`, same scope           |
| `catalog/ui`, `cart/ui`, `cart/ui-header` → `shared/domain` | `type:ui → domain`, `scope:<context> → scope:shared` |
| any lib → `@jsverse/transloco*`                             | third-party, not tag-constrained                     |

`eslint.config.mjs` needs no new `scope:` constraint: `scope:shared` already exists.

### angular-developer references consulted

- `define-routes`: route `title` may be a resolver; route-level `providers` scope the Transloco scope to a context's routes.
- `defining-providers`, `di-fundamentals`: `provideLocalization()` as an `EnvironmentProviders` function, `LOCALE_ID` by `useValue`.
- `environment-configuration`: `provideAppInitializer` for setting `<html lang>` and preloading the shell translations.
- `pipes`: inject `LOCALE_ID` and pass it to a pure formatting function, rather than a stateful pipe.
- `signals-overview`, `effects`: titles and prices stay `computed`; the one `effect` syncs to `Title` only.

## Risks / Trade-offs

- [Transloco 8.4 is untested with Angular 22.2; peer range is open-ended `>=16`] → The library-install task runs `pnpm nx build` and `pnpm nx test` before any slice depends on it.
- [`@jsverse/transloco-messageformat` changes interpolation from `{{x}}` to ICU `{x}`] → All translation files use ICU syntax from the start; no file mixes both.
- [JSON imports need `resolveJsonModule` in the libs' tsconfigs] → Checked and set in the install task.
- [French strings are longer and may break the 320 px reflow or the narrow toolbar] → The accessibility matrix runs in French; a reflow failure is a red slice.
- [English gets no axe pass] → English text is shorter than French on the same markup; behavior specs still cover English.
- [`navigator.languages` read at module evaluation is not SSR-safe] → The app has no SSR; noted as a non-goal.
- [`@messageformat/core` grows the initial bundle by about 91 kB (19 kB gzip), past the 500 kB warning budget it already exceeded, is CommonJS (an optimization-bailout warning), and compiles messages at runtime with `new Function`] → Accepted for now: the app has no Content-Security-Policy. One forbidding `'unsafe-eval'` would break every translated text, so precompile the messages (`@messageformat/core/compile-module`) before adding one.
- [VoiceOver reads French UI with English product titles] → Accepted per spec ("Product content untranslated"); the French VoiceOver pass records how it sounds.
