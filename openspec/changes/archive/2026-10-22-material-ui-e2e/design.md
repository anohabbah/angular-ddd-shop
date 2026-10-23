# Design

## Context

See proposal.md (Why). What shapes the approach:

- Only the app shell uses Material. `MAT_RIPPLE_GLOBAL_OPTIONS` disables ripples app-wide, and the `pressable` utility (`src/styles/tailwind.css`) gives press feedback instead.
- Tailwind 4.3 is wired through `@tailwindcss/postcss`, with no JS config. Source detection starts from `process.cwd()`, the workspace root under Nx, so templates in `libs/**` are already scanned. Component stylesheets in libs are compiled separately and cannot see the app's `@theme` without `@reference`.
- `e2e/` is an Nx Playwright project (`nxE2EPreset`, `webServer` runs `ngsample:serve`) with no tests yet. Chromium, Firefox and WebKit are all configured.
- The product source adapter calls `https://dummyjson.com/products`, `/products/search` and `/products/:id`. Thumbnails come from `https://cdn.dummyjson.com/**`.
- UI specs (Vitest + TestBed) find elements by tag and CSS selectors: `li`, `h2`, `output`, `s`, `input[type="search"]`, `button[aria-label=…]`.
- `CartStore.add` lets `CurrencyMismatchError` propagate, so code after it in the same handler runs only when the add succeeded.

## Goals / Non-Goals

**Goals:**

- UI behavior is tested only through what a shopper sees and what assistive technology exposes (roles, accessible names, text). Restyling then never requires changing a test.
- Every behavior asserted by the deleted component specs is asserted by an e2e test first.
- Catalog and cart screens use Material components and system tokens, and follow the light and dark color schemes.

**Non-Goals:**

- Porting the shell's own `app.spec.ts` tests (navigation, breakpoints, drawer). Only the two tests that read the cart link's text move to e2e. The rest stay until a follow-up change.
- Replacing the shell's inline SVG menu icon with `mat-icon`.
- Debounce timing ("requested only for 'pho'"). This stays in `catalog-store.spec.ts`, where virtual time makes it exact. e2e checks only the outcome.
- Visual regression (screenshot) tests.
- Running Firefox and WebKit in the local loop (see Decisions).

## Decisions

### 1. Test levels

| Layer | Tool | Seam |
|---|---|---|
| `domain` | Vitest, no TestBed | pure functions |
| `application` | Vitest + TestBed | store public API |
| `infrastructure` | Vitest + `HttpTestingController` | port methods; boundary parsing |
| `ui` + app composition | Playwright (`e2e/src`) | the running app in a browser |

Rejected: Material component harnesses in TestBed. They hide Material's DOM, but tests still change when we swap a Material component for another, say a list for cards. Harnesses also don't exercise routing, lazy loading or the app's real providers.

### 2. Locators

e2e tests use `getByRole`, `getByLabel` and `getByText`, scoped with `filter({ hasText })` when a page repeats a pattern, such as one list item per Cart line. They use no CSS or tag selectors and no `data-testid`. Where a role-based query would be ambiguous, the template gets a better accessible name, which also helps screen-reader users.

Examples:

- A product: `getByRole('listitem').filter({ hasText: title })`
- The struck-through list price: `getByRole('deletion')`. HTML-AAM maps `<s>` to `deletion`, but Playwright maps only `<del>`, so the price tag's `<s>` carries an explicit `role="deletion"`
- Loading: `getByRole('progressbar', { name: 'Loading products' })`

### 3. Stubbed product source, hermetic network

`e2e/src/support/fixtures.ts` extends Playwright's `test` with a `productSource` fixture that routes `https://dummyjson.com/**`:

- The fixtures are dummyjson DTOs (`price`, `discountPercentage`, …). That's the external contract, so e2e imports nothing from `libs/` and stays outside the module-boundary graph.
- Controls:
  - `products` / `productsById`: what the source serves
  - `fail()`: answer 500
  - `hold()`: requests wait until released, for loading states
  - `requests`: the URLs requested, for "no product requested"
