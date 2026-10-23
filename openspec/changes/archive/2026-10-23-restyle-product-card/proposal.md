# Proposal

## Why

Each product's entry in the product list is a `mat-card` that uses only `mat-card-content`. Everything sits inside the content padding: a fixed 96 × 96 px thumbnail in the top-left corner of a card at least 12rem wide, then the title and Price display. Material's card has slots for exactly this anatomy: full-bleed media, a header with a title, and content. Using them gives the product image the card's full width, and gives the title and price consistent card spacing, from the theme's tokens instead of ad-hoc utilities.

Titles differ in length, so today the Final prices in a row sit at different heights.

## What Changes

- **Thumbnail:** the first slot of the card (`mat-card-image`). It is a square spanning the card from edge to edge, with the card's top corners. The placeholder shown when a thumbnail is missing or fails to load fills the same square.
- **Title:** `mat-card-title` inside `mat-card-header`, still the entry's level-two heading. It keeps today's `title-medium` type through a Material card token override, rather than Material's default `title-large`.
- **Price display:** in `mat-card-content`, pushed to the bottom of the card so the Final prices in a row line up.
- **Thumbnail sizing:** the thumbnail fills the width its container gives it, at a 1:1 ratio, instead of taking a fixed pixel size. The product detail keeps its 300px thumbnail by setting that width itself.
- **Unchanged:**
  - Each entry stays a single link to its product detail.
  - The link's accessible name is still the title once, then its prices.
  - Thumbnails stay decorative.
  - The cards keep the `outlined` appearance and press feedback.
  - No category, subtitle or card actions are added.
- **Assumption:** white-background product images in the dark color scheme get no special treatment unless the manual check shows they need it. That check is in the tasks.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `product-catalog`: adds how a product's entry in the product list is laid out: the thumbnail is a full-width square at the top, and the Final prices in a row line up.

## Impact

- **Bounded contexts:** `catalog` only (`libs/catalog/ui`, `scope:catalog`, `type:ui`), plus the global theme in the app (`src/styles/theme.scss`). No new Nx libs, no new dependencies. No new GLOSSARY.md terms: "product list", "thumbnail", "Final price" and "Price display" are already in the spec.
- **State:** no new writable state. The thumbnail's existing load-failure `linkedSignal` is unchanged. The `size` input of `ProductThumbnail` is removed.
- **Code:**
  - `libs/catalog/ui/src/lib/product-list/product-list.{html,ts}`: card slots
  - `libs/catalog/ui/src/lib/product-thumbnail/product-thumbnail.{html,ts,css}`: fluid square, `NgOptimizedImage` fill mode
  - `libs/catalog/ui/src/lib/product-detail/product-detail.html`: sets the 300px width, marks the thumbnail `priority`
  - `src/index.html`: `preconnect` to the image CDN, which `priority` images need
  - `src/styles/theme.scss`: `mat.card-overrides` for the title type
- **Tests:**
  - `e2e/src/product-list.spec.ts`: layout scenarios
  - `e2e/src/product-detail.spec.ts`: a characterization check that the detail thumbnail stays 300px square
  - The accessibility gate re-runs for the product list and the product detail.
- **Docs:** none expected. What a screen reader announces doesn't change, so neither the VoiceOver script nor `conformance.md` changes.
