# Design

## Context

See proposal.md (Why) for the audit findings and the specs for the required behavior. The current state that shapes the approach:

- The shell (`src/app/app.html`) wraps `mat-nav-list` in `<nav>`. `MatNavList` already sets `role="navigation"`, so the page has two nested navigation landmarks. Page content scrolls inside `mat-sidenav-content`, under a sticky `<header>`.
- No route has a `title`, and `index.html` sets "ngsample".
- `theme.scss` applies `mat.theme` with no focus-indicator mixin. Ripples are replaced by the `pressable` utility, which leaves Material's faint M3 focus state layer as the only focus cue.
- `ProductDetail.addToCart` opens a `MatSnackBar` and subscribes to its action.
- Cart and catalog templates use `aria-label` on a generic `span`, `alt` equal to the adjacent title, and `role="deletion"` on `<s>`.
- e2e tests run against `e2e/src/support/fixtures.ts`, which stubs the product source and the image CDN and aborts every other cross-origin request (Google Fonts included).
- The throwaway audit script (scratchpad, not in the repo) showed that axe runs inside that stub setup across the whole matrix.

## Goals / Non-Goals

**Goals:**

- No new writable signal. Every new piece of state is derived. DOM focus and the document title are synced outward.
- Each fix stays in the lib that owns the markup. Pure rules (a product's Quantity in the Cart, which line receives focus after a removal, the page-title format) live in domain functions.
- The gate runs in the existing `pnpm nx e2e e2e` with no separate pipeline.

**Non-Goals:**

- No `@angular/aria` directives. The app has no listbox, menu, tabs, combobox, tree or grid. Material and native elements cover the rest.
- No in-app accessibility page (EAA), no WCAG 3.0 work, no AAA criteria. Reduced motion stays as already specified.
- No testing with NVDA or mobile screen readers. The statement lists them as not tested.

## Decisions

### D1. Placement and dependencies

| Piece                                                                                                   | Lib (tags)                                        | Edges (all allowed by CLAUDE.md)                            |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------- |
| `pageTitle(page)` → `"<page> \| ngsample"`                                                              | `libs/shared/domain` (`scope:shared,type:domain`) | none                                                        |
| `lineQuantity(lines, productId)`, `focusAfterRemoval(lines, productId)`                                 | `libs/cart/domain` (`scope:cart,type:domain`)     | domain → domain; cart → shared                              |
| In-cart status on the product detail; headings; result-count status; price labels; decorative thumbnail | `libs/catalog/ui` (`scope:catalog,type:ui`)       | ui → application, domain; catalog → cart (ADR 0001), shared |
| Product-named controls, quantity and total status, focus after removal                                  | `libs/cart/ui` (`scope:cart,type:ui`)             | ui → application, domain; cart → shared                     |
| Route titles (`catalog.routes.ts`, `cart.routes.ts`) and the product detail's page name                 | `libs/catalog/ui`, `libs/cart/ui`                 | ui → domain; catalog, cart → shared                         |
| Focus after navigating, navigation landmark                                                             | `src/app` (`type:app`)                            | none new                                                    |
| Focus indicators, scroll padding                                                                        | `src/styles/theme.scss`                           | —                                                           |
| axe gate and behavior tests                                                                             | `e2e/`                                            | imports nothing from `libs/`                                |

The title format lives once, in `pageTitle`. It is in shared domain because both ui libs that set titles can import it, and because the app, which may not import domain, never needs it: the app's only routes are a redirect and lazy loaders.

### D2. Automated gate: `@axe-core/playwright` in e2e

- **Where:** a new `e2e/src/accessibility.spec.ts` uses the existing fixtures. One `test.describe` per setup: wide light, wide dark, narrow 390 light, reflow 320 dark. Each setup is configured with `test.use({ viewport, colorScheme })`.
- **What:** one test per state, which reaches the state by role, label and text, then runs `new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa'])` and expects `violations` to equal `[]`. The test title names page, state, scheme and width, so a failure names its cell, as the spec requires.
- **States:** the loading states use `productSource.hold()`, the failed states `productSource.fail()`, the cart states the `addToCart` and `openCart` helpers.
- **Reflow and text spacing:** probes in the same file assert `scrollWidth <= innerWidth`, and that no text element clips after a text-spacing stylesheet is injected.
- **Not chosen:**
  - _`best-practice` tags in the gate:_ best-practice rules aren't conformance, and they would fail the build on non-WCAG rules.
  - _Lighthouse:_ it uses axe under the hood with fewer rules and is slower.
  - _A separate a11y project:_ it would duplicate the stub fixtures.
- **Fonts:** the fixtures abort Google Fonts, so icon ligatures render as text ("shopping_cart"). The icons are `aria-hidden` (MatIcon default), so axe ignores them. Contrast of real glyphs is checked manually (D11).

### D3. Page titles: route `title` from `pageTitle()`, plus an effect for the product detail

- **Format:** `pageTitle(page: string): string` in `libs/shared/domain` returns `"<page> | ngsample"`. It is pure and tested with Vitest.
- **Static titles:** `catalogRoutes` sets `title: pageTitle('Catalog')` on the list route and `pageTitle('Product')` on `:productId`. `cartRoutes` sets `pageTitle('Cart')`. Angular's default `TitleStrategy` applies them on navigation (define-routes → Page Titles).
- **Product detail:** the title depends on the loaded product, so a static route title can't supply it, and a `ResolveFn` would fetch the product a second time outside the `productDetail()` resource. Instead, `ProductDetail` derives `pageName = computed(...)`: "Product" while loading or failed, "Product not found", or the product title. An `effect` writes `pageTitle(pageName())` outward with `Title.setTitle`.
- **Ordering:** the router's title strategy runs synchronously at the end of navigation. Component effects run during the following change detection, so the detail's title always lands last. The e2e "Unknown product" title scenario guards this, because that title is known without a request.
- **Not chosen:**
  - _A custom `TitleStrategy` in the app:_ the app may not import domain, so the format would have to be duplicated in catalog ui for the dynamic title.
  - _A `ResolveFn` title:_ it fetches the product twice.

### D4. Focus after navigating: `afterRenderEffect` on `router.lastSuccessfulNavigation()`

- **How:** `App` already reads `router.lastSuccessfulNavigation()`. An `afterRenderEffect` (write phase) runs when it changes. It skips the first navigation (`previousNavigation === null`, the initial load) and calls `main.focus()`. `main` is a `viewChild` on `<main tabindex="-1">` (effects → afterRenderEffect for DOM writes; queries → `nativeElement` only for `focus()`).
- **Why the main region and not the `h1`:** the product detail's `h1` is replaced when the product loads (`@if` branches). Focus on the loading `h1` would drop to `<body>` when the loaded `h1` replaces it. `<main>` is stable across every state. VoiceOver announces the new document title on navigation, and focusing the main landmark reads its start.
- **Focus ring:** `main:focus { outline: none }`. It is not an interactive control, and its focus exists only to place the reading position.
- **Not chosen:** a `NavigationEnd` subscription, which is subscribe-style. The existing signal already exists, and the sync is outward to the DOM.

### D5. One navigation landmark

Drop the `<nav>` wrapper in `app.html` and put `aria-label="Main"` on `mat-nav-list`, which keeps its own `role="navigation"`. Existing e2e helpers use `getByRole('navigation')`, and they keep working.

### D6. Focus indicators: `mat.strong-focus-indicators` + one rule for plain links

- **Material components:** `theme.scss` includes `mat.strong-focus-indicators()` and sets its color to `--mat-sys-primary` with a 3px width. The ring is drawn outside the state layer, so it is distinct from the active nav pill (spec: Visible focus indicator).
- **Plain links:** the product card and cart titles get a global `a:focus-visible { outline: 3px solid var(--mat-sys-primary); outline-offset: 2px }`. Today they show Chrome's default ring, which differs per browser and color scheme.
- **Contrast check:** primary vs surface and primary vs surface-container (toolbar) are measured in both schemes and recorded in the statement. M3 azure primary against surface is well above 3:1 in both schemes, so the measurement is a check, not a design risk.
- **Not chosen:** re-enabling ripples, which give no focus cue for keyboard users.

### D7. Focus not obscured: scroll padding on the scroll container

Set `scroll-padding-top` on `.mat-drawer-content` (the element that scrolls) to the toolbar height plus a margin: `calc(var(--mat-toolbar-standard-height, 64px) + 8px)`. Browsers then keep focused elements below the sticky header when they scroll them into view. There is no JavaScript.

### D8. Add-to-cart confirmation: derived in-cart status replaces the snackbar

- **Domain:** `lineQuantity(lines, productId): Quantity | undefined` in cart domain, tested with Vitest.
- **UI:** `ProductDetail` derives `quantityInCart = computed(() => detail.product.hasValue() ? lineQuantity(cart.lines(), detail.product.value().id) : undefined)`.
- **Template:** a `<p role="status">` is always rendered next to the button. Its content ("Quantity in cart: N" and a `<a routerLink="/cart">View cart</a>`) renders only while `quantityInCart()` is defined.
- **Why the region is always present:** a live region must exist before its content changes, or screen readers miss the first announcement.
- `MatSnackBar`, the `Router` injection and the `.onAction().subscribe` go away. `addToCart` becomes one line.
- **Why derived, not a "just added" flag:**
  - It needs no writable signal.
  - Its truth is the Cart, so it is right on arrival too ("Product already in the Cart" scenario).
  - It can't go stale on another page.
- **Not chosen:** a snackbar with `duration: 0` and a token override. It still fails 4.1.2 inside Material (user decision).

### D9. Status messages: always-present regions with derived content

- **Catalog:** a visible `<p role="status">` above the product list holds the outcome, derived from the store:
  - while loaded with matches: `store.products.value().length | i18nPlural` ("1 product" / "# products")
  - for no matches: the existing "No products match …" text
  - while loading or failed: empty
  - It is the one region for the outcome, so "No products match" moves into it instead of a second paragraph.
- **Cart:**
  - Each line's quantity is a `<span role="status" [attr.aria-label]="'Quantity of ' + title">`, with the visible number as content.
  - The Cart total `<p>` gets `role="status"`.
  - Only regions whose content changes announce, so increasing one line announces its quantity and the new total.
- **Not chosen:** `LiveAnnouncer.announce()` from event handlers. It is imperative, duplicates the visible text in code, and is not derived from state.

### D10. Focus after removing a Cart line

- **Domain:** `focusAfterRemoval(lines, productId): ProductId | undefined` in cart domain. It returns the next line's product id, else the previous line's, else `undefined`. It is pure and tested with Vitest against the spec's three scenarios.
- **UI:** `CartPage.remove(productId)` computes the target **before** calling `cart.remove`. It then uses `afterNextRender(() => …, { injector })` to focus that line's Remove button, found in `viewChildren('remove', { read: ElementRef })` by a `data-product-id` attribute. When there is no target, it focuses the empty-cart `<p #empty tabindex="-1">`.
- **Not chosen:** focusing in an effect on `lines()`. That would move focus on every Cart change, including from other pages, and an effect has no idea which action caused the change.

### D11. Text alternatives and names

- **Price tag:**
  - an `sr-only` "Final price" span before the final amount
  - an `sr-only` "List price" span before the `<s role="deletion">`, outside it, so the e2e `getByRole('deletion')` keeps its exact text "$9.99"
- **Product thumbnail:** always decorative. `alt=""` on the image, and `aria-hidden="true"` instead of `role="img"` on the placeholder SVG. The cart page's image gets `alt=""` too.
- **Cart controls:** `[attr.aria-label]` becomes "Decrease quantity of {{title}}", "Increase quantity of {{title}}" and "Remove {{title}}". The remove button gets `#remove` and `[attr.data-product-id]`.
- **Headings:**
  - The product list gets a visible `<h1 class="text-title-large">Catalog</h1>` above the search field, outside the state `@if`.
  - The product detail: "Product not found" becomes the `h1` in place of the alert paragraph, since a page's main content isn't an alert. The loading and failed branches get `<h1>Product</h1>`, and failed keeps its `role="alert"` message.

### D12. Conformance statement, VoiceOver script and project rules

- **`docs/accessibility/conformance.md`:**
  - the WCAG claim components (date, "WCAG 2.2" with URI, AA, pages and states, technologies relied upon: HTML, CSS, JavaScript, WAI-ARIA)
  - a table of the 55 A/AA success criteria with Supports / Partially supports / Does not support / Not applicable and a note
  - the tested and not-tested AT pairs
  - manual measurements: focus-ring contrast in both schemes, and the contrast cases axe marked incomplete (sidenav pill, toolbar)
- **`docs/accessibility/voiceover-script.md`:** per page and state, the keys to press and the expected announcement, taken from the spec scenarios.
- **CLAUDE.md Testing:** two lines. The e2e axe gate covers the conformance matrix. A change touching a `ui` lib or the shell re-checks the statement.

### Writable signals and effects

| Kind                           | Name                                                       | Why / syncs to                                  |
| ------------------------------ | ---------------------------------------------------------- | ----------------------------------------------- |
| Writable signal                | none new                                                   | —                                               |
| `computed`                     | `ProductDetail.quantityInCart`, `ProductDetail.pageName`   | derived from Cart lines and the detail resource |
| `effect`                       | `ProductDetail` page name → `Title.setTitle(pageTitle(…))` | document title (non-signal API)                 |
| `afterRenderEffect`            | `App` last navigation → `main.focus()`                     | DOM focus (non-signal API)                      |
| `afterNextRender` (in handler) | `CartPage.remove` → focus target                           | DOM focus, once per removal command             |

### Parsing boundaries

No new untrusted input. Route titles are static strings, and the page name comes from already-parsed `Product` data.

### angular-developer references consulted

- **define-routes (Page Titles):** static route `title`, and the reason for not using a custom `TitleStrategy` here (D3).
- **effects:** `effect` only to sync outward; `afterRenderEffect` for DOM writes (D3, D4).
- **queries-and-projection:** `viewChild` / `viewChildren`, `nativeElement` only for `focus()` (D4, D10).
- **router-lifecycle:** title update timing after `NavigationEnd` (D3), and using the existing navigation signal rather than an events subscription (D4).
- **angular-aria:** confirmed that none of its patterns apply here (Non-Goals).

## Risks / Trade-offs

- [axe finds only part of the failures] → The VoiceOver script and the statement's manual verdicts cover the rest. The statement claims conformance only for verified criteria.
- [A Material update changes markup or tokens and breaks the gate] → The gate names the cell and rule. The fix stays local to `theme.scss` or a template.
- [Focus moving to `<main>` on every navigation surprises mouse users] → `main:focus` has no outline, and programmatic focus doesn't scroll when the page is already at the top (router scroll position restoration is unchanged).
- [Cart quantity and total announce twice in a row] → Both are polite and short. The VoiceOver pass confirms they are acceptable, or the quantity region becomes the only one.
- [Gate runtime grows with 44 cells] → Each cell is one page load plus one axe run (about 1 s each). If it grows too slow, parallel workers stay at the Playwright default.
- [Google Fonts aborted in e2e hides icon-glyph issues] → Icons are `aria-hidden`. Their visual contrast is checked in the manual pass.

## Migration Plan

There's no data or API migration. The removed snackbar is the only user-visible break. Its replacement ships in the same change, and the e2e test for "View cart" is updated with it. Rollback is reverting the change.
