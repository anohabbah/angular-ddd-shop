# Tasks

## 1. Test seams

- [x] 1.1 Propose the test seams and wait for the user's confirmation before writing any test. Done when the user confirms.
  - **Seam: `ProductSource` from `provideCatalogInfrastructure()`, driven through `HttpTestingController`.**
    - Catches: a request that leaves out `select`, or names the wrong fields, on the list, search or by-id request.
    - Misses: whether dummyjson actually honours `select`, and any effect on LCP.
  - **Not a seam: the `index.html` font link and preconnect (config, exempt).**
    - Covered by: the e2e suite (icons render as glyphs, with the fixture's stub), the accessibility gate, and the trace in group 4.
    - Misses: an icon missing from `icon_names`, because the fixture serves the full font. Task 3.2 covers that.

## 2. Trim the product payload (catalog infrastructure)

- [x] 2.1 Red: the product-list request (empty search term) asks for `select=id,title,description,category,thumbnail,price,discountPercentage`, at the `ProductSource` adapter seam. Verify: the new test in `dummy-json-product-source.spec.ts` fails for that reason.
- [x] 2.2 Green: minimal code to pass. Add `select` to the list request's params, derived from `DummyProductDto`'s keys (design.md, Decision 3). Verify: `pnpm nx test` passes.
- [x] 2.3 Red: the search request (non-empty term) asks for the same `select` value, at the adapter seam. Verify: the new test fails because `select` is missing.
- [x] 2.4 Green: minimal code to pass. Verify: `pnpm nx test` passes.
- [x] 2.5 Red: the by-id request asks for the same `select` value, at the adapter seam. In the same step, change the existing by-id tests from `expectOne('<url>')` to a predicate on `r.url`, so adding a parameter doesn't break their matching. Verify: only the new `select` assertion fails.
  - Also done: the by-id matcher in the app's integration test, `src/app/app.config.spec.ts`, got the same change. Its `expectOne('<url>')` would otherwise break once `select` was added.
- [x] 2.6 Green: minimal code to pass. Verify: `pnpm nx test` passes, and `pnpm nx e2e e2e` still passes. The fixture ignores query strings, so the e2e stubs need no change.

## 3. Take the icon font and API connection off the critical path (app, exempt)

- [x] 3.1 (exempt) In `src/index.html`, add `<link rel="preconnect" href="https://dummyjson.com" crossorigin>` next to the `cdn.dummyjson.com` preconnect. Verify: `pnpm nx build` passes, and the built `dist/ngsample/browser/index.html` contains the link with `crossorigin`.
- [x] 3.2 (exempt) In `src/index.html`, add `&icon_names=add,add_shopping_cart,arrow_back,delete,remove,shopping_cart` to the Material Symbols stylesheet URL, with names in alphabetical order and `display=block` kept. Add an HTML comment saying that every `<mat-icon>` ligature must be in the list. Verify:
  - `grep -rhoE '<mat-icon>[a-z_]+</mat-icon>' libs src | sort -u` lists exactly those six names;
  - the built `index.html` inlines a single `@font-face` whose woff2 URL is the subset kit (`fonts.gstatic.com/l/font?kit=…`).
- [x] 3.3 Re-run the accessibility gate, since the app shell's document changed. Verify: `e2e/src/accessibility.spec.ts` passes within `pnpm nx e2e e2e`. Screen-reader output is unchanged (same icon glyphs and labels), so the VoiceOver script and `docs/accessibility/conformance.md` need no update. Note that in the change summary.

## 4. Re-measure LCP

- [x] 4.1 (exempt) Re-measure on the baseline profile:
  - production build served with gzip (`npx serve -s`), cold load of `/catalog`;
  - Slow 4G, 4x CPU slowdown, 390 px mobile viewport;
  - three runs, using the median.

  Record the result in a `## Results` section at the end of `design.md`:
  - the LCP median next to the 6.4 s baseline;
  - the LCP breakdown;
  - whether the icon font still downloads at the same time as the product request and the thumbnail;
  - whether the trace still recommends a preconnect to `dummyjson.com`.

  Verify: the section exists, and LCP is below 6.4 s. If it isn't, stop and report before going further.

## 5. Review and integration

- [x] 5.1 Review the changed production code and refactor if needed, outside the red → green loop. Check for:
  - imports from `zod` instead of `zod/mini`;
  - relative imports across libs;
  - dependencies the CLAUDE.md tag rules don't allow;
  - a `select` value maintained by hand instead of derived from the schema.

  Verify: `pnpm nx lint` passes.

- [x] 5.2 Run `pnpm nx build`, `pnpm nx test` and `pnpm nx e2e e2e`. Verify: all three pass. The initial-bundle budget warning was there before this change and isn't part of it.

## Workflow follow-up

- Based on the group 4 result, decide whether to propose the follow-up (preloading the product request from `index.html`, trimming the vendor chunk) to get closer to the 2.5 s target.
- Archive the change after review.
