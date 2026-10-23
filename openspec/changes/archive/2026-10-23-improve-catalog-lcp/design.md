# Design

## Context

See proposal.md (Why) for the baseline trace and its three causes. This design relies on the following facts about the current code:

- `src/index.html` loads `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&display=block`. The production build inlines the stylesheet into the page's critical CSS, so the `@font-face` rule is in the HTML, and the browser fetches the font as soon as any `mat-icon` renders. On the Catalog that is the cart link in the app shell. `MAT_ICON_DEFAULT_OPTIONS` sets `fontSet: 'material-symbols-outlined'` in `app.config.ts`.
- The app renders exactly six icon ligatures: `add`, `add_shopping_cart`, `arrow_back`, `delete`, `remove`, `shopping_cart` (from `grep '<mat-icon>' libs src`).
- `src/index.html` has `<link rel="preconnect" href="https://cdn.dummyjson.com">` for thumbnails, which are no-cors `<img>` requests. Product data comes from `https://dummyjson.com` through `HttpClient` with `withFetch()`. These are CORS requests sent without credentials.
- `DummyJsonProductSource` (`libs/catalog/infrastructure`) sends `GET /products?limit=30`, `GET /products/search?q=…&limit=30` and `GET /products/:id`. It parses each response with the `DummyProductDto` zod/mini schema and maps it to the domain `Product`.
- The e2e fixture (`e2e/src/support/fixtures.ts`) ignores the query strings of both the Google Fonts stylesheet and the product source. It serves the full `material-symbols` package font for every icon request. One e2e test asserts `productSource.requests` is `[]`, which no query change affects.

Measured while writing this design: the subset stylesheet for the six icons points to a 2 kB woff2, against 324 kB for the full font. With `select=` covering the DTO's fields, `GET /products?limit=30` returns 10 kB instead of 44 kB, uncompressed (2.7 kB instead of 7.8 kB gzip). dummyjson honours `select` on the list, search and by-id endpoints.

## Goals / Non-Goals

**Goals:**

- Keep the icon font out of the bandwidth needed by the product request and the LCP thumbnail, without changing how icons look or are announced.
- Have a warm connection to the product API by the time the catalog chunk sends its request.
- Have the adapter ask only for the fields it parses, with the field list kept in step with the DTO schema.

**Non-Goals:**

- No changes to the request chain: routes stay lazy, and nothing is preloaded from `index.html`. That decision comes after re-measuring (proposal.md, Follow-up).
- No domain, application or UI code changes, no new signals, and no new libs.
- No automated LCP gate in this change.

## Decisions

### 1. Subset the Google Fonts icon font with `icon_names`

The stylesheet link becomes:

```
https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&icon_names=add,add_shopping_cart,arrow_back,delete,remove,shopping_cart&display=block
```

Google Fonts requires the names in alphabetical order. An HTML comment next to the link says that a new `<mat-icon>` ligature must be added to this list.

Alternatives considered:

- **Inline SVG per icon**, as the menu button does. This drops the font entirely but touches seven templates and the cart badge button, and it re-opens the accessibility verdicts for icon buttons. Rejected: the user chose subsetting.
- **Self-host a subset** built from the `material-symbols` package, which is already a dev dependency for e2e. That needs a font-subsetting build step for a 2 kB saving over what Google Fonts already serves. Rejected.

`display=block` stays. With a 2 kB font, the blank period is short, and `block` avoids briefly showing the ligature text (for example "shopping_cart"), which is what a sighted user would otherwise see.

### 2. Preconnect to the product API with `crossorigin`

Add `<link rel="preconnect" href="https://dummyjson.com" crossorigin>` next to the existing CDN preconnect.

The `crossorigin` attribute is required. `HttpClient` with `withFetch()` sends CORS requests without credentials, and browsers pool those connections separately from credentialed ones. A preconnect without `crossorigin` would warm a connection the product request can't reuse. The existing `cdn.dummyjson.com` preconnect correctly has no `crossorigin`, because `<img>` requests are no-cors.

The page then has three preconnects (fonts.gstatic.com, cdn.dummyjson.com and dummyjson.com), which stays under the limit of four the trace's insight recommends. The build adds the fonts.gstatic.com preconnect itself when it inlines the font stylesheet.

Alternative considered: `dns-prefetch` alone. It resolves DNS but doesn't set up the TLS connection, which is where most of the 587 ms goes. Rejected.

### 3. `select` is derived from the DTO schema, in the adapter

`DummyJsonProductSource` adds `select` to the query parameters of all three requests. Its value is the comma-joined keys of `DummyProductDto` (`Object.keys(DummyProductDto.shape).join(',')`). The list of fields asked for and the list of fields parsed then come from one source and can't drift apart.

The DTO and the parsing at the boundary don't change. If dummyjson ignored `select`, extra fields would still be stripped by the schema exactly as today. If it dropped a field we need, `Schema.parse` would reject the response, as it does today for a missing title.

Alternatives considered:

