# Proposal

## Why

The shop should conform to WCAG 2.2 level AA and say so in a conformance statement. A live audit (axe-core 4.10, keyboard, focus, reflow and target-size probes across every page, state, color scheme and width) found failures on every page. Every page is titled "ngsample" (2.4.2). The Catalog has no level-one heading. The add-to-cart snackbar disappears after 4 s (2.2.1), keeps its action focusable inside `aria-hidden` (4.1.2) and has an action contrast of 3.24:1 (1.4.3). Cart controls don't name their product (2.4.6), and focus is lost after Remove (2.4.3). Quantity, search-result and price meaning aren't exposed or announced (1.3.1, 4.1.3). Focus rings on icon buttons and nav items are too faint (1.4.11). Nothing stops these from coming back once fixed.

## What Changes

- **Conformance target and gate (new):** WCAG 2.2 AA for every page in every state, in light and dark color schemes, on wide, narrow and 320 CSS px viewports. An automated axe scan (A and AA tags up to 2.2) in `pnpm nx e2e e2e` fails the build on any violation in that matrix.
- **Conformance statement (new):** `docs/accessibility/conformance.md` contains the claim components WCAG requires, a verdict and note for each of the 55 A/AA success criteria, the pages and states tested, and the assistive-technology pairs tested. The tested pair is VoiceOver + Safari on macOS; NVDA and mobile screen readers are listed as not tested. `docs/accessibility/voiceover-script.md` holds the manual script the maintainer runs.
- **App shell:**
  - each page gets a title naming it and the shop
  - after an in-app navigation, focus moves to the new page's main content
  - the sticky header never covers the focused element
  - one labelled navigation landmark instead of two nested ones
  - focus indicators that meet 3:1 contrast in both color schemes
- **Product catalog:**
  - the Catalog page has a level-one heading
  - the number of matching products is announced as a status message
  - prices say in text which is the Final price and which is the List price
  - thumbnails next to their product's title are decorative, so link names don't repeat the title
  - product-detail not-found and error states have a level-one heading
- **Shopping cart:**
  - increase, decrease and remove buttons name their product
  - quantity is labelled per line, and quantity and Cart total changes are announced
  - after a line is removed, focus moves to the next line's Remove button, else the previous line's, else the empty-cart message
- **Add-to-cart confirmation (BREAKING for the current behavior):** the Material snackbar is removed. The product detail instead shows, beside "Add to cart", a status message with the product's Quantity in the Cart and a "View cart" link. It stays visible while the product is in the Cart and never disappears on its own.
- **Project rules:** the CLAUDE.md Testing section says that the axe gate runs in e2e, and that the conformance statement is re-checked by any change touching a `ui` lib or the app shell.
- **Dependencies:** adds `@axe-core/playwright` (dev). `@angular/aria`, already added to `package.json`, is kept but not used by this change.

## Capabilities

### New Capabilities

- `accessibility`: the cross-cutting accessibility contract. It covers the conformance target and the page × state × color scheme × width matrix it applies to, the automated gate, page titles, focus visibility and contrast, focus not obscured, reflow and text spacing, target size, and the conformance statement and when it is re-checked.

### Modified Capabilities

- `app-shell`: adds focus on the main content after in-app navigation, and one navigation landmark named "Main".
- `product-catalog`: adds the Price display in text, decorative thumbnails, the "Catalog" heading in every product list state, the announced product list outcome, and a level-one heading in every product detail state.
- `shopping-cart`: Add-to-cart confirmation becomes a persistent status message "Quantity in cart: N" with a "View cart" link. Adds product-named Cart line controls, announced quantity and Cart total, and focus placement after removing a Cart line.

## Impact

- **Bounded contexts:**
  - catalog: `libs/catalog/ui` (product list, product detail, price tag, thumbnail)
  - cart: `libs/cart/domain` (two new pure functions: a product's Quantity in the Cart, and which Cart line receives focus after a removal), `libs/cart/ui` (cart page, cart routes)
  - shared kernel: `libs/shared/domain` (one new pure function, the page-title format)
  - app shell: `src/app/app.*`, `src/styles/theme.scss`
  - No application or infrastructure code changes, and no new Nx libs. Catalog ui reading cart domain stays within the existing `scope:catalog → scope:cart` exception (ADR 0001).
- **Glossary:** no new domain terms. Quantity, Cart, List price and Final price are reused in the visible and announced text.
- **Source state:** no new writable signal. The in-Cart status is derived from the Cart lines and the product id. The result count is derived from the product list. Page titles and focus moves are synced outward to the DOM and the document title.
- **Tests:**
  - new e2e accessibility suite (axe matrix plus keyboard and focus behaviors)
  - existing e2e tests that assert the snackbar or the absence of a heading in the detail error state are updated
  - three new Vitest slices: two in cart domain, one in shared domain
- **Docs:** `docs/accessibility/conformance.md`, `docs/accessibility/voiceover-script.md`, and the CLAUDE.md Testing section.
- **Manual step:** a VoiceOver + Safari pass by the maintainer, following the script, before the statement can be dated and claim conformance.
