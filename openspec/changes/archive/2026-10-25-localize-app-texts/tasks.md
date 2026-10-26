# Tasks

## 1. Seams

- [x] 1.1 Propose the test seams and wait for user confirmation before any test. Verify: user confirms the seams.
  - `resolveLocale(preferredLanguages)` in `libs/shared/domain` (plain Vitest). Catches: wrong matching, order or fallback for every spec example. Misses: whether the app actually reads `navigator.languages`.
  - `formatMoney(money, locale)` in `libs/shared/domain` (plain Vitest). Catches: separator, symbol placement per Locale. Misses: whether components pass the right Locale.
  - e2e `e2e/src/locale.spec.ts` with `test.use({ locale })`. Catches: detection wiring end to end, `<html lang>`, translated texts, ICU plurals, formatted prices per Locale. Misses: translations of screens it does not visit (covered by the French accessibility matrix and the English behavior specs).
  - Existing English behavior specs, pinned to `en-US`, and the accessibility matrix in `fr-FR` act as regression nets; no new seam for `provideLocalization()` (wiring only, covered by e2e).

## 2. Glossary (exempt)

- [x] 2.1 (exempt) Add **Locale** and **Preferred languages** to the Shared kernel section of `GLOSSARY.md` with the `domain-modeling` skill; verify the terms match the spec's wording

## 3. Locale resolution (localization "Locale from the Preferred languages")

- [x] 3.1 Red - `resolveLocale(["en-US"])` is `en-US` and `resolveLocale(["fr-FR"])` is `fr-FR`, at the `resolveLocale` seam; verify it fails (function missing)
- [x] 3.2 Green - minimal `Locale` zod/mini enum and `resolveLocale` in `libs/shared/domain`, exported from its `index.ts`; verify the test passes
- [x] 3.3 Red - `["en-GB"]` gives `en-US` and `["fr-CA", "en-US"]` gives `fr-FR` (language part, first entry wins); verify it fails
- [x] 3.4 Green - minimal code to pass; verify all `resolveLocale` tests pass
- [x] 3.5 Red - `["de-DE", "en-GB"]` gives `en-US` (unsupported entries are skipped); verify it fails
- [x] 3.6 Green - minimal code to pass; verify all `resolveLocale` tests pass
- [x] 3.7 Red - `["de-DE", "es-ES"]` and `[]` give `fr-FR` (fallback); verify it fails
- [x] 3.8 Green - minimal code to pass; verify all `resolveLocale` tests pass
- [x] 3.9 Red - `["EN"]` gives `en-US` and `["", "x", "en-US"]` gives `en-US` (case, bare and malformed tags: invalid input never throws); verify it fails or, if already green, prove it can fail by breaking the case-insensitivity temporarily
- [x] 3.10 Green - minimal code to pass; verify all `resolveLocale` tests pass

## 4. Money for the Locale (localization "Money formatted for the Locale")

- [x] 4.1 Red - `formatMoney({ amountMinor: 894, currency: 'USD' }, 'fr-FR')` is `"8,94 $US"` (with the no-break space `Intl` emits) and `'en-US'` gives `"$8.94"`, in the existing `formatMoney` spec; verify it fails
- [x] 4.2 Green - add the `locale` parameter; pass `inject(LOCALE_ID) as Locale` from `PriceTag` and `CartPage` (the only callers), until `LOCALE_ID` is provided in group 6, pass `'en-US'`; verify `pnpm nx test` passes and the English e2e price specs stay green

## 5. Setup (exempt)

