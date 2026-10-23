# Tasks

## 1. Agree on test seams

- [x] 1.1 Propose these seams to the user and wait for explicit confirmation before writing any test; done when the user has confirmed (or amended) the list below
  - `pageTitle` (`@ngsample/shared/domain`, plain Vitest): catches the "<page> | ngsample" format; misses whether each page sets it.
  - `lineQuantity`, `focusAfterRemoval` (`@ngsample/cart/domain`, plain Vitest): catch the in-Cart Quantity lookup and the next/previous/none rule for focus after removal; miss whether the UI uses them and where focus actually lands.
  - e2e behavior tests by role, label and text (`e2e/src/*.spec.ts`, stubbed product source): catch titles, headings, landmarks, accessible names, status-message content, focus position after navigation and removal, focus not obscured; miss what a screen reader actually announces and the contrast of focus rings.
  - e2e axe gate (`e2e/src/accessibility.spec.ts`, `@axe-core/playwright`, WCAG 2.2 A/AA tags) across the conformance matrix, plus reflow, text-spacing and target-size probes: catches automatically detectable WCAG failures in every page × state × scheme × width cell; misses criteria needing judgment or real assistive technology.
  - Manual: VoiceOver + Safari script and focus-ring contrast measurements, recorded in the conformance statement: catch announcement quality and indicator contrast; miss NVDA and mobile screen readers (recorded as not tested).

## 2. Setup

- [x] 2.1 (exempt) Add `@axe-core/playwright` as a dev dependency with `pnpm add -D @axe-core/playwright`; verify `pnpm install` passes and `import AxeBuilder from '@axe-core/playwright'` type-checks in an e2e file

## 3. Shared domain: page title