- `https://cdn.dummyjson.com/**` serves a small local image fixture. A product with a `missing` thumbnail URL gets a 404, to show the placeholder.
- Any other cross-origin request, Google Fonts included, is aborted. Tests never depend on the network, and icon buttons are found by accessible name, not by glyph.

Rejected: the real dummyjson.com. It's slow and flaky, and it can't produce errors, loading or 404s on demand.

### 4. Characterize first, then restyle

For each screen: write the e2e tests against the current plain markup and see them pass, then delete the component spec, then restyle. Tests that pass on the old markup and still pass on the new one show they are markup-independent. They then guard the restyle, which needs no red step because behavior doesn't change. New behavior (confirmation, badge) is test-first: red, then green.

Characterization tests are green on first run. To guard against a test that can't fail, each one is checked once by breaking the behavior it covers (for example, removing the price) and seeing it go red. That check is not committed.

### 5. Material mapping

| Element | Material / markup | Note |
|---|---|---|
| Search | `mat-form-field` (outline) + `matInput type="search"` with a `mat-label` "Search products" | name comes from the label, so the `aria-label` is dropped |
| Loading (list and detail) | `mat-progress-bar mode="indeterminate"` with `aria-label` "Loading products" / "Loading product" | replaces `<output>`; the spec only asks for "a loading indicator" |
| Error | `<p role="alert">` + `mat-stroked-button` "Try again" | |
| Product list | `<ul>` grid of `<li>`; each holds an `<a routerLink>` wrapping a `mat-card` (appearance `outlined`) with the thumbnail, `<h2>` title and price tag | list semantics stay for screen readers |
| Product detail | back: `<a mat-button>` with an `arrow_back` icon; add: `mat-flat-button` with an `add_shopping_cart` icon | |
| Cart lines | `<ul>` of `<li>` rows laid out with Tailwind, `mat-divider` between them; `mat-icon-button`s `remove` / `add` / `delete` keeping the labels "Decrease quantity", "Increase quantity", "Remove" | `mat-list-item`'s fixed slots don't fit rows with three controls |
| Cart link | `<a mat-icon-button routerLink="/cart" [matBadge]>` with `shopping_cart` | see 7 |
| Thumbnail placeholder | `rect` fill `var(--mat-sys-surface-container-highest)` | follows the color scheme |

Every new button gets the `pressable` class, since ripples stay off.

### 6. Add-to-cart confirmation

`ProductDetail.addToCart` is the click handler. It calls `cart.add(...)`, then `snackBar.open('Added to cart', 'View cart', { duration: 4000 })`, then subscribes to `onAction()` to call `router.navigateByUrl('/cart')`.

- The handler runs the command and then the outward call. No `effect()` is involved; the `effects` reference says effects sync state outward, and a confirmation responds to an event, not to state.
- `onAction()` completes when the snackbar is dismissed, so the subscription ends on its own. It assigns nothing; it navigates. It's an external event stream, which the project's RxJS rule allows.
- `catalog/ui` reaching `/cart` by URL adds no import of the cart context's UI. The existing catalog → cart edge (ADR 0001) already covers `CartStore`.
- The snackbar renders in the CDK overlay on `document.body`. e2e finds it by text and the "View cart" button by role.

### 7. Item count badge

- `matBadge` goes on the anchor, not on `mat-icon`. Material warns when a badge sits on an `aria-hidden` icon, and puts `aria-hidden="true"` on the badge content.
- The anchor's `aria-label` carries the count through the `i18nPlural` pipe over `itemCount()`, with a mapping keyed by the locale's plural categories (`one`: "Cart, # item", `other`: "Cart, # items"). The locale is Angular's default, `en-US`.
- `[matBadgeHidden]="cart.itemCount() === 0"`.
- The label is UI wording, not a domain rule, so it stays in the component. No new domain function.

### 8. Icons

- Google Fonts `<link>` for `Material+Symbols+Outlined` with `display=block` in `src/index.html`. `block` avoids showing ligature names as text while the font loads.
- `{ provide: MAT_ICON_DEFAULT_OPTIONS, useValue: { fontSet: 'material-symbols-outlined' } }` in `app.config.ts`. The app is the composition layer, so libs need no icon setup.

