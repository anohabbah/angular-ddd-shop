# Proposal

## Why

Only the app shell uses Angular Material. The Catalog and cart screens are plain HTML on browser defaults, so they look and behave differently from the shell. Their placeholder color (`#eee`) also ignores the dark color scheme. The UI is also tested by component specs that query markup (`li`, `h2`, `output`, `input[type=search]`). Restyling with Material would break those specs even when behavior does not change. Testing UI behavior end-to-end, through roles, labels and text, lets the markup change without the tests changing.

## What Changes

- **Testing policy (project-wide):** UI behavior is tested end-to-end with Playwright in `e2e/`, against a product source stubbed with `page.route`. Domain function, application store and infrastructure adapter tests stay as Vitest unit tests. The Testing section of CLAUDE.md and the `tasks` rules in `openspec/config.yaml` are updated to match.
- **Port UI specs to e2e, then delete them:** the behavior covered by the component specs of `product-list`, `product-detail`, `price-tag`, `product-thumbnail`, `cart-page` and `cart-link` moves to e2e tests. So do the two `app.spec.ts` tests that read the cart link text. The component specs are then deleted. **BREAKING** for anyone relying on those spec files.
- **Restyle with Material:**
  - product list: search in `mat-form-field`, products as `mat-card`s, loading as `mat-progress-bar`, retry as `mat-button`.
  - product detail: back and add-to-cart as Material buttons.
  - cart page: lines as a list separated by `mat-divider`; increase, decrease and remove as `mat-icon-button`s.
  - cart link: `mat-icon-button` with a `matBadge`.
  - thumbnail placeholder: uses a Material surface token, so it follows the color scheme.
- **Icons:** Material Symbols (Outlined) font loaded in `src/index.html`, set as the default font set through `MAT_ICON_DEFAULT_OPTIONS` in `app.config.ts`.
- **Tailwind:** `@theme` in `src/styles/tailwind.css` also aliases Material corner, elevation and type-scale tokens. Libs style with utilities in templates, never `@apply`, so no lib stylesheet references the app's CSS.
- **New UX:**
  - **Add-to-cart confirmation:** a snackbar "Added to cart" with a "View cart" action that leads to the cart page.
  - **Item count badge:** the cart link shows the item count as a badge, hidden when the Cart is empty. The link's accessible name always states the item count.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `shopping-cart`: adds the add-to-cart confirmation with its "View cart" action, and changes how the cart link presents the item count: a badge, hidden at 0, with the count in the link's accessible name.

## Impact

- **Bounded contexts:** catalog (`libs/catalog/ui`), cart (`libs/cart/ui`, `libs/cart/ui-header`). The app changes `src/index.html`, `src/app/app.config.ts`, `src/styles/tailwind.css` and `src/app/app.spec.ts`. No domain, application or infrastructure code changes.
- **Nx libs:** none new. `e2e/` (existing Playwright project, no tests yet) gets its first tests and stub fixtures. It imports nothing from `libs/`.
- **Glossary:** no new domain terms. "Item count" and "Cart" are reused.
- **Source state:** no new writable signal. Whether the badge is hidden derives from the item count. The confirmation is an imperative `MatSnackBar` call made in the add-to-cart click handler.
- **Dependencies:** no new packages; `@angular/material`, `@angular/cdk` and `@playwright/test` are already installed. Material Symbols is fetched from Google Fonts at runtime.
- **CI and test time:** `pnpm nx e2e e2e` becomes part of verification. It needs Playwright browsers installed.
