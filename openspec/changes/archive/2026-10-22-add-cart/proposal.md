# Proposal

## Why

Shoppers can browse and view products, but they can't collect the ones they want to buy. A minimal Cart is the next step toward a shop. It is also the first feature that spans two bounded contexts, so it forces an explicit decision on how contexts depend on each other. Today the lint rules forbid any edge between sibling contexts.

## What Changes

- New **Cart** bounded context. Shoppers add a product from its product detail. A cart page lists the Cart lines (title, thumbnail, unit price, quantity, line total) with quantity +/- and remove, and shows the Cart total. A cart link in the app header shows the number of items.
- Adding a product that is already in the Cart increases that line's quantity by one. The line keeps the snapshot taken when the product was first added (title, thumbnail, unit price).
- The Cart lives in memory only. It is empty after a page reload.
- **Context map: Catalog depends on Cart, one-way.** `scope:catalog` may depend on `scope:cart`. Cart never imports Catalog: it defines its own `CartItem` input, and Catalog translates a `Product` into one. This is a deliberate exception to "contexts depend only on themselves and shared". It is recorded as an ADR and in CLAUDE.md's allowed-dependency list.
- **Shared kernel grows:** `ProductId` moves from catalog domain to `libs/shared/domain`, because both contexts name products by it. `formatMoney` moves out of catalog's `PriceTag` into `libs/shared/domain`, because both contexts display Money and `type:ui` can't import another ui lib. Catalog behavior is unchanged.
- New `/cart` lazy-loaded route. The app shell gains a header with the cart link.

### Bounded contexts and Nx libs

| Lib                     | Generator             | Tags                             |
| ----------------------- | --------------------- | -------------------------------- |
| `libs/cart/domain`      | `@nx/js:library`      | `scope:cart`, `type:domain`      |
| `libs/cart/application` | `@nx/angular:library` | `scope:cart`, `type:application` |
| `libs/cart/ui`          | `@nx/angular:library` | `scope:cart`, `type:ui`          |
| `libs/cart/ui-header`   | `@nx/angular:library` | `scope:cart`, `type:ui`          |

There are no `infrastructure` or `testing` libs: the Cart talks to no external system, so it has no port.

Touched existing libs: `libs/shared/domain` (`ProductId`, `formatMoney`), `libs/catalog/domain` (`toCartItem`), and `libs/catalog/ui` (the "Add to cart" action, plus `PriceTag` using the shared `formatMoney`).

### New GLOSSARY.md terms

Cart, Cart item, Cart line, Quantity, Unit price, Line total, Cart total, Item count. `Product id` moves from the Catalog section to the Shared kernel section.

### Minimal source state

- **Cart lines** (`CartStore.lines`): the products the Shopper has added, each with a quantity. This is the only writable signal. Only the add, change-quantity and remove commands write to it.

Everything else is derived: line totals, the Cart total and the item count come from domain functions over the lines.

### Out of scope

Persistence across reloads, checkout and orders, adding to the cart from the product list, refreshing snapshot prices, and maximum quantities or stock.

## Capabilities

### New Capabilities

- `shopping-cart`: collecting products into a Cart, changing quantities, and seeing line totals, the Cart total and the item count. It also covers the "Add to cart" action shown on the product detail.

### Modified Capabilities

None. The `product-catalog` requirements are unchanged: "Add to cart" is specified in `shopping-cart`, and the `ProductId` and `formatMoney` moves don't change behavior.

## Impact

- **New code**: the four cart libs above; `src/app/app.routes.ts` (lazy `/cart`), and `src/app/app.html` / `app.ts` (header with the cart link).
- **Changed code**: `ProductId` imports across catalog libs (`@ngsample/catalog-domain` becomes `@ngsample/shared-domain`); `PriceTag`; the `ProductDetail` template.
- **Lint**: `eslint.config.mjs` gets a `scope:cart` constraint, and `scope:catalog` is allowed to depend on `scope:cart`.
- **Docs**: `GLOSSARY.md`, a new ADR on the catalog-to-cart dependency, and the CLAUDE.md allowed-dependency list.
- **No new runtime dependencies or external APIs.**
