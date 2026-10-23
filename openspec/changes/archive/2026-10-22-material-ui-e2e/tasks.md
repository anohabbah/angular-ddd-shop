# Tasks

Seams, as proposed in design.md, Decision 1. The e2e seam is the running app in Chromium with the product source stubbed. Tests use role, label and text locators only.

## 1. Test seams and e2e setup

- [x] 1.1 Propose the test seams to the user and wait for confirmation; no test task starts before then. One line each:
  - **e2e (`e2e/src`, Playwright)**:
    - Catches: what a shopper sees and does across routing, lazy loading, real providers and the adapter's parsing.
    - Misses: debounce timing precision, and markup or visual details that have no accessible name.
  - **Application stores (Vitest)**: unchanged.
    - Catches: store state rules, such as which search terms settle.
    - Misses: rendering.
  - **Domain functions (Vitest)**: unchanged.
    - Catches: pricing and Cart arithmetic.
    - Misses: everything else.
  - **Infrastructure adapter (Vitest + `HttpTestingController`)**: unchanged.
    - Catches: request shape and boundary parsing.
    - Misses: UI.

  Verify: the user's explicit confirmation is in the conversation.
- [x] 1.2 (exempt) In `e2e/playwright.config.mts`, keep only the `chromium` project (Decision 10). Verify: `pnpm nx e2e e2e --list` lists Chromium only.
- [x] 1.3 (exempt) Add `e2e/src/support/fixtures.ts`, a `test` extended with a `productSource` fixture (Decision 3):
  - dummyjson DTO fixtures for products 1 (mascara, 9.99 USD, 10.48 %), 2 (19.99 USD, 0 %) and 3 ("iPhone 9")
  - `fail()`, `hold()`/release, and a `requests` log
  - a local image for `cdn.dummyjson.com`, and a 404 for a "missing" thumbnail URL
  - every other cross-origin request aborted

  Verify: a first e2e test, "opening `/` shows the product list at `/catalog`", passes with `pnpm nx e2e e2e`.

## 2. Characterize the product list at e2e

Each test is green on first run against the current markup. Break the behavior once by hand to see it go red, then restore it (Decision 4).

- [x] 2.1 Characterize - each product shows its title, thumbnail and "$8.94", with a struck-through "$9.99" (`deletion` role) only for the discounted product, at e2e. Verify: green on the current markup, red when `<s>` is removed.
- [x] 2.2 Characterize - selecting product 1 leads to `/catalog/1`, at e2e. Verify: green, and red with a wrong `routerLink`.
- [x] 2.3 Characterize - typing "phone" in the "Search products" box shows "iPhone 9" only, and "zzzz" shows `No products match "zzzz"`, at e2e. Verify: green, and red when the input handler is unbound.
- [x] 2.4 Characterize - when the product source fails, an alert "Products could not be loaded" is shown with no products, and "Try again" shows the products once the source recovers, at e2e. Verify: green, and red when `reload()` is unbound.
- [x] 2.5 Characterize - a thumbnail that fails to load is replaced by a placeholder named after the product, at e2e. Locate it with `getByRole('img', { name })`; assert `not.toHaveJSProperty('naturalWidth', 0)`. Verify: green, and red when `(error)` is unbound.
- [x] 2.6 Delete `product-list.spec.ts`, `price-tag.spec.ts` and `product-thumbnail.spec.ts`, after checking that every `it` in them maps to 2.1–2.5 or to 7.2 (loading). Verify: `pnpm nx e2e e2e` green.

## 3. Characterize the product detail at e2e

- [x] 3.1 Characterize - `/catalog/1` shows "Essence Mascara Lash Princess" as heading, its description, its category, "$8.94" and a struck-through "$9.99", at e2e. Verify: green, and red when the description is removed.
- [x] 3.2 Characterize - `/catalog/abc` shows "Product not found" and the `requests` log has no product request; `/catalog/99999` (404) shows "Product not found", at e2e. Verify: green, and red when `parseProductId` is bypassed.
- [x] 3.3 Characterize - when the source fails, the alert "Product could not be loaded. Please try again later." is shown and there is no heading, at e2e. Verify: green.
- [x] 3.4 Characterize - the "Back to catalog" link leads to `/catalog`, at e2e. Verify: green, and red with a wrong link.
- [x] 3.5 Characterize - selecting "Add to cart" twice on product 1, then opening `/cart` from the navigation, shows one Cart line at "$8.94" with quantity 2, at e2e. Verify: green, and red when the click handler is unbound.
- [x] 3.6 Delete `product-detail.spec.ts`, after checking each `it` maps to 3.1–3.5 or 7.3 (loading). Set `passWithNoTests` on `catalog-ui`'s test target (exempt, config). Verify: `pnpm nx test catalog-ui` and `pnpm nx e2e e2e` green.

