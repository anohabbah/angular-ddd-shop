# Proposal

## Why

The workspace has no features yet, so its DDD layering, zod/mini boundaries and declarative-signal rules have never been tried on real code. A product catalog backed by the public dummyjson.com API is the smallest feature that needs every layer (domain, application, infrastructure, ui), a shared kernel, an HTTP boundary and a URL boundary. It also prepares the ground for the follow-up `add-cart` change.

## What Changes

- New **Catalog** bounded context: a browsable, searchable list of products and a product detail page, read from dummyjson.com (`GET /products`, `GET /products/search?q=`, `GET /products/{id}`).
- New **shared kernel** domain lib with the `Money` value object (non-negative amount in minor units, plus a currency). `Product` prices use it, and the cart will reuse it.
- Products show their **list price** and **final price**, which is the list price minus the product's discount percentage.
- Searching uses the **search term** the user types, debounced, so the product list follows the term without sending a request on every keystroke.
- Lazy-loaded `/catalog` and `/catalog/:productId` routes. The empty path redirects to `/catalog`.
- Tooling prerequisite: replace oxlint/oxfmt with ESLint/Prettier, and enforce the `scope:*` / `type:*` tag rules in CLAUDE.md in lint (today oxlint has no module-boundary rule, so the tags enforce nothing). The domain libs are also banned from importing Angular, RxJS and HTTP.
- New `GLOSSARY.md` with the catalog terms.

### Bounded contexts and Nx libs

| Lib                           | Generator             | Tags                                   |
| ----------------------------- | --------------------- | -------------------------------------- |
| `libs/shared/domain`          | `@nx/js:library`      | `scope:shared`, `type:domain`          |
| `libs/catalog/domain`         | `@nx/js:library`      | `scope:catalog`, `type:domain`         |
| `libs/catalog/application`    | `@nx/angular:library` | `scope:catalog`, `type:application`    |
| `libs/catalog/infrastructure` | `@nx/angular:library` | `scope:catalog`, `type:infrastructure` |
| `libs/catalog/ui`             | `@nx/angular:library` | `scope:catalog`, `type:ui`             |

### New GLOSSARY.md terms

Catalog, Product, Product id, Product source, Money, List price, Discount, Final price, Search term, Settled search term.

### Minimal source state

- **Search term**: the raw text the user has typed into the catalog search box. This is the only writable signal.
- **Product id**: comes from the URL (`:productId`), so the router owns it. It is not a writable signal in our code.

Everything else is derived: the debounced search term, the product list and the product detail (async, loaded from those inputs), and final prices (from domain functions).

### Out of scope

The cart, the checkout form, storage persistence, and communication between contexts. These belong to `add-cart`. Pagination and category filtering are also out of scope: the list shows the first page the API returns.

## Capabilities

### New Capabilities

- `product-catalog`: browsing, searching and viewing the products offered for sale, including how their prices are presented.

### Modified Capabilities

None. There are no existing specs.

## Impact

- **New code**: the five Nx libs above; `src/app/app.routes.ts` (lazy catalog route) and `src/app/app.config.ts` (`provideHttpClient`, catalog infrastructure providers).
- **External API**: runtime dependency on `https://dummyjson.com`, which is public and needs no auth.
- **Dependencies**: a lint setup that can run `@nx/enforce-module-boundaries`, most likely `eslint` + `@nx/eslint` + `@nx/eslint-plugin` pinned to the Nx version (23.3.0) so installs still pass the pnpm release-age policy.
- **Docs**: new `GLOSSARY.md`.