- [x] 3.1 Red - `pageTitle('Catalog')` is `'Catalog | ngsample'` and `pageTitle('Essence Mascara Lash Princess')` is `'Essence Mascara Lash Princess | ngsample'` at `@ngsample/shared/domain` (values from the accessibility spec's Page titles scenarios)
- [x] 3.2 Green - minimal code to pass, exported from the lib's `index.ts`; verify `pnpm nx test shared-domain`

## 4. Cart domain: Quantity in the Cart and focus after removal

- [x] 4.1 Red - `lineQuantity(lines, 1)` is `3` when product 1's line has quantity 3, and `undefined` when product 1 has no line, at `@ngsample/cart/domain`
- [x] 4.2 Green - minimal code to pass; verify `pnpm nx test cart-domain`
- [x] 4.3 Red - `focusAfterRemoval` with lines [1, 2]: removing 1 gives `2`, removing 2 gives `1`; with lines [1]: removing 1 gives `undefined`, at `@ngsample/cart/domain` (values from the shopping-cart spec's Focus after removing a Cart line scenarios)
- [x] 4.4 Green - minimal code to pass; verify `pnpm nx test cart-domain`

## 5. Page titles and headings (e2e)

- [x] 5.1 Red - e2e: the document title is "Catalog | ngsample" on `/catalog`, "Cart | ngsample" on `/cart`, "Essence Mascara Lash Princess | ngsample" on `/catalog/1` once loaded, and "Product not found | ngsample" on `/catalog/abc` (accessibility spec, Page titles)
- [x] 5.2 Green - route `title: pageTitle(...)` in `catalog.routes.ts` and `cart.routes.ts`; `ProductDetail.pageName` computed and an `effect` calling `Title.setTitle(pageTitle(pageName()))` (design D3); verify `pnpm nx e2e e2e`
- [x] 5.3 Red - e2e: the product list has the level-one heading "Catalog" when loaded, loading and failed; the product detail's level-one heading is "Product not found" for `/catalog/abc` and "Product" when the product source fails. Update the existing detail tests that expect "Product not found" as an alert and no heading on failure (product-catalog spec, Product list heading and Product detail heading in every state)
- [x] 5.4 Green - minimal template changes (design D11, Headings); verify `pnpm nx e2e e2e`

## 6. App shell: landmark, focus after navigating, focus not obscured, focus indicators

- [x] 6.1 Red - e2e: on a 1280px viewport there is exactly one navigation landmark, named "Main", containing the Catalog and Cart links (app-shell spec, Navigation landmark)
- [x] 6.2 Green - drop the `<nav>` wrapper and label `mat-nav-list` (design D5); verify `pnpm nx e2e e2e`, including the existing navigation tests
- [x] 6.3 Red - e2e: focusing the mascara product and pressing Enter shows the detail with the main region focused, and the next Tab focuses "Back to catalog"; activating the Cart navigation link with the keyboard focuses the main region; opening `/catalog` directly leaves focus on the document body (app-shell spec, Focus after navigating)
- [x] 6.4 Green - `<main tabindex="-1">` as a `viewChild`, and an `afterRenderEffect` on `router.lastSuccessfulNavigation()` that skips the initial navigation (design D4); verify `pnpm nx e2e e2e`
- [x] 6.5 Red - e2e: at 390 × 500, with the product list scrolled down, moving focus backwards to the first product leaves its bounding box entirely below the header's bottom edge (accessibility spec, Focus not obscured)
- [x] 6.6 Green - `scroll-padding-top` on `.mat-drawer-content` (design D7); verify `pnpm nx e2e e2e`
- [x] 6.7 Style - `mat.strong-focus-indicators()` themed with `--mat-sys-primary` and a global `a:focus-visible` outline (design D6); verify by screenshots of the focused cart link, the current Catalog nav link and a product card in both color schemes, and by measuring indicator contrast against adjacent colors (≥ 3:1). Record the measured ratios for the statement (task 10.1)

## 7. Product catalog: price text, decorative thumbnails, outcome status (e2e)

- [x] 7.1 Red - e2e: the mascara entry contains the text "Final price $8.94" and "List price $9.99"; the eyeshadow entry contains "Final price $19.99" and no "List price"; `getByRole('deletion')` still has exact text "$9.99" (product-catalog spec, Price display in text)
- [x] 7.2 Green - `sr-only` labels in `PriceTag`, outside the `<s>` (design D11); verify `pnpm nx e2e e2e`
- [x] 7.3 Red - e2e: the mascara product link's accessible name contains "Essence Mascara Lash Princess" exactly once; no product image in the list or on the cart page has a non-empty text alternative (product-catalog spec, Thumbnails are decorative)
- [x] 7.4 Green - `alt=""` in `ProductThumbnail` and on the cart page image, and an `aria-hidden` placeholder SVG; verify `pnpm nx e2e e2e`
- [x] 7.5 Red - e2e: the status region reads "3 products" for the unfiltered stub, "1 product" after searching "iphone", and "No products match \"zzzz\"" after searching "zzzz", with focus still in the search field (product-catalog spec, Product list outcome announced)
- [x] 7.6 Green - an always-present `<p role="status">` with `i18nPlural` content and the no-match text moved into it (design D9); verify `pnpm nx e2e e2e`, including the existing No matches test

## 8. Shopping cart: in-cart status, named controls, announcements, focus after removal (e2e)

- [x] 8.1 Red - e2e: after adding product 1 once, the status reads "Quantity in cart: 1" with a "View cart" link and focus stays on "Add to cart"; after adding again it reads "Quantity in cart: 2"; after waiting 10 s it is still shown; opening `/catalog/1` through the navigation with quantity 3 in the Cart shows "Quantity in cart: 3"; "View cart" leads to `/cart`. Replace the existing snackbar tests (shopping-cart spec, Add-to-cart confirmation)
- [x] 8.2 Green - remove `MatSnackBar`; `quantityInCart` computed from `lineQuantity`, and an always-present `role="status"` region (design D8); verify `pnpm nx e2e e2e`
- [x] 8.3 Red - e2e: with mascara and eyeshadow in the Cart, buttons "Remove Essence Mascara Lash Princess", "Increase quantity of Essence Mascara Lash Princess" and "Decrease quantity of Eyeshadow Palette with Mirror" exist, and no button is named exactly "Remove" (shopping-cart spec, Cart line controls name their product). Update the existing cart tests' locators
- [x] 8.4 Green - product-named `aria-label`s in `cart-page.html`; verify `pnpm nx e2e e2e`
- [x] 8.5 Red - e2e: with one mascara line at quantity 1, increasing it makes the status "Quantity of Essence Mascara Lash Princess" read 2 and the Cart total status read "Cart total: $17.88", with focus still on the increase button (shopping-cart spec, Quantity and Cart total announced)
- [x] 8.6 Green - quantity `span` with `role="status"` and a per-product `aria-label`; `role="status"` on the Cart total (design D9); verify `pnpm nx e2e e2e`
- [x] 8.7 Red - e2e: with lines for products 1 and 2, removing product 1 by keyboard focuses "Remove Eyeshadow Palette with Mirror"; removing product 2 focuses "Remove Essence Mascara Lash Princess"; removing the only line focuses "Your cart is empty" (shopping-cart spec, Focus after removing a Cart line)
- [x] 8.8 Green - `CartPage.remove` computes `focusAfterRemoval` before removing, then focuses the target after the next render (design D10); verify `pnpm nx e2e e2e`

## 9. Automated conformance gate (e2e)

- [x] 9.1 Red - write `e2e/src/accessibility.spec.ts`: an axe scan (tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`) per cell of the conformance matrix (product list loaded, loading, failed, no matches; product detail loaded, loading, not found, failed; cart empty and with lines; narrow navigation open) × (wide light, wide dark, narrow 390 light, 320 dark), each test titled by page, state, scheme and width. Also add reflow (no horizontal scroll at 320), text-spacing (no clipped text) and target-size (≥ 24 × 24) probes. Verify it fails, naming the cell and rule, when the "Catalog" heading is temporarily removed (accessibility spec, A failing cell fails verification)
- [x] 9.2 Green - fix any remaining violations the gate reports, each in the lib that owns the markup or in `theme.scss`; verify `pnpm nx e2e e2e` passes for every cell, with no rule disabled or excluded

## 10. Conformance statement and project rules

- [x] 10.1 (exempt) Write `docs/accessibility/voiceover-script.md`: for each page and state of the matrix, the VoiceOver + Safari keys to press and the expected announcement, taken from the spec scenarios; verify every scenario that names an accessible name, status message or focus position appears in it
- [x] 10.2 Manual - the maintainer runs the VoiceOver script on macOS with Safari and notes each step as pass or fail; done when every step has a result. Failures go back to the group that owns the behavior, as a new Red/Green slice
- [x] 10.3 (exempt) Write `docs/accessibility/conformance.md`. It contains the claim (date, WCAG 2.2 with its URI, level AA, pages and states, technologies relied upon), a verdict and note for each of the 55 A/AA success criteria, the manual measurements from 6.7 plus the contrast cases axe marks incomplete, VoiceOver + Safari as tested and NVDA and mobile screen readers as not tested. Verify no criterion is marked Supports without evidence from the gate (9.2) or the manual pass (10.2)
- [x] 10.4 (exempt) Update the CLAUDE.md Testing section: the e2e axe gate covers the conformance matrix, and a change touching a `ui` lib or the app shell re-runs it and re-checks the affected verdicts in `docs/accessibility/conformance.md`; verify the section reads consistently with the accessibility spec's Statement kept current requirement

## 11. Verification

- [x] 11.1 Run `pnpm nx build`, `pnpm nx test`, `pnpm nx lint` and `pnpm nx e2e e2e`; all pass. Then check the changed production code for `effect()` bodies calling `.set()`/`.update()`, subscribe-and-assign, state derived in `ngOnInit`/`ngOnChanges`, `zod` instead of `zod/mini`, relative imports across libs, and dependencies the CLAUDE.md tag rules don't allow

## 12. Review

- [x] 12.1 Refactoring review of the changed code (naming against GLOSSARY.md, duplication between e2e helpers and the gate's state setup, template clarity); verify `pnpm nx test` and `pnpm nx e2e e2e` still pass afterwards

## Workflow follow-up

- Archive the change after the manual VoiceOver pass (10.2) is recorded and the statement is dated.
