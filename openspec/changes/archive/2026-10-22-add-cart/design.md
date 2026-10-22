# Design

## Context

The Catalog context is in place (`libs/catalog/{domain,application,infrastructure,ui,testing}`) along with a shared kernel `libs/shared/domain` holding `Money`. `eslint.config.mjs` enforces the CLAUDE.md tag rules. Today `scope:catalog` may depend only on `scope:catalog` and `scope:shared`, and there is no `scope:cart`. Facts in the current code that shape this design:

- `ProductId` is defined in `libs/catalog/domain/src/lib/product.ts`. It is imported by 8 files across the catalog libs.
- Money is formatted by a module-private `formatMoney` inside `libs/catalog/ui/src/lib/price-tag/price-tag.ts` (`Intl.NumberFormat('en-US', currency)` on `amountMinor / 100`).
- `CatalogStore` is `@Injectable()` and provided on the catalog route. The app shell (`src/app/app.html`) is a bare `<router-outlet />`.
- The type rules forbid `type:ui -> type:ui`, so one context's ui lib can't reuse another's components.

Motivation is in proposal.md (Why). Behavior is in `specs/shopping-cart/spec.md`.

## Goals / Non-Goals

**Goals:**

- The one cross-context edge is explicit, one-way (catalog -> cart), lint-enforced and recorded in an ADR.
- Cart domain is pure and holds every cart rule. The store only holds the lines signal and delegates to domain functions.
- One writable signal: `CartStore.lines`.

**Non-Goals:**

- No storage port, adapter, or cart `testing` lib (no persistence in scope).
- No shared ui lib. The type rules would forbid using it anyway (see D5).
- No change to catalog behavior or to the `product-catalog` spec.

## Decisions

### D1. Context map: catalog -> cart, scope-wide, one-way

```
 src/ (type:app) --+------------------+---------------------------+
                   v                  v                           v
           catalog-ui ---------> cart-application          cart-ui
             |   |   \                 |                    |     \
             |   |    +----------------|--------------------|---+  \
             v   v                     v                    v   |   v
 catalog-application   catalog-domain ---> cart-domain <----+   |  cart-application
             |              |                 |                  |
             +--> catalog-domain              v                  |
                            +---------> shared-domain <----------+
```

| Piece                                                                                                                                              | Lib                                                    | Edges                                        |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------- |
| `ProductId`, `formatMoney` (moved in), `Money`                                                                                                     | `libs/shared/domain`                                   | none                                         |
| `CartItem`, `CartLine`, `Quantity` schemas; `addItem`, `increaseQuantity`, `decreaseQuantity`, `removeLine`, `lineTotal`, `cartTotal`, `itemCount` | `libs/cart/domain` (`@ngsample/cart-domain`)           | domain -> domain; cart -> shared             |
| `CartStore`                                                                                                                                        | `libs/cart/application` (`@ngsample/cart-application`) | application -> domain                        |
| `CartPage`, `cartRoutes` (lazy-loaded)                                                                                                             | `libs/cart/ui` (`@ngsample/cart-ui`)                   | ui -> application, domain                    |
| `CartLink` (imported statically by the app shell)                                                                                                  | `libs/cart/ui-header` (`@ngsample/cart-ui-header`)     | ui -> application                            |
| `toCartItem(product)`                                                                                                                              | `libs/catalog/domain`                                  | domain -> domain; **catalog -> cart (new)**  |
| "Add to cart" in `ProductDetail`                                                                                                                   | `libs/catalog/ui`                                      | ui -> application; **catalog -> cart (new)** |
| `/cart` lazy route, `CartLink` in the shell                                                                                                        | `src/app`                                              | app -> ui                                    |

Lint changes: add `{ sourceTag: 'scope:cart', onlyDependOnLibsWithTags: ['scope:cart', 'scope:shared'] }` and add `'scope:cart'` to `scope:catalog`'s list. The type rules are unchanged, so every edge above is allowed on the type axis. Only the scope axis is relaxed, and only in one direction. Cart importing catalog stays a lint error.