## 4. Characterize the cart page and the session Cart at e2e

- [x] 4.1 Characterize - with an empty Cart, `/cart` shows "Your cart is empty" and no "Cart total", at e2e. Verify: green.
- [x] 4.2 Characterize - after adding product 1 three times, its Cart line shows the title linking to `/catalog/1`, its thumbnail, "$8.94", a Quantity of 3, "$26.82", and "Cart total: $26.82", at e2e. Verify: green, and red when the line total is removed.
- [x] 4.3 Characterize - "Decrease quantity" is disabled at quantity 1; "Increase quantity" makes it 2 and enables "Decrease quantity", at e2e. Verify: green, and red when `[disabled]` is removed.
- [x] 4.4 Characterize - with lines for products 1 and 2, "Remove" on product 1 leaves only product 2, at e2e. Verify: green.
- [x] 4.5 Characterize - adding a product, going back to the product list, then opening the cart page shows its Cart line, and a reload empties the Cart, at e2e. Verify: green.
- [x] 4.6 Delete `cart-page.spec.ts` (each `it` maps to 4.1–4.4), and the "keeps the Cart while the shopper adds a product…" test in `src/app/app.spec.ts` (covered by 4.5). Set `passWithNoTests` on `cart-ui`'s test target (exempt). Verify: `pnpm nx test` and `pnpm nx e2e e2e` green.

## 5. Design system setup

- [x] 5.1 (exempt) Add the Material Symbols Outlined `<link>` (`display=block`) to `src/index.html`, and `MAT_ICON_DEFAULT_OPTIONS` `{ fontSet: 'material-symbols-outlined' }` to `app.config.ts` (Decision 8). Verify: `pnpm nx build` passes; `app.config.spec.ts` green.
- [x] 5.2 (exempt) Extend `src/styles/tailwind.css` (Decision 9):
  - `@theme inline` radius and shadow aliases of `--mat-sys-corner-*` / `--mat-sys-level*`
  - `@utility` type classes `text-title-large`, `text-title-medium`, `text-body-medium`, `text-label-large`

  Update the file's no-preflight comment, since catalog and cart no longer rely on browser defaults. Verify: `pnpm nx build` passes, and the built CSS contains `text-title-large` once a template uses it in 6.x.

## 6. Restyle the Catalog (e2e stays green)

Behavior doesn't change, so there's no red step. Every new button gets `pressable`. Accessible names from the specs stay the same.

- [x] 6.1 Restyle - search box as `mat-form-field` (outline) with `mat-label` "Search products" and `matInput type="search"`; the `aria-label` is dropped. Verify: 2.3 green.
- [x] 6.2 Restyle - product list as a `<ul>` grid of `<li>`, each an `<a>` wrapping an outlined `mat-card` with the thumbnail, `<h2 class="text-title-medium">` and price tag; "Try again" as `mat-stroked-button`. Verify: 2.1, 2.2 and 2.4 green.
- [x] 6.3 Restyle - product detail: back as `<a mat-button>` with `arrow_back`; "Add to cart" as `mat-flat-button` with `add_shopping_cart`; heading `text-title-large`. Verify: 3.1–3.5 green.
- [x] 6.4 Restyle - placeholder `rect` filled with `var(--mat-sys-surface-container-highest)`; price-tag list price uses `--mat-sys-on-surface-variant` instead of opacity. Verify: 2.5 green, and the placeholder is visible in dark mode (manual check with `prefers-color-scheme: dark` emulation).

## 7. Loading indicators as progress bars

- [x] 7.1 Red - while the product source is held, the Catalog shows a progressbar named "Loading products", at e2e. Verify: fails, because the current `<output>` has no progressbar role.
- [x] 7.2 Green - minimal code to pass: `mat-progress-bar mode="indeterminate" aria-label="Loading products"` in place of `<output>`. Verify: 7.1 green.
- [x] 7.3 Red - while the product is held, the product detail shows a progressbar named "Loading product", at e2e. Verify: fails.
- [x] 7.4 Green - minimal code to pass: `mat-progress-bar` with `aria-label="Loading product"` in the product detail. Verify: 7.3 green.