- [x] 5.1 (exempt) `pnpm add @jsverse/transloco @jsverse/transloco-messageformat @jsverse/utils@1.0.0-beta.5`; verify `pnpm nx build` and `pnpm nx test` still pass on Angular 22.2
- [x] 5.2 (exempt) Generate `libs/shared/infrastructure` with the `nx-generate` skill (`@nx/angular:library`, tags `scope:shared,type:infrastructure`, path alias `@ngsample/shared/infrastructure`); verify `pnpm nx lint` passes
- [x] 5.3 (exempt) Enable `resolveJsonModule` where `ui` libs and `src/app` will import `i18n/*.json`; verify `pnpm nx build` passes
- [x] 5.4 (exempt) Pin `use.locale: 'en-US'` in `e2e/playwright.config.mts`; verify `pnpm nx e2e e2e` still passes

## 6. Detection wiring and the shell (localization "Document language", "Texts follow the Locale", "Supported Locales")

- [x] 6.1 Red - with Preferred languages `["fr-FR"]`, `/catalog` has document language `fr-FR` and the "Main" navigation landmark is named "Principale" with links "Catalogue" and "Panier", at the `locale.spec.ts` seam; verify it fails
- [x] 6.2 Green - `provideLocalization(shellLoader)` in `libs/shared/infrastructure` (reads `navigator.languages`, `LOCALE_ID`, `provideTransloco`, `provideTranslocoMessageformat`, `provideAppInitializer` setting `<html lang>` and preloading the shell translations); register it in `app.config.ts`; `src/app/i18n/{fr-FR,en-US}.json`; translate `app.html` (nav labels, landmark, "Open navigation"); `src/index.html` `lang="fr-FR"`; switch `PriceTag`/`CartPage` to `inject(LOCALE_ID) as Locale`; verify the test and the English e2e suite pass
- [x] 6.3 Red - with `["en-GB"]`, document language is `en-US` and the links read "Catalog" and "Cart"; with `["de-DE"]`, document language is `fr-FR`; verify it fails or prove it can fail by temporarily hardcoding `fr-FR`
- [x] 6.4 Green - minimal fix if needed; verify the tests pass

## 7. Cart link (localization "Plurals follow the Locale's rules")

- [x] 7.1 Red - in `fr-FR`, the cart link is named "Panier, 0 article" with an empty Cart and "Panier, 1 article" after adding one product, at the `locale.spec.ts` seam; verify it fails
- [x] 7.2 Green - `cartHeader` scope with inline loaders in `CartLink`'s providers, ICU message replacing `labels` and `I18nPluralPipe`; verify the test and `cart-link.spec.ts` (English) pass

## 8. Catalog texts (localization "Texts follow the Locale", "Money formatted for the Locale")

- [x] 8.1 Red - in `fr-FR`, `/catalog` has the level-one heading "Catalogue", the search field "Rechercher des produits", the document title "Catalogue | ngsample", a product priced "Prix final 8,94 $US" / "Prix initial 9,99 $US", and the status "1 produit" or "2 produits", at the `locale.spec.ts` seam; verify it fails
- [x] 8.2 Green - `catalog` scope in `catalogRoutes` providers, `libs/catalog/ui/src/i18n/{fr-FR,en-US}.json`, translate `product-list.html` and `price-tag.html`, ICU message replacing `outcomeLabels`, route title resolver; verify the test and the English catalog specs pass
- [x] 8.3 Red - in `fr-FR`, searching "zzzz" shows "Aucun produit ne correspond à « zzzz »", and a failing product source shows "Les produits n'ont pas pu être chargés." with a "Réessayer" button; verify it fails
- [x] 8.4 Green - translate those states; verify the tests pass
- [x] 8.5 Red - in `fr-FR`, `/catalog/1` shows "Retour au catalogue", "Ajouter au panier", the heading "Essence Mascara Lash Princess" (untranslated), and after adding, "Quantité dans le panier : 1" and "Voir le panier"; verify it fails
- [x] 8.6 Green - translate `product-detail.html`; verify the tests pass
- [x] 8.7 Red - in `fr-FR`, `/catalog/abc` has heading and title "Produit introuvable" ("Produit introuvable | ngsample"), and a failing source shows "Produit" and "Le produit n'a pas pu être chargé. Veuillez réessayer plus tard."; verify it fails
- [x] 8.8 Green - `ProductDetail.#pageName` via `translateSignal`, route title resolver; verify the tests and English `page-title.spec.ts` pass