- _Alternative: relax only `catalog-ui` (a project-name constraint) and keep `toCartItem` in ui._ That's a narrower edge, but the mapping would then need a TestBed or component test instead of plain Vitest, and lint would need a per-project rule. Rejected: the scope-wide rule is simpler to state in CLAUDE.md and the ADR.
- _Alternative: cart depends on catalog (cart lines hold `Product`)._ The "Add to cart" button would still need catalog -> cart, which makes the dependency mutual. Rejected in exploration.
- _Alternative: a `Basket` port in shared and binding glue._ No layer is allowed to bind a catalog port to `CartStore` (`app -> ui, infrastructure` only; `infrastructure -> domain` only). Rejected.

### D2. Cart domain (zod/mini) and invariants

- `Quantity = z.int().check(z.gte(1))`.
- `CartItem = z.object({ productId: ProductId, title: z.string(), thumbnail: z.string(), unitPrice: Money })`. This is the snapshot. Cart never sees `Product`.
- `CartLine = z.object({ item: CartItem, quantity: Quantity })`. The Cart is `readonly CartLine[]`, kept in first-added order.
- `addItem(lines, item)`: if a line with `item.productId` exists, return lines with that line's `quantity + 1` and the **original** `item` (spec: Adding a product already in the Cart). Otherwise append `{ item, quantity: 1 }`. If `lines` is non-empty and `item.unitPrice.currency` differs from the first line's currency, it throws `CurrencyMismatchError` (spec: Single currency).
- `increaseQuantity(lines, productId)`, `decreaseQuantity(lines, productId)` (the quantity never goes below 1, so a decrease at 1 returns the lines unchanged), `removeLine(lines, productId)`.
- `lineTotal(line) = { ...unitPrice, amountMinor: unitPrice.amountMinor * quantity }`. This is integer math in minor units, so no rounding is needed (894 x 3 = 2682).
- `cartTotal(lines): Money | undefined`, where `undefined` means an empty Cart. It sums `lineTotal`s and relies on the single-currency invariant.
- `itemCount(lines) = sum of quantities`.

All functions are pure and return new arrays, which keeps the store's `update()` calls one-liners and lets plain Vitest cover every spec rule.

- _Alternative for currency mismatch: return the lines unchanged without throwing._ That hides a programming error, because every product is USD today and a mismatch can't happen through the UI. Throwing inside the command means `lines` is never set, so the Cart stays unchanged (as the spec requires). The global error listener reports it.
- _Alternative: a `Map<ProductId, CartLine>`._ Plain arrays keep insertion order explicit and are friendlier to signals and `@for`. Rejected.

**Parse boundaries:** none are new. A `CartItem` is built only from an already-parsed `Product` (by `toCartItem` in catalog domain). There is no storage, URL or form input. Domain and application trust typed data, so `CartItem` is a schema for the type and invariants, but nothing calls `.parse` at runtime.

### D3. `toCartItem` in catalog domain

`toCartItem(product: Product): CartItem = { productId: product.id, title, thumbnail, unitPrice: finalPrice(product) }`. This is the anti-corruption translation, owned by the upstream side (catalog), which is the only side that knows both models. It's a pure function, tested with the spec's 9.99 USD / 10.48% -> 8.94 USD example.

### D4. Signals: source vs derived

