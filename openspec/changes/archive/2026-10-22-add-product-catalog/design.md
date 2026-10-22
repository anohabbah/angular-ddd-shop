# Design

## Context

This is a greenfield workspace: no libs, empty `appRoutes`, no `provideHttpClient`. Lint was oxlint and formatting oxfmt. oxlint has no module-boundary rule, so `scope:*` / `type:*` tags would enforce nothing. The motivation is in proposal.md (Why) and the behavior is in `specs/product-catalog/spec.md`.

The dummyjson.com shapes were checked against the live API:

- `GET /products?limit=30&select=...` and `GET /products/search?q=<term>&limit=30&select=...` both return `{ products: Dto[], total, skip, limit }`.
- `GET /products/{id}` returns `Dto`, or 404 when the id is unknown.
- `Dto` fields used: `id`, `title`, `description`, `category`, `thumbnail`, `price` (decimal USD, e.g. `9.99`), `discountPercentage` (e.g. `10.48`).

## Goals / Non-Goals

**Goals:**

- Every piece sits in its layer, and the lint check enforces the CLAUDE.md dependency rules.
- One parse boundary for HTTP and one for the URL. Domain and application trust typed data.
- One writable signal (search term). Everything else is derived.

**Non-Goals:**

- No shared ui lib yet. The price display lives in catalog ui until `add-cart` needs it too.
- No API base-URL configuration, retries or caching.
- No e2e tests. Unit and component tests cover the specs.

## Decisions

### D1. Lib placement and allowed dependencies

```
 src/ (type:app) ----+---------------------------+
                     v                           v
   catalog-ui (scope:catalog,type:ui)    catalog-infrastructure (scope:catalog,type:infrastructure)
     |        \                                  |
     v         v                                 |
   catalog-application (type:application)       |
     |                                           |
     v                                           v
   catalog-domain (scope:catalog,type:domain) <--+
     |
     v
   shared-domain (scope:shared,type:domain)
```

| Piece                                                                                                                                                    | Lib                                                      | Edges (all allowed by CLAUDE.md)                                                         |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `Money`                                                                                                                                                  | `libs/shared/domain` (`@ngsample/shared-domain`)         | none                                                                                     |
| `Product`, `ProductId`, `Discount` schemas; `applyDiscount`, `finalPrice`, `priceDisplay`, `normalizeSearchTerm`, `parseProductId`; `ProductSource` port | `libs/catalog/domain` (`@ngsample/catalog-domain`)       | domain -> domain; catalog -> shared                                                      |
| `CatalogStore`, `productDetail()`                                                                                                                        | `libs/catalog/application`                               | application -> domain                                                                    |
| `DummyJsonProductSource`, `provideCatalogInfrastructure()`                                                                                               | `libs/catalog/infrastructure`                            | infrastructure -> domain                                                                 |
| `ProductList`, `ProductDetail`, `PriceTag`, `catalogRoutes`                                                                                              | `libs/catalog/ui`                                        | ui -> application, domain                                                                |
| `FakeProductSource` (test double, spec files only)                                                                                                       | `libs/catalog/testing` (`scope:catalog`, `type:testing`) | testing -> domain; application/ui/infrastructure -> testing only from `*.spec.ts` (lint) |
| lazy route, providers                                                                                                                                    | `src/app`                                                | app -> ui, infrastructure                                                                |

### D2. The port is an abstract class in domain

`ProductSource` is an `abstract class` with Promise-returning methods:

- `search(term: string, abortSignal: AbortSignal): Promise<readonly Product[]>`, where an empty term means all products.
- `findById(id: ProductId, abortSignal: AbortSignal): Promise<Product | undefined>`, where `undefined` means the source has no product with that id.

An abstract class is a valid Angular DI token without importing `@angular/core`, so domain stays framework-free. Infrastructure provides `{ provide: ProductSource, useClass: DummyJsonProductSource }`, and application does `inject(ProductSource)`.

- _Alternative: an `InjectionToken`._ Domain can't create it (that needs an Angular import). Application could, but infrastructure isn't allowed to import application, so the token would have no provider. Rejected.

### D3. Async reads use `resource()` in application, not `httpResource()`

CLAUDE.md says "httpResource for HTTP reads", but `httpResource` returns an Angular `HttpResourceRef` and builds URLs. Neither can sit behind a framework-free domain port. Infrastructure can't be imported by application either. The layering rules win:

- application: `resource({ params, loader: ({ params, abortSignal }) => source.search(params.term, abortSignal) })`
- infrastructure: `HttpClient.get` + `firstValueFrom`, then `Schema.parse` in the adapter. CLAUDE.md explicitly allows this form.

