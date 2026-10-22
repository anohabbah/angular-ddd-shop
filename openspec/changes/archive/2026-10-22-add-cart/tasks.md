# Tasks

## 1. Agree on test seams

- [x] 1.1 Propose these seams to the user and wait for explicit confirmation before writing any test; done when the user has confirmed (or amended) the list below
  - `ProductId`, `formatMoney` (`@ngsample/shared-domain`, plain Vitest): catch the moved id invariant and money rendering; miss where callers use them.
  - `addItem`, `increaseQuantity`, `decreaseQuantity`, `removeLine`, `lineTotal`, `cartTotal`, `itemCount` (`@ngsample/cart-domain`, plain Vitest): catch every cart rule (snapshot kept on re-add, quantity >= 1, order, totals, single currency); miss how the store and UI wire them.
  - `toCartItem` (`@ngsample/catalog-domain`, plain Vitest): catches the Product-to-Cart-item translation and the unit price = final price rule; misses the button wiring.
  - `CartStore` (TestBed): catches that commands update `lines` and that `total`/`itemCount` follow, and that the store is a root singleton; misses rendering.
  - `CartPage`, `CartLink` through the DOM (TestBed, `RouterTestingHarness` for `cartRoutes`): catch visible text, links, disabled "-", remove, empty state; miss catalog integration.
  - `ProductDetail` "Add to cart" through `RouterTestingHarness` with `FakeProductSource`, asserting on the root `CartStore`: catches the click-to-cart wiring; misses the header.
  - `src/app` wiring (TestBed from `appConfig.providers`, HTTP via `HttpTestingController`): catches the header link, the `/cart` lazy route and the Cart surviving navigation; misses real-API drift (covered by the smoke run).

## 2. Boundaries and docs (exempt)

- [x] 2.1 (exempt) In `eslint.config.mjs`, add the `scope:cart -> scope:cart, scope:shared` constraint and add `scope:cart` to `scope:catalog`'s allowed list (design D1); verify `pnpm nx run-many -t lint` passes
- [x] 2.2 (exempt) Write the ADR "Catalog may depend on Cart" with the `domain-modeling` skill (design D7); verify it names the intended edges (catalog-domain -> cart-domain, catalog-ui -> cart-application) and the rejected alternatives
- [x] 2.3 (exempt) Update CLAUDE.md "Allowed dependencies" with the recorded `scope:catalog -> scope:cart` exception and a link to the ADR; verify it matches the lint config from 2.1
- [x] 2.4 (exempt) Update `GLOSSARY.md` with the `domain-modeling` skill: add a Cart section (Cart, Cart item, Cart line, Quantity, Unit price, Line total, Cart total, Item count) and move `Product id` to Shared kernel; verify every term used in `specs/shopping-cart/spec.md` is defined

## 3. Shared kernel

- [x] 3.1 Red - `ProductId` at `@ngsample/shared-domain` accepts `1` and rejects `0`, `-1` and `1.5`
- [x] 3.2 Green - minimal code to pass: move `ProductId` from catalog-domain to shared-domain and switch every catalog import to `@ngsample/shared-domain` (design D5); verify `pnpm nx run-many -t test lint -p shared-domain catalog-domain catalog-application catalog-infrastructure catalog-ui catalog-testing`
- [x] 3.3 Red - `formatMoney({ amountMinor: 894, currency: 'USD' })` is `"$8.94"` and `formatMoney({ amountMinor: 2682, currency: 'USD' })` is `"$26.82"` at `@ngsample/shared-domain` (values from the spec)
- [x] 3.4 Green - minimal code to pass: move `formatMoney` out of `PriceTag` into shared-domain and have `PriceTag` import it; verify `pnpm nx test shared-domain` and `pnpm nx test catalog-ui` (the `PriceTag` tests stay green)

## 4. Cart domain

