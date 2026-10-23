# Proposal

## Why

On a cold mobile load of the Catalog, Largest Contentful Paint (LCP) is 6.4 s. It was measured on a production build served with gzip, at Slow 4G, 4x CPU slowdown and a 390 px viewport, in a single run. The LCP element is the first product thumbnail, a 10 kB webp. The image request itself is already well tuned (`NgOptimizedImage` `priority`, `fetchpriority=high`, preconnect to `cdn.dummyjson.com`), so 5.6 s of the 6.4 s is load delay before the image is requested. Three cheap causes make that delay worse:

- **Icon font in the critical path.** The full Material Symbols font (324 kB) downloads from 2.2 s to 5.2 s. That overlaps the product request and the thumbnail and takes their bandwidth, even though the Catalog shows only one icon (the cart link).
- **No preconnect to the product API.** The page has no preconnect to `https://dummyjson.com`, the product API's origin. The trace estimates a 587 ms saving.
- **Oversized product payload.** The product request returns 44 kB for 30 products, mostly fields the adapter discards.

**Target:** LCP under 2.5 s on the same profile. This change is a first step toward it and does not claim to reach it. The request chain (HTML -> JS -> lazy catalog chunk -> product request -> thumbnail) stays sequential, and its estimated floor after this change is about 4.2 s. Whether to break that chain is decided after a new trace (see Follow-up).

## What Changes

- **Subset the icon font.** The Google Fonts stylesheet link in `src/index.html` requests only the icons the app renders, using `&icon_names=add,add_shopping_cart,arrow_back,delete,remove,shopping_cart` (alphabetical, as Google Fonts requires). `display=block` stays. A comment by the link says that a new `mat-icon` ligature must be added to the list.
- **Preconnect to the product API.** Add `<link rel="preconnect" href="https://dummyjson.com">` to `src/index.html`, next to the existing preconnect for `cdn.dummyjson.com`.
- **Trim the product payload.** `DummyJsonProductSource` asks the API for only the fields its DTO parses (`select=id,title,description,category,thumbnail,price,discountPercentage`), on both the search/list request and the by-id request. Parsing at the adapter boundary is unchanged.
- **Re-measure.** Repeat the baseline trace (same build, gzip, Slow 4G, 4x CPU, 390 px) and record the new LCP next to the 6.4 s baseline.

**Success means:**

- LCP drops below the 6.4 s baseline on the same profile.
- The icon font no longer downloads at the same time as the product request and the thumbnail. It should be a few kB, not 324 kB.
- `pnpm nx build`, `pnpm nx test`, `pnpm nx e2e e2e` and the accessibility gate stay green.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. What the shopper sees and does is unchanged: the same icons, products, fields and states. The LCP target is recorded here as a goal, not as a spec requirement, because this change does not meet it. The change therefore needs `skip_specs: true` in its `.openspec.yaml`.

## Impact

- **Bounded contexts:**
  - `catalog`: the infrastructure adapter `libs/catalog/infrastructure/src/lib/dummy-json-product-source.ts`.
  - App composition: `src/index.html`, for the font link and the preconnect.
  - `cart` and `catalog` UI render the subset icons, with no code change.
- **New Nx libs:** none. **New GLOSSARY.md terms:** none.
- **Source (writable) state:** none introduced. No signals or stores change.
- **Tests:** the `select=` request parameter is production code in the adapter. It gets a red -> green slice at the adapter seam (`HttpTestingController`), and the e2e stubs in `e2e/src/support/fixtures.ts` must still match the changed request URLs. The `index.html` edits are config and exempt from TDD.
- **Accessibility:** the app shell's document changes, so the accessibility gate re-runs. Screen-reader output is unchanged because the icons stay the same glyphs.
- **Risk:** an icon used later but missing from `icon_names` renders as its ligature text instead of a glyph. The comment by the link covers this.

## Follow-up (out of scope)

After re-measuring, decide whether to break the sequential chain to approach 2.5 s:

- Start the product request from `index.html` (`<link rel="preload" as="fetch">`). This bends the rule that only infrastructure knows the API URL, and the e2e stubbing would have to cover it.
- Trim the 103 kB gzip vendor chunk. The initial bundle is already over its 500 kB budget.