- _Alternative: `httpResource` in application with URLs there._ That puts HTTP knowledge in application and skips the port. Rejected.
- _Alternative: a port returning an `HttpResourceRef` factory._ That would mean an Angular import in domain. Rejected.
- **Resolved in review (8.4):** CLAUDE.md now says HTTP behind a port is `Schema.parse` in the adapter plus `resource()` in the store, and `httpResource` is only for reads with no port. It also records the abstract-class port (D2), the input-keyed factory (D6) and the per-context `scope:` lint constraint.

`firstValueFrom` bridges a one-shot HTTP call inside the adapter. It is not a stream the app subscribes to, so the "RxJS only for time" rule still holds. Cancellation is covered in D9.

### D4. Domain types (zod/mini) and parse boundaries

- `Money = z.object({ amountMinor: z.int().check(z.nonnegative()), currency: z.string().check(z.length(3)) })`. Minor units avoid float drift: `9.99` becomes `999`.
- `applyDiscount(money, discount): Money` = `Math.round(amountMinor * (1 - discount / 100))`. Worked example from the spec: 999 x 0.8952 = 894.30, rounded to 894.
- `ProductId = z.int().check(z.positive())`, `Discount = z.number().check(z.gte(0), z.lte(100))`.
- `Product = z.object({ id: ProductId, title, description, category, thumbnail, listPrice: Money, discount: Discount })`.
- `priceDisplay(product) -> { final: Money, list?: Money }`. `list` is present only when it differs from `final`. This is the spec's "struck-through only when different" rule, kept as a pure function.

| Untrusted input          | Boundary                    | How                                                                                                                                                                                                  |
| ------------------------ | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| dummyjson JSON           | `DummyJsonProductSource`    | `DummyProductDto` / `DummyProductPageDto` schemas (infra-local, wire shape), mapped to a domain object, then `Product.parse` checks the invariants. A `ZodError` becomes the resource's error state. |
| `:productId` URL segment | `ProductDetail` route input | `input(undefined, { transform: parseProductId })`. `parseProductId(raw)` accepts only `/^[1-9]\d*$/` and returns `ProductId \| undefined`.                                                           |
| Search box text          | none needed                 | Any string is a valid search term. `normalizeSearchTerm` trims it.                                                                                                                                   |

404 on `findById` maps to `undefined`. Any other HTTP error propagates and becomes the error state.

### D5. Signals: source vs derived

| Signal                             | Kind                                                                                                                                 | Why                                                                                                                                     |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `CatalogStore.searchTerm`          | **writable** `signal('')`                                                                                                            | User input. Nothing upstream to derive it from. Set only by the `setSearchTerm()` command from the input event.                         |
| `settledSearchTerm`                | `toSignal(toObservable(searchTerm).pipe(debounceTime(300), map(normalizeSearchTerm), distinctUntilChanged()), { initialValue: '' })` | Time-based. This is the one sanctioned RxJS use. Normalizing before `distinctUntilChanged` covers the spec's "unchanged term" scenario. |
| `products`                         | `resource()` on `settledSearchTerm`                                                                                                  | Async from state (D3).                                                                                                                  |
| `hasNoMatches`                     | `computed`                                                                                                                           | `products.hasValue() && products.value().length === 0`. Too trivial to need a domain function.                                          |
| `ProductDetail.productId`          | route `input()` with transform                                                                                                       | Owned by the router via `withComponentInputBinding()`.                                                                                  |
| `productDetail(productId).product` | `resource()`. `params` returns `undefined` for an invalid id, so the resource stays `idle` and nothing is requested.                 | Async from state.                                                                                                                       |
| `productDetail(...).notFound`      | `computed`                                                                                                                           | Invalid id, or a loaded value of `undefined`.                                                                                           |
| `PriceTag.tag`                     | `computed(() => priceDisplay(this.product()))`                                                                                       | Domain derivation.                                                                                                                      |

There are no `linkedSignal` and no `effect()` in this change: nothing is user-overridable and nothing syncs outward.

### D6. Product detail is a factory, not an injectable store

The detail depends on a component input. If an injectable store held `productId` as a writable signal, the component would have to copy the input into it, which is exactly the syncing the rules forbid. Instead, application exports `productDetail(productId: () => ProductId | undefined)`. It calls `inject(ProductSource)`, so it runs in an injection context (a component field initializer), and it returns `{ product, notFound }`.

- _Alternative: read the route params from `ActivatedRoute.paramMap` in a store._ That is non-time RxJS and subscribe-style. Rejected.
- _Alternative: a router resolver._ It loses loading and error states and moves parsing out of the route input. Rejected.

`CatalogStore` is `@Injectable()` and is provided on the parent `catalog` route (`providers: [CatalogStore]`), so the search term survives a list -> detail -> back navigation.

### D7. Routing and composition