- [x] 4.1 (exempt) Generate `libs/cart/domain` with `@nx/js:library` (Vitest, `--linter=none`), tags `scope:cart,type:domain`, alias `@ngsample/cart-domain`; verify `pnpm nx test cart-domain` runs
- [x] 4.2 Red - `addItem([], item1)` with unit price 8.94 USD gives one line `{ item: item1, quantity: 1 }`; then `addItem(lines, item2)` gives two lines in order item1, item2, at `@ngsample/cart-domain`
- [x] 4.3 Green - minimal code to pass (`Quantity`, `CartItem`, `CartLine` schemas with `z.infer` types, `addItem`); verify `pnpm nx test cart-domain`
- [x] 4.4 Red - adding product 1 again gives quantity 2; adding product 1 again with a unit price of 7.99 USD keeps the line's unit price at 8.94 USD with quantity 2, at `@ngsample/cart-domain`
- [x] 4.5 Green - minimal code to pass; verify `pnpm nx test cart-domain`
- [x] 4.6 Red - adding a EUR item to a Cart with a USD line throws `CurrencyMismatchError` and the input lines are unchanged, at `@ngsample/cart-domain`
- [x] 4.7 Green - minimal code to pass; verify `pnpm nx test cart-domain`
- [x] 4.8 Red - `increaseQuantity` takes 2 to 3; `decreaseQuantity` takes 2 to 1 and leaves 1 at 1 with the line kept, at `@ngsample/cart-domain`
- [x] 4.9 Green - minimal code to pass; verify `pnpm nx test cart-domain`
- [x] 4.10 Red - `removeLine` on lines [product 1 x3, product 2 x1] for product 1 leaves [product 2 x1], at `@ngsample/cart-domain`
- [x] 4.11 Green - minimal code to pass; verify `pnpm nx test cart-domain`
- [x] 4.12 Red - `lineTotal` of 8.94 USD x3 is 26.82 USD; `cartTotal` of line totals 26.82 USD and 19.99 USD is 46.81 USD; `cartTotal([])` is `undefined`, at `@ngsample/cart-domain`
- [x] 4.13 Green - minimal code to pass; verify `pnpm nx test cart-domain`
- [x] 4.14 Red - `itemCount` of quantities 3 and 1 is 4, and of `[]` is 0, at `@ngsample/cart-domain`
- [x] 4.15 Green - minimal code to pass; verify `pnpm nx test cart-domain`

## 5. Catalog-to-cart translation

- [x] 5.1 Red - `toCartItem` of product 1 (list 9.99 USD, discount 10.48%) is `{ productId: 1, title, thumbnail, unitPrice: { amountMinor: 894, currency: 'USD' } }` at `@ngsample/catalog-domain`
- [x] 5.2 Green - minimal code to pass (catalog-domain imports `CartItem` from `@ngsample/cart-domain`, design D3); verify `pnpm nx test catalog-domain` and `pnpm nx lint catalog-domain` (the new scope edge is allowed)

## 6. Cart application

- [x] 6.1 (exempt) Generate `libs/cart/application` with `@nx/angular:library` (vitest-analog, as for the catalog libs, `--linter=none`), tags `scope:cart,type:application`, alias `@ngsample/cart-application`; verify `pnpm nx test cart-application` runs
- [x] 6.2 Red - a `CartStore` from `TestBed.inject` starts with no lines, `total` `undefined` and `itemCount` 0; after `add(item1)` twice and `add(item2)` it has 2 lines, `itemCount` 3 and `total` = 2 x 8.94 + 19.99 = 37.87 USD, at `CartStore`
- [x] 6.3 Green - minimal code to pass (`providedIn: 'root'`, `lines` as the only writable signal, `computed` for `total` and `itemCount`, design D4); verify `pnpm nx test cart-application`
- [x] 6.4 Red - `increase`, `decrease` and `remove` by product id update `lines`, and `add` of a EUR item to a USD Cart throws and leaves `lines` unchanged, at `CartStore`
- [x] 6.5 Green - minimal code to pass; verify `pnpm nx test cart-application`

## 7. Cart ui

- [x] 7.1 (exempt) Generate `libs/cart/ui` with `@nx/angular:library` (vitest-analog, `--linter=none`), tags `scope:cart,type:ui`, alias `@ngsample/cart-ui`; verify `pnpm nx test cart-ui` runs
- [x] 7.2 Red - navigating `RouterTestingHarness` with `cartRoutes` to `/` with an empty `CartStore` shows "Your cart is empty" and no Cart total, through the DOM
- [x] 7.3 Green - minimal code to pass (`CartPage`, `cartRoutes`); verify `pnpm nx test cart-ui`
- [x] 7.4 Red - with "Essence Mascara Lash Princess" (product 1, 8.94 USD) added 3 times, the cart page shows the title linking to `/catalog/1`, the thumbnail, "$8.94", quantity 3, line total "$26.82" and Cart total "$26.82", through the DOM
- [x] 7.5 Green - minimal code to pass; verify `pnpm nx test cart-ui`
- [x] 7.6 Red - clicking "+" takes the quantity from 1 to 2; "-" is disabled at 1; "Remove" on the first of two lines leaves only the second, through the DOM
- [x] 7.7 Green - minimal code to pass; verify `pnpm nx test cart-ui`
- [x] 7.8 Red - `CartLink` shows an item count of 0 when the Cart is empty and 4 for quantities 3 and 1, and links to `/cart`, through the DOM
- [x] 7.9 Green - minimal code to pass; verify `pnpm nx test cart-ui`

