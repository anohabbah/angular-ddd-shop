# Proposal

## Why

The shop is English-only: texts are hardcoded in templates and route configs, `<html lang="en">` is fixed, and prices are always formatted `en-US`. The shop's audience is primarily French, so French must be the default, while Shoppers whose browser prefers English get English.

## What Changes

- The shop shows its texts in one of two Locales, French (France) `fr-FR` or US English `en-US`, translated with Transloco (`@jsverse/transloco`).
- The Locale is resolved once, at startup, from the browser's Preferred languages: the first entry whose language part (`fr`, `en`) is supported wins; when none is supported, `fr-FR`. There is no language switcher and nothing is persisted.
- Every UI text follows the Locale: headings, labels, buttons, status and error messages, accessible names, and page titles. Plurals are ICU messages (`@jsverse/transloco-messageformat`), replacing the two `i18nPlural` maps.
- Prices are formatted for the Locale (`8,94 $US` in `fr-FR`, `$8.94` in `en-US`). The currency itself is unchanged.
- The document language (`<html lang>`) is the Locale.
- Product content from the product source (title, description, category) is not translated. It is in English, so it is marked `lang="en"` on every page, keeping French pages conformant to WCAG 3.1.2 Language of Parts.
- The accessibility conformance matrix runs in `fr-FR`, the default Locale; behavior e2e specs pin `en-US`.

## Capabilities

### New Capabilities

- `localization`: how the shop's Locale is chosen, which texts follow it, how prices and plurals are formatted for it, and what stays untranslated.

### Modified Capabilities

- `accessibility`: the conformance target is checked in the default Locale, `fr-FR`.

## Bounded contexts, libs and terms

- **Contexts touched:** shared kernel (Locale, Locale resolution, Money formatting), catalog and cart (`ui` texts), and the app shell.
- **New Nx lib:** `libs/shared/infrastructure` (`@nx/angular:library`, tags `scope:shared`, `type:infrastructure`), holding `provideLocalization()`.
- **New GLOSSARY.md terms:** **Locale**, **Preferred languages**.

## Source state

None. The Locale is a constant resolved before bootstrap and provided through DI; no writable signal is introduced.

## Impact

- **Dependencies:** `@jsverse/transloco`, `@jsverse/transloco-messageformat` and its peer `@jsverse/utils` (all declare `@angular/core >=16`).
- **Code:** `libs/shared/domain` (`Locale`, `resolveLocale`, `formatMoney` gains a `Locale` parameter), new `libs/shared/infrastructure`, `src/app/app.config.ts`, `src/index.html`, the shell, and every template and route in `libs/catalog/ui`, `libs/cart/ui`, `libs/cart/ui-header`.
- **Tests:** `formatMoney` spec updated; new `resolveLocale` spec; Playwright behavior specs pin `en-US`; `accessibility.spec.ts` runs in `fr-FR` with French locators; new `locale.spec.ts`.
- **Docs:** `GLOSSARY.md`, VoiceOver script (a French pass), `docs/accessibility/conformance.md`.
