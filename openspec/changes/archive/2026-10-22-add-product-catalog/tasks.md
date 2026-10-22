# Tasks

## 1. Agree on test seams

- [x] 1.1 Propose these seams to the user and wait for explicit confirmation before writing any test; done when the user has confirmed (or amended) the list below
  - `Money` schema + `applyDiscount` (`@ngsample/shared-domain`, plain Vitest): catches rounding and invariant bugs; misses display formatting.
  - `Product` schema, `finalPrice`, `priceDisplay`, `normalizeSearchTerm`, `parseProductId` (`@ngsample/catalog-domain`, plain Vitest): catches pricing, trimming and URL-id rules; misses how the UI uses them.
  - `DummyJsonProductSource` via `ProductSource` (`HttpTestingController`): catches the endpoint choice, DTO mapping, invalid payload rejection, 404 mapping and cancellation; misses real-API drift.
  - `CatalogStore` and `productDetail()` with a fake `ProductSource` (TestBed + Vitest fake timers): catches debounce, de-duplication, list/no-match/error states and the not-found logic; misses rendering.
  - `PriceTag`, `ProductList`, `ProductDetail` through the DOM (TestBed, `RouterTestingHarness` for routes), with a fake `ProductSource`: catches visible text, links and states; misses real HTTP and visual styling.
  - `appRoutes` via `RouterTestingHarness`: catches the `/` -> `/catalog` redirect and the lazy catalog route; misses provider wiring against the live API (covered by 8.2).

## 2. Workspace prerequisites

- [x] 2.1 (exempt) Replace oxlint/oxfmt with ESLint + Prettier (design D8): `@nx/eslint` and `@nx/eslint-plugin` pinned to `23.3.0`, a root flat config with the Nx base/typescript/angular configs, `@nx/enforce-module-boundaries` (depConstraints from CLAUDE.md, domain `bannedExternalImports` for `@angular/*` and `rxjs*`) and a bare-`zod` `no-restricted-imports`, exposed as the inferred `lint` target, plus `.prettierrc`; verify `pnpm install` passes, `pnpm nx run-many -t lint` runs clean and `prettier --check .` passes
- [x] 2.2 (exempt) Create `GLOSSARY.md` with the terms from the proposal (Catalog, Product, Product id, Product source, Money, List price, Discount, Final price, Search term, Settled search term) using the `domain-modeling` skill; verify every term used in `specs/product-catalog/spec.md` is defined

## 3. Shared kernel: Money