- **A hand-written field string.** This duplicates the schema. Rejected for the production code. The _test_, however, states the expected value as a literal from the proposal, so a wrong derivation fails the test instead of passing by construction.
- **Putting the field list in `domain`.** It describes dummyjson's external contract, not the domain, and infrastructure owns it. Rejected.

Layering: only `libs/catalog/infrastructure` changes (`scope:catalog`, `type:infrastructure`). Its only imports stay `@ngsample/catalog/domain` and `@ngsample/shared/domain` (`type:infrastructure → domain`, `scope:catalog → scope:shared`), plus Angular HTTP, RxJS for `untilAborted` and `zod/mini`. All are allowed by CLAUDE.md. `src/index.html` is app composition (`type:app`).

### 4. Test seams

- **Adapter (`ProductSource` via `provideCatalogInfrastructure`, `HttpTestingController`).**
  - One red → green slice per request type: list, search, by id. Each asserts `req.request.params.get('select')` equals the literal `id,title,description,category,thumbnail,price,discountPercentage`.
  - The by-id tests currently call `expectOne('https://dummyjson.com/products/1')`, a string matched against `urlWithParams`. Adding a parameter makes them fail, so the by-id slice also changes them to a predicate on `r.url`, the way the list and search tests already match.
- **No new boundary-parsing slice.** Parsing is unchanged, and the existing "rejects a payload with …" tests still cover it.
- **`index.html` changes are config and exempt from TDD.** They are covered by:
  - the existing e2e suite, which stubs both origins and asserts icons render as glyphs;
  - the accessibility gate, which re-runs because the app shell's document changed;
  - the re-measurement trace.

### Signals and state

None. No writable signal, `computed`, `linkedSignal`, `resource` or `effect` is added or changed. `CatalogStore` keeps reading the port with `resource()`.

### angular-developer references consulted

- `http-client`: `HttpParams` are immutable and `params` accepts a record. Adding `select` to the existing `params` object is enough, with no interceptor.
- `testing-fundamentals`: adapter tests stay on `HttpTestingController` and match requests with a predicate on `url`, so query parameters are asserted separately and don't make the match brittle.
- `loading-strategies`: confirms keeping lazy routes is a choice deferred to the follow-up, not changed here.

## Risks / Trade-offs

- **[A new icon missing from `icon_names` renders as ligature text in production, while e2e still passes because the fixture serves the full font]** → Mitigation:
  - a comment next to the link;
  - an implementation task that greps the `<mat-icon>` ligatures and checks each one is in the list.
  - A guard that fails automatically is left out to keep this change minimal; it could be added if the icon set grows.
- **[The 2.5 s target is not met by this change; the estimated floor is about 4.2 s]** → Mitigation: the proposal records the target as a goal, and re-measuring decides the follow-up.
- **[Lab numbers come from single runs on a local server]** → Mitigation: re-measure with the same build, the same gzip server and the same profile as the baseline. Report the median of three cold runs, not one.
- **[dummyjson might stop honouring `select`]** → The cost is only the larger payload. The schema still parses the response correctly.

## Migration Plan

This is a static deploy, and no data migrates. To roll back, revert the commit. Both `index.html` edits and the adapter parameter are independent and can each be reverted on their own.

## Results

Re-measured on 2026-10-23 against the baseline profile: the production build served with gzip (`npx serve -s`), a cold load of `/catalog` (cache ignored), Slow 4G, 4x CPU slowdown and a 390 px mobile viewport, in Chrome DevTools traces.

**LCP: 4.5 s median (runs: 4,503 / 4,706 / 4,471 ms), against the 6.4 s baseline.** That is about 1.9 s, or 30 %, better. It is still above the 2.5 s target, as the proposal expected.

LCP breakdown, from the median run, in ms. The baseline was a single run that recorded only load delay, so its other subparts are blank.

| Subpart       | Baseline | Now   |
| ------------- | -------- | ----- |
| TTFB          | —        | 2     |
| Load delay    | ~5,600   | 3,667 |
| Load duration | —        | 796   |
| Render delay  | —        | 37    |

- **Icon font:** it no longer competes with the product request or the thumbnail. The subset woff2 is 2 kB, against 324 kB before. The request timings here come from run 3 (4,471 ms), not from the median run the breakdown uses, and they weren't recorded for the other two runs. In run 3 the font downloaded from 2,211 to 2,801 ms, the product request started at about 2,975 ms and the LCP thumbnail at 3,641 ms.
- **Preconnect:** the trace no longer recommends a preconnect to `dummyjson.com`. The Network dependency tree insight lists it as a preconnected origin (Source: DOM), next to `fonts.gstatic.com` and `cdn.dummyjson.com`, with no estimated savings.
- **Product payload:** the list request now sends `select=id,title,description,category,thumbnail,price,discountPercentage`. It transfers 2.7 kB gzip (10 kB uncompressed), against 7.8 kB gzip (44 kB uncompressed) without `select`.
- **What remains:** the critical chain is still sequential (document → `main` → lazy catalog chunk → product request → thumbnail), and its latency is 3.55 s. Load delay is still the largest subpart. That is the input for the follow-up decision (proposal.md, Follow-up).