## 9. Cart page texts (localization "Texts follow the Locale")

- [x] 9.1 Red - in `fr-FR`, an empty `/cart` shows the heading "Panier", "Votre panier est vide", title "Panier | ngsample"; verify it fails
- [x] 9.2 Green - `cart` scope in `cartRoutes` providers, `libs/cart/ui/src/i18n/{fr-FR,en-US}.json`, translate the heading and empty state, route title resolver; verify the tests and English cart specs pass
- [x] 9.3 Red - in `fr-FR`, with one line of "Essence Mascara Lash Princess" at quantity 3, the buttons are named "Diminuer la quantité – …", "Augmenter la quantité – …", "Retirer …", the quantity is "Quantité – …" (no article, so no elision depends on the title), and the total reads "Total du panier : 26,82 $US"; verify it fails
- [x] 9.4 Green - translate the line controls and total with params; verify the tests and English `cart-page.spec.ts` pass

## 10. Accessibility in French (accessibility "Conformance target")

- [x] 10.1 Red - `accessibility.spec.ts` runs with `test.use({ locale: 'fr-FR' })` and French locators, and asserts each cell's document language is `fr-FR`; verify the lang assertion fails when `<html lang>` is temporarily hardcoded to `en`
- [x] 10.2 Green - restore; fix any axe violation (e.g. 320 px reflow from longer French text) as its own red → green slice; verify the full matrix passes with no rule disabled
- [x] 10.3 Run the VoiceOver check (CLAUDE.md) in French over the steps of `docs/accessibility/voiceover-script.md` that announce translated text (cart link, quantity, Cart total, search outcome, add-to-cart confirmation); a regression is fixed as its own slice. Verify: results, date and versions recorded in the script
- [x] 10.4 (exempt) Update `docs/accessibility/conformance.md`: date, language of the tested pages, and the affected verdicts (3.1.1 Language of Page); verify every step not run stays "Not verified"

## 11. Review

- [x] 11.1 Review all changed production code: no `effect()` writing signals, no subscribe-and-assign, `zod/mini` imports only, no relative cross-lib imports, every translation key present in both Locales, no leftover English literal in templates (grep the `ui` libs and `app.html`); refactor if needed and verify tests still pass

## 12. Verification

- [x] 12.1 Run `pnpm nx lint`, `pnpm nx build`, `pnpm nx test` and `pnpm nx e2e e2e`; verify all pass

## 13. Product content language (localization "Product content language", WCAG 3.1.2)

- [x] 13.1 Red - in `fr-FR`, the product list entry's title, the product detail's title, category and description, and the Cart line's title have the language `en` (closest `[lang]`), at the `locale.spec.ts` seam; verify it fails
- [x] 13.2 Green - static `lang="en"` on those elements in `product-list.html`, `product-detail.html` and `cart-page.html`; verify the test and the English e2e specs pass
- [x] 13.3 Rerun `accessibility.spec.ts` (French matrix); verify every cell passes with no rule disabled
- [x] 13.4 Run the VoiceOver check (CLAUDE.md) in French on the steps whose elements changed (2.2, 3.2, 4.2), listening for the title, description and category read with an English voice; record results, date and versions in the script
- [x] 13.5 (exempt) Update `docs/accessibility/conformance.md`: 3.1.2 Language of Parts verdict and note, date, Status; verify a step not run stays "Not verified"
- [x] 13.6 Run `pnpm nx lint`, `pnpm nx build`, `pnpm nx test` and `pnpm nx e2e e2e`; verify all pass

## Workflow follow-up

- Archive the change after review, which merges the `localization` spec and the `accessibility` delta into `openspec/specs/`.