- [x] 3.1 (exempt) Generate `libs/shared/domain` with `@nx/js:library` (Vitest), tags `scope:shared,type:domain`, alias `@ngsample/shared-domain`; verify `pnpm nx test shared-domain` runs
- [x] 3.2 Red - `Money` schema rejects a negative `amountMinor` (-1), a non-integer `amountMinor` (9.99) and a currency that isn't 3 letters, and accepts `{ amountMinor: 999, currency: 'USD' }` at `@ngsample/shared-domain`
- [x] 3.3 Green - minimal code to pass; verify `pnpm nx test shared-domain`
- [x] 3.4 Red - `applyDiscount({999, USD}, 10.48)` is `{894, USD}` and `applyDiscount({1999, USD}, 0)` is `{1999, USD}` at `@ngsample/catalog-domain` (values from the spec's Final price scenarios)
- [x] 3.5 Green - minimal code to pass; verify `pnpm nx test catalog-domain`

## 4. Catalog domain

- [x] 4.1 (exempt) Generate `libs/catalog/domain` with `@nx/js:library` (Vitest), tags `scope:catalog,type:domain`, alias `@ngsample/catalog-domain`; verify `pnpm nx test catalog-domain` runs
- [x] 4.2 Red - `Product` schema rejects a product with a negative list price and one with a discount of 120, and accepts a discount of 0 and of 100, at `@ngsample/catalog-domain`
- [x] 4.3 Green - minimal code to pass (`ProductId`, `Discount`, `Product` with `z.infer` types); verify `pnpm nx test catalog-domain`
- [x] 4.4 Red - `finalPrice` is 8.94 USD for list 9.99 USD / 10.48%, and 19.99 USD for list 19.99 USD / 0%, at `@ngsample/catalog-domain`
- [x] 4.5 Green - minimal code to pass; verify `pnpm nx test catalog-domain`
- [x] 4.6 Red - `priceDisplay` returns `{ final: 8.94, list: 9.99 }` for the discounted product and `{ final: 19.99 }` with no `list` for the undiscounted one, at `@ngsample/catalog-domain`
- [x] 4.7 Green - minimal code to pass; verify `pnpm nx test catalog-domain`
- [x] 4.8 Red - `normalizeSearchTerm('  phone  ')` is `'phone'` and `normalizeSearchTerm('   ')` is `''` at `@ngsample/catalog-domain`
- [x] 4.9 Green - minimal code to pass; verify `pnpm nx test catalog-domain`
- [x] 4.10 Red - boundary: `parseProductId` returns `1` for `'1'` and `undefined` for `'abc'`, `'0'`, `'-1'`, `'1.5'`, `' 1'` and `''` at `@ngsample/catalog-domain`
- [x] 4.11 Green - minimal code to pass; verify `pnpm nx test catalog-domain`

## 5. Catalog infrastructure

- [x] 5.1 (exempt) Generate `libs/catalog/infrastructure` with `@nx/angular:library` (vitest-analog, Analog >= 2.8.1; `vitest-angular` needs buildable libs), tags `scope:catalog,type:infrastructure`, alias `@ngsample/catalog-infrastructure`; verify `pnpm nx test catalog-infrastructure` runs
- [x] 5.2 Red - `ProductSource.search('')`, provided by `provideCatalogInfrastructure()`, sends `GET https://dummyjson.com/products` (limit 30) and resolves the products mapped to domain shape (`price: 9.99, discountPercentage: 10.48` -> `listPrice {999, USD}, discount 10.48`), via `HttpTestingController`
- [x] 5.3 Green - minimal code to pass (`ProductSource` abstract class in catalog-domain, `DummyJsonProductSource`, DTO schemas, `provideCatalogInfrastructure`); verify `pnpm nx test catalog-infrastructure`
- [x] 5.4 Red - `ProductSource.search('phone')` sends `GET https://dummyjson.com/products/search?q=phone` via `HttpTestingController`
- [x] 5.5 Green - minimal code to pass; verify `pnpm nx test catalog-infrastructure`
- [x] 5.6 Red - boundary: `search` rejects when the payload has a product with `price: -1`, and when a required field (`title`) is missing, at `ProductSource`
- [x] 5.7 Green - minimal code to pass; verify `pnpm nx test catalog-infrastructure`
- [x] 5.8 Red - `findById(1)` sends `GET https://dummyjson.com/products/1` and resolves the product; a 404 resolves `undefined`; a 500 rejects, at `ProductSource`
- [x] 5.9 Green - minimal code to pass; verify `pnpm nx test catalog-infrastructure`
- [x] 5.10 Red - aborting the `AbortSignal` passed to `search` or `findById` cancels the pending request (`HttpTestingController` `req.cancelled` is true), at `ProductSource`
- [x] 5.11 Green - minimal code to pass (`takeUntil(fromEvent(abortSignal, 'abort'))` per design D9); verify `pnpm nx test catalog-infrastructure`

## 6. Catalog application

- [x] 6.1 (exempt) Generate `libs/catalog/application` with `@nx/angular:library` (vitest-analog, Analog >= 2.8.1; `vitest-angular` needs buildable libs), tags `scope:catalog,type:application`, alias `@ngsample/catalog-application`; verify `pnpm nx test catalog-application` runs
- [x] 6.2 Red - with a fake `ProductSource`, a fresh `CatalogStore` requests `search('')` and exposes the returned products, at `CatalogStore`
- [x] 6.3 Green - minimal code to pass; verify `pnpm nx test catalog-application`
- [x] 6.4 Red - with fake timers, `setSearchTerm('p')`, `'ph'`, `'pho'` less than 300 ms apart makes the source receive only `'pho'`, and only 300 ms after the last call, at `CatalogStore`
- [x] 6.5 Green - minimal code to pass; verify `pnpm nx test catalog-application`
- [x] 6.6 Red - once `'phone'` has settled, `setSearchTerm('phone ')` and back to `'phone'` (or a pause on `'  phone  '`) triggers no new source call, at `CatalogStore`
- [x] 6.7 Green - minimal code to pass; verify `pnpm nx test catalog-application`
- [x] 6.8 Red - `hasNoMatches` is true when the source returns `[]` for `'zzzz'`, and the store exposes an error when the source rejects, at `CatalogStore`
- [x] 6.9 Green - minimal code to pass; verify `pnpm nx test catalog-application`
- [x] 6.10 Red - `productDetail(() => undefined)` has `notFound` true and never calls the source; `productDetail(() => 1)` exposes product 1; a source result of `undefined` gives `notFound` true, at `productDetail()`
- [x] 6.11 Green - minimal code to pass; verify `pnpm nx test catalog-application`

## 7. Catalog ui and app composition

- [x] 7.1 (exempt) Generate `libs/catalog/ui` with `@nx/angular:library` (vitest-analog, Analog >= 2.8.1; `vitest-angular` needs buildable libs), tags `scope:catalog,type:ui`, alias `@ngsample/catalog-ui`; verify `pnpm nx test catalog-ui` runs
- [x] 7.2 Red - `PriceTag` with product (9.99 USD, 10.48%) renders "$8.94" and a struck-through "$9.99"; with (19.99 USD, 0%) it renders only "$19.99", through the DOM
- [x] 7.3 Green - minimal code to pass; verify `pnpm nx test catalog-ui`
- [x] 7.4 Red - `ProductList` (with `CatalogStore` and a fake `ProductSource`) renders each product's title, thumbnail and price tag, and the product with id 1 links to `/catalog/1`, through the DOM
- [x] 7.5 Green - minimal code to pass; verify `pnpm nx test catalog-ui`
- [x] 7.6 Red - typing "phone" into the search box shows the products the fake source returns for `'phone'` after 300 ms, through the DOM with fake timers
- [x] 7.7 Green - minimal code to pass; verify `pnpm nx test catalog-ui`
- [x] 7.8 Red - `ProductList` shows a loading indicator while the source is pending, `No products match "zzzz"` for an empty result, and an error message when the source rejects, through the DOM
- [x] 7.9 Green - minimal code to pass; verify `pnpm nx test catalog-ui`
- [x] 7.10 Red - navigating `RouterTestingHarness` with `catalogRoutes` to `/1` shows "Essence Mascara Lash Princess", "$8.94" and a struck-through "$9.99", through the DOM
- [x] 7.11 Green - minimal code to pass (`ProductDetail`, `catalogRoutes` with `CatalogStore` provider, route input transform); verify `pnpm nx test catalog-ui`
- [x] 7.12 Red - boundary: navigating to `/abc` shows "Product not found" and the fake source is never called; `/99999` with the source returning `undefined` shows "Product not found", through `RouterTestingHarness`
- [x] 7.13 Green - minimal code to pass; verify `pnpm nx test catalog-ui`
- [x] 7.14 Red - in `src/app`, navigating `RouterTestingHarness` with `appRoutes` to `/` ends at `/catalog` and renders the product list (real adapter behind `HttpTestingController`, since `type:app` cannot import the `ProductSource` port from `type:domain`)
- [x] 7.15 Green - minimal code to pass (`appRoutes` redirect + `loadChildren`, `appConfig` with `withComponentInputBinding()`, `provideHttpClient(withFetch())`, `provideCatalogInfrastructure()`); verify `pnpm nx test`

## 8. Integration checks and review

- [x] 8.1 Verify boundary enforcement: temporarily add an import of `@ngsample/catalog-infrastructure` in catalog-ui, `@angular/core` in catalog-domain, and bare `zod` anywhere; confirm `pnpm nx run-many -t lint` fails on each, then revert and confirm it passes
- [x] 8.2 Smoke run against the live API: `pnpm nx serve`, confirm `/` -> `/catalog` lists products, searching "phone" narrows the list, `/catalog/1` shows "$8.94" / "$9.99", `/catalog/abc` shows "Product not found"
- [x] 8.3 Check changed production code against the apply checklist: no `effect()` writing signals, no subscribe-and-assign, no state derived in `ngOnInit`/`ngOnChanges`, only `zod/mini` imports, no relative cross-lib imports, all deps allowed by tags; verify by grep plus `lint`
- [x] 8.4 Review-stage refactor (separate from the slices): simplify names and duplication with all tests still green; record the CLAUDE.md follow-up from design D3 (when `httpResource` applies across a port) for the user to decide
- [x] 8.5 Run `pnpm nx build` and `pnpm nx test` (plus `pnpm nx run-many -t lint` and `prettier --check .`); verify all pass

## 9. Review follow-ups

- [x] 9.1 (exempt) Allow `type:app` to depend on `type:testing` in `eslint.config.mjs`, matching CLAUDE.md (spec files of any layer may import test doubles; the spec-only import ban still applies); verify `pnpm nx run-many -t lint`
- [x] 9.2 Red - `ProductDetail` shows a "Loading product" status while the source is pending (`FakeProductSource.hold` now holds `findById` too), through `RouterTestingHarness`
- [x] 9.3 Green - minimal code to pass; verify `pnpm nx test catalog-ui`
- [x] 9.4 Red - `ProductDetail` has a "Back to catalog" link to the catalog list, through `RouterTestingHarness`
- [x] 9.5 Green - minimal code to pass; verify `pnpm nx test catalog-ui`
- [x] 9.6 Red - `reload()` loads the products again after the source failed, at `CatalogStore`
- [x] 9.7 Green - minimal code to pass; verify `pnpm nx test catalog-application`
- [x] 9.8 Red - `ProductList` error state has a "Try again" button that reloads the products, through the DOM
- [x] 9.9 Green - minimal code to pass; verify `pnpm nx test catalog-ui`
- [x] 9.10 Wiring test - in `src/app`, a TestBed built from `appConfig.providers` (HTTP via `HttpTestingController`) searches "mascara", opens the product, follows "Back to catalog" and finds the search term and results kept with no new request. Passes on first run (pins existing wiring); confirmed it fails without `withComponentInputBinding()` and with `CatalogStore` provided on `ProductList` instead of the parent route
- [x] 9.11 Run `pnpm nx run-many -t lint test build` and `prettier --check .`; verify all pass

## Workflow follow-up

- Archive the change after review (`/opsx:archive`), then start `add-cart`.