- `catalogRoutes` (ui): `{ path: '', providers: [CatalogStore], children: [{ path: '', component: ProductList }, { path: ':productId', component: ProductDetail }] }`.
- `appRoutes`: `{ path: '', pathMatch: 'full', redirectTo: 'catalog' }`, `{ path: 'catalog', loadChildren: () => import('@ngsample/catalog-ui').then(m => m.catalogRoutes) }`.
- `appConfig`: `provideRouter(appRoutes, withComponentInputBinding())`, `provideHttpClient(withFetch())`, `provideCatalogInfrastructure()`.
- The money display uses `Intl.NumberFormat` with `currency`, applied to `amountMinor / 100` inside `PriceTag`.

### D8. Lint and format: ESLint + Prettier, boundaries in `lint`

Replace oxlint/oxfmt with ESLint (inferred `lint` target via `@nx/eslint/plugin`) and Prettier (`.prettierrc`, keeping oxfmt's `singleQuote` and its 100-column width so existing files don't churn). One root `eslint.config.mjs`:

- Nx flat configs `base`, `typescript`, `javascript`, `angular`, `angular-template` (`eslint-config-prettier` is picked up automatically).
- `@nx/enforce-module-boundaries` with `depConstraints` copied from CLAUDE.md (type and scope rules, `type:app -> type:ui, type:infrastructure`), plus `bannedExternalImports: ['@angular/*', 'rxjs', 'rxjs/*']` on `type:domain`.
- `no-restricted-imports` banning the bare `zod` path, so only `zod/mini` is allowed.
- Libs are generated with `--linter=none`: the root config already lints every project through the inferred target.
- Verification: a deliberate bad import (ui -> infrastructure, `@angular/core` in domain, bare `zod`) fails `lint`. Then it gets reverted.

- _Alternative: keep oxlint and add ESLint only for boundaries._ This was the original plan. The user chose a single toolchain instead.
- _Alternative: load `@nx/eslint-plugin` through oxlint `jsPlugins` (alpha)._ Spiked during apply: the plugin loads, but a relative cross-project import that ESLint flags gives no error under oxlint. Rejected.

### D9. Cancellation: `takeUntil(fromEvent(abortSignal, 'abort'))`

Angular 22.2 `HttpClient` has no `AbortSignal` option (checked against `@angular/common/types/http.d.ts`). Each adapter call is therefore `firstValueFrom(http.get(...).pipe(takeUntil(fromEvent(abortSignal, 'abort'))))`. When the signal aborts, `takeUntil` unsubscribes. With `withFetch()` that aborts Angular's internal fetch, so the request really is cancelled.

The aborted promise rejects with RxJS `EmptyError`, not an `AbortError`. That is acceptable because `resource()` only aborts a loader it has already superseded and ignores that loader's outcome, so the error never reaches the error state. This is a deliberate, local exception to "RxJS only for time-based streams": the operators turn a DOM event into an unsubscribe, inside one adapter.

- _Alternative: a hand-written Promise wrapper that unsubscribes and rejects with `abortSignal.reason`._ It has more accurate error semantics but is about 8 lines of glue we own. Not chosen.
- _Alternative: native `fetch` with `{ signal }`._ It loses `HttpClient` and the `HttpTestingController` seam. Rejected.
- _Alternative: no cancellation._ Stale requests would still complete over the network. Rejected.

### Angular skill references consulted

- `resource`: `params` returning `undefined` gives `idle`, and the `abortSignal` is passed through (D3, D5, D6).
- `http-client`: `httpResource` is preferred for reads, which led to the documented exception in D3.
- `inputs`: pure input `transform` (D4).
- `data-resolvers`: `withComponentInputBinding()`, and why we didn't use a resolver (D6).
- `loading-strategies`: `loadChildren` (D7).
- `defining-providers`: `useClass` provider for the port (D2).

## Risks / Trade-offs

- [dummyjson is a public demo API that can change or go down] -> Specs are tested with `HttpTestingController` and fake `ProductSource`s, so the suite doesn't depend on the network. Only manual runs hit the live API.
- [ESLint is slower than oxlint] -> Acceptable at this workspace size; Nx caches `lint` per project.
- [New dev deps vs the pnpm release-age policy] -> Pin `@nx/eslint` and `@nx/eslint-plugin` to `23.3.0`, the same as `nx`.
- [The D3 deviation from "httpResource for HTTP reads"] -> Recorded as a follow-up to clarify CLAUDE.md, not silently ignored.
- [Debounce tests and timing] -> Use Vitest fake timers on the store seam. Expected request terms come from the spec scenarios.
- [An aborted call rejects with `EmptyError` (D9); a future caller outside `resource()` could mistake it for a real failure] -> `ProductSource` is only consumed through `resource()`. If another consumer appears, switch to rejecting with `abortSignal.reason`.