### 9. Tailwind extension (CSS-first, v4)

- In `src/styles/tailwind.css`, `@theme inline` also maps:
  - `--radius-xs|sm|md|lg|xl|full` to `--mat-sys-corner-*`
  - `--shadow-1…5` to `--mat-sys-level1…5`
- Material type tokens are `font` shorthands, so they become `@utility` classes instead: `text-title-large`, `text-title-medium`, `text-body-medium`, `text-label-large`, each set to `font: var(--mat-sys-…)`.
- Libs use these utilities in templates and never use `@apply`/`@reference` in their own stylesheets. The few remaining component `.css` rules use `var(--mat-sys-*)` directly.

Rejected:

- Option B, moving the theme into `libs/shared/ui` so libs can `@reference` it. That adds a lib for little benefit.
- A JS `tailwind.config`. It's v3 style; the `tailwind-css` reference forbids it.

### 10. Browsers

`playwright.config.mts` keeps only the `chromium` project, which keeps the local loop fast. Firefox and WebKit can come back for CI in a later change.

### 11. Policy documents

- CLAUDE.md Testing: UI behavior is tested e2e in `e2e/` against a stubbed product source, with role, label and text locators. Unit seams are domain functions, then stores, then adapters. No component specs.
- `openspec/config.yaml` `tasks` rules: "domain → stores → ui" becomes "domain → stores → e2e", and "e2e locators by role/label/text only" is added.

### Architecture and state checklist

- New libs: none. Every change sits in an existing lib with its existing tags:
  - `catalog/ui` (`scope:catalog`, `type:ui`)
  - `cart/ui` and `cart/ui-header` (`scope:cart`, `type:ui`)
  - the app (`type:app`)
- New lib imports are only `@angular/material/*` and `@angular/router`, which are third-party and not governed by tags.
- Domain types and boundary parsing: unchanged. Untrusted HTTP data is still parsed in the dummyjson adapter. e2e fixtures are dummyjson DTOs, so the adapter's parsing runs during e2e.
- Writable signals: none added.
- Derived values:
  - the cart link's accessible name: the `i18nPlural` pipe over the `itemCount` computed
  - whether the badge is hidden: an inline template expression over the `itemCount` computed
- `effect()`: none added.

### angular-developer references consulted

- `tailwind-css`: v4 CSS-first config, no `tailwind.config.js` (Decision 9).
- `effects`: no effect for the confirmation; open it from the event handler (Decision 6).
- `navigate-to-routes`: `Router.navigateByUrl('/cart')` for the snackbar action (Decision 6).
- `e2e-testing`: keep the existing Playwright setup; no `ng add` (Decision 3).
- `component-harnesses`: considered and rejected for UI tests (Decision 1).
- `component-styling`: component styles limited to tokens; layout via utilities (Decision 9).

## Risks / Trade-offs

- [e2e is slower than TestBed] → only Chromium; the stubbed network removes latency; debounce timing stays in the store unit test.
- [Characterization tests can pass vacuously] → each one is broken once by hand to see it go red (Decision 4).
- [Material changes accessible structure, e.g. `mat-form-field` labels] → locators use names from the specs ("Search products", "Decrease quantity"), and each restyle task must keep them.
- [The Google Fonts dependency at runtime] → `display=block` hides the glyph text. Every icon button has an accessible name, so the app stays usable when the font is blocked.
- [Snackbar duration makes tests time-sensitive] → assertions run right after the click; Playwright's auto-wait is far below 4s.
- [`app.spec.ts` keeps TestBed shell tests that render `CartLink`] → only the two text assertions on the cart link move to e2e; the rest don't read the cart link's markup.

- [UI libs left with no spec files make `vitest` fail with "No test files found"] → set `passWithNoTests` on the test targets of `catalog-ui`, `cart-ui` and `cart-ui-header`, so a future UI unit test can still be added.

## Migration Plan

Each screen is migrated on its own, in the order of tasks.md. The app stays releasable after every task. Rollback is a git revert of the change. Nothing is persisted, and there is no API change.