## 8. Restyle the cart page (e2e stays green)

- [x] 8.1 Restyle - cart lines as a `<ul>` of Tailwind-laid-out `<li>` rows separated by `mat-divider`. Decrease, increase and remove become `mat-icon-button`s with `remove`, `add` and `delete` icons, keeping the labels "Decrease quantity", "Increase quantity" and "Remove". Cart total in `text-title-medium`. Verify: 4.1–4.5 green.

## 9. Add-to-cart confirmation (spec: Add-to-cart confirmation)

- [x] 9.1 Red - after "Add to cart" on product 1, the text "Added to cart" and a "View cart" button are shown, at e2e. Verify: fails, because there is no confirmation yet.
- [x] 9.2 Green - minimal code to pass: in `ProductDetail.addToCart`, after `cart.add(...)`, call `MatSnackBar.open('Added to cart', 'View cart', { duration: 4000 })` (Decision 6). Verify: 9.1 green.
- [x] 9.3 Red - selecting "View cart" in the confirmation shows `/cart` with a Cart line for product 1, at e2e. Verify: fails, because the action does nothing.
- [x] 9.4 Green - minimal code to pass: `onAction().subscribe(() => router.navigateByUrl('/cart'))`. Verify: 9.3 green.

## 10. Item count badge (spec: Item count in the header)

- [x] 10.1 Red - with lines of quantity 3 and 1, the header has a link named "Cart, 4 items" showing "4", at e2e. Verify: fails, because the link is named "Cart (4)".
- [x] 10.2 Green - minimal code to pass: `CartLink` as `<a mat-icon-button routerLink="/cart" [matBadge]="cart.itemCount()" [attr.aria-label]="label()">` with a `shopping_cart` icon, and `label = computed(...)` returning "Cart, N items" (Decision 7). Verify: 10.1 green.
- [x] 10.3 Red - with one line of quantity 1, the link is named "Cart, 1 item", at e2e. Verify: fails ("Cart, 1 items").
- [x] 10.4 Green - minimal code to pass: singular in `label`. Verify: 10.3 green.
- [x] 10.5 Red - with an empty Cart, the link is named "Cart, 0 items" and no "0" badge is visible, at e2e. Verify: fails, because the badge shows "0".
- [x] 10.6 Green - minimal code to pass: `[matBadgeHidden]="cart.itemCount() === 0"`. Verify: 10.5 green.
- [x] 10.7 Characterize - from `/catalog/1`, selecting the "Cart, 0 items" link shows `/cart`, at e2e. Verify: green.
- [x] 10.8 Delete `cart-link.spec.ts`, and the "shows a toolbar … with the shop name and the cart link" assertion on `Cart (0)` in `src/app/app.spec.ts`. Replace that assertion with one on the link's accessible name "Cart, 0 items", keeping the toolbar test's shop-name check. Set `passWithNoTests` on `cart-ui-header` (exempt). Verify: `pnpm nx test` green.

## 11. Testing policy documents

- [x] 11.1 (exempt, docs) Update the Testing section of CLAUDE.md:
  - UI behavior is tested e2e in `e2e/` against a stubbed product source, with role, label and text locators.
  - Unit seams are domain functions, then application stores, then infrastructure adapters.
  - No component specs.

  Verify: the section no longer lists components as a unit seam.
- [x] 11.2 (exempt, config) Update `openspec/config.yaml` `tasks` rules:
  - inward-out order becomes domain functions → application stores → e2e
  - add "e2e locators by role, label or text only; no CSS selectors or test ids"
  - the final task runs `pnpm nx e2e e2e` too

  Verify: `openspec validate material-ui-e2e` still passes.

## 12. Review and verification

- [x] 12.1 Review (refactor stage, not inside a slice): duplication across e2e tests (shared helpers in `e2e/src/support`), leftover component CSS made obsolete by utilities, and the apply-guidance checks (no `effect()` writing signals, no subscribe-and-assign, `zod/mini` only, no relative imports across libs, tag rules). Verify: findings fixed or recorded; `pnpm nx lint` and `pnpm nx format:write` pass.
- [x] 12.2 Run `pnpm nx build`, `pnpm nx test` and `pnpm nx e2e e2e`. Verify: all three pass.

## Workflow follow-up

- Archive the change once reviewed, which syncs the `shopping-cart` delta into `openspec/specs/`.