| Signal                       | Kind                                                                   | Why                                                                                                                                                                                                                    |
| ---------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CartStore.lines`            | **writable** `signal<readonly CartLine[]>([])`, exposed `asReadonly()` | The only source state: what the Shopper chose. Nothing upstream to derive it from. Written only by the `add`, `increase`, `decrease` and `remove` commands, which call the matching domain function inside `update()`. |
| `CartStore.total`            | `computed(() => cartTotal(lines()))`                                   | Domain derivation.                                                                                                                                                                                                     |
| `CartStore.itemCount`        | `computed(() => itemCount(lines()))`                                   | Domain derivation.                                                                                                                                                                                                     |
| `CartPage` line totals       | `lineTotal(line)` called per line                                      | Pure and per row. A template `@let` or a small `computed` map over `lines()`, with no extra state.                                                                                                                     |
| Formatted money in templates | `formatMoney(...)` inside `computed` or `@let`                         | Pure.                                                                                                                                                                                                                  |

There's no `linkedSignal`, `resource` or `effect()` in this change: nothing is user-overridable, async, or synced outward.

`CartStore` is `@Injectable({ providedIn: 'root' })`. The header link, the catalog product detail and the cart page must all share one instance for the whole session (spec: Cart lasts for the session). A route-level provider like `CatalogStore`'s would create separate instances. Being root-scoped also gives "a reload starts empty" for free.

### D5. Shared kernel additions: `ProductId` and `formatMoney`

- `ProductId` moves to `libs/shared/domain`, because `CartItem` needs it and cart can't import catalog. Catalog files switch their import to `@ngsample/shared-domain`. `parseProductId` stays in catalog domain, since only the catalog route parses it.
- `formatMoney(money): string` moves from `PriceTag` to `libs/shared/domain`. A shared ui lib isn't an option: `type:ui -> type:ui` is forbidden, so `cart-ui` couldn't import it. `Intl.NumberFormat` is plain JS, so domain's ban on `@angular/*` and `rxjs` still holds. It is presentation-flavored, but it is the one Money rendering rule both contexts must agree on.
- _Alternative: Angular's `CurrencyPipe` / `formatCurrency` in each ui._ That duplicates the minor-units conversion (`/ 100`) in two places. Rejected.

### D6. UI and routing

- `ProductDetail` (catalog ui) injects `CartStore`, and its "Add to cart" button calls `cart.add(toCartItem(product))` from the click handler. There's no local state.
- `CartPage` (cart ui, route `''` in `cartRoutes`): `@for` over `lines()` tracked by `item.productId`. Each row shows a title `routerLink` to `['/catalog', productId]` (a URL string, so no catalog import), a `NgOptimizedImage` thumbnail, the unit price, quantity "-" (disabled when it's 1) / "+", the line total, and "Remove". The page shows the Cart total, or "Your cart is empty" when `lines()` is empty.
- `CartLink` (`libs/cart/ui-header`, its own lib so the app shell can import it statically while `cart-ui` stays lazy; `@nx/enforce-module-boundaries` forbids importing a lazy-loaded lib statically): `<a routerLink="/cart">Cart ({{ itemCount() }})</a>` with an accessible name that includes the count.
- `src/app`: `appRoutes` gets `{ path: 'cart', loadChildren: () => import('@ngsample/cart-ui').then(m => m.cartRoutes) }`. `App` imports `CartLink` from `@ngsample/cart-ui-header`, and `app.html` becomes `<header><app-cart-link /></header><router-outlet />`.

### D7. Recording the exception

- ADR (via the `domain-modeling` skill): "Catalog may depend on Cart", covering the context, the rejected options from D1, and the consequences (cart must stay ignorant of catalog; any new cross-context edge needs its own ADR).
- CLAUDE.md, Allowed dependencies: change `scope:<context> -> same scope, scope:shared` to note the recorded exception `scope:catalog -> scope:cart` and point to the ADR.
- GLOSSARY.md: the new Cart section, and `Product id` moves to Shared kernel.

### Angular skill references consulted

- `signals-overview`: `computed` for derivations, and `asReadonly()` for exposing store state (D4).
- `creating-services`: `providedIn: 'root'` for the session-wide singleton (D4).
- `loading-strategies`: `loadChildren` for `/cart` (D6).
- `navigate-to-routes`: `routerLink` with an array path to the product detail (D6).
- `pipes`: it prefers plain formatting functions shared between code and templates, which led to `formatMoney` being a function, not a pipe (D5).

## Risks / Trade-offs

- [The scope relaxation also permits `catalog-application`/`catalog-infrastructure` -> cart, not just the two intended edges] -> Accepted for simplicity. The ADR names the intended edges, and review checks for new ones. Tighten to a per-project constraint if misuse appears.
- [The app shell needs `CartLink` eagerly while `/cart` is lazy, and lint forbids static imports of a lazy-loaded lib] -> `CartLink` lives in its own lib, `libs/cart/ui-header`. Found during apply; it replaces the earlier plan to accept `cart-ui` in the main bundle. The alternatives were an eager `/cart` route (against "lazy-loaded routes per context") or an `eslint-disable`, and both were rejected.
- [Snapshot prices can go stale within a session] -> Intended per the spec. Refreshing is out of scope.
- [`formatMoney` in a domain lib blurs domain and presentation] -> Kept tiny and pure. Revisit if a shared presentation layer becomes legal.
- [The currency-mismatch path is unreachable through the UI today] -> Covered at the domain seam only.

## Migration Plan

No deployed state or persistence, so nothing to migrate. Rollback means reverting the change. The `ProductId` and `formatMoney` moves are covered by the existing catalog tests staying green.