## 8. Add to cart from the product detail

- [x] 8.1 Red - navigating `RouterTestingHarness` with `catalogRoutes` to `/1` (`FakeProductSource` with product 1) and clicking "Add to cart" twice leaves the root `CartStore` with one line for product 1, quantity 2, unit price 8.94 USD, through the DOM
- [x] 8.2 Green - minimal code to pass (`ProductDetail` injects `CartStore` and calls `add(toCartItem(product))`, design D6); verify `pnpm nx test catalog-ui` and `pnpm nx lint catalog-ui`

## 9. App composition

- [x] 9.1 (exempt) Generate `libs/cart/ui-header` with `@nx/angular:library` (vitest-analog, `--linter=none`), tags `scope:cart,type:ui`, alias `@ngsample/cart-ui-header` (design D6: the app shell imports it statically, so `cart-ui` stays lazy); verify `pnpm nx test cart-ui-header` runs
- [x] 9.2 Move `CartLink` and its spec from cart-ui to cart-ui-header with no behavior change; verify the 7.8 tests pass in `pnpm nx test cart-ui-header` and `pnpm nx test cart-ui` stays green
- [x] 9.3 Red - in `src/app`, a TestBed built from `appConfig.providers` (HTTP via `HttpTestingController`) shows a header cart link with an item count of 0 on `/catalog`; opening `/catalog/1`, clicking "Add to cart", going back to the list and following the cart link shows the cart page at `/cart` with product 1's line and an item count of 1
- [x] 9.4 Green - minimal code to pass (`/cart` `loadChildren` in `appRoutes`, `CartLink` from `@ngsample/cart-ui-header` in `App` and `app.html`); verify `pnpm nx test` and `pnpm nx lint ngsample`

## 10. Integration checks and review

- [x] 10.1 Verify the boundaries: temporarily import `@ngsample/catalog-domain` in cart-domain and confirm `pnpm nx run-many -t lint` fails (cart -> catalog stays forbidden), then revert and confirm it passes
- [x] 10.2 Smoke run against the live API: `pnpm nx serve`, add "Essence Mascara Lash Princess" twice from `/catalog/1`, confirm the header shows 2, `/cart` shows "$8.94", quantity 2 and "$17.88", "-" disabled at 1, remove empties the Cart, and a reload starts with an empty Cart
- [x] 10.3 Check changed production code against the apply checklist: no `effect()` writing signals, no subscribe-and-assign, no state derived in `ngOnInit`/`ngOnChanges`, only `zod/mini` imports, no relative cross-lib imports, all deps allowed by tags; verify by grep plus `lint`
- [x] 10.4 Review-stage refactor (separate from the slices): simplify names and duplication with all tests still green
- [x] 10.5 Run SonarQube analysis on the files this change added or modified (the `sonarqube:sonar-analyze` skill via the `sonar` CLI) and fix every new issue it reports, keeping the tests green; verify a re-run reports no new issues on those files
  - Done on the local SonarQube server (`ngsample` project, scanner + LCOV): the 3 issues in code written by this change were fixed; new-code coverage 98.1%. Accepted by the user: 16 `typescript:S1874` issues in the generated cart lib vite/vitest configs (deprecated `nxViteTsPaths`/`nxCopyAssetsPlugin`, shared with the catalog libs), deferred to a follow-up change.
- [x] 10.6 Run `pnpm nx run-many -t lint test build` and `prettier --check .`; verify all pass

## Workflow follow-up

- Archive the change after review (`/opsx:archive`).
- Open a follow-up change to migrate every lib's Vite config from `nxViteTsPaths`/`nxCopyAssetsPlugin` to `vite-tsconfig-paths` and Vite `publicDir` before Nx v24 (clears the accepted Sonar S1874 issues).
