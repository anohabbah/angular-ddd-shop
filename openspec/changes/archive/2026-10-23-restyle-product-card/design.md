# Design

## Context

- `product-list.html` wraps each entry in `<a routerLink class="pressable rounded-md">` > `mat-card appearance="outlined"` > `mat-card-content class="grid gap-1"`, holding `<app-product-thumbnail [size]="96">`, `<h2 class="text-title-medium">` and `<app-price-tag>`.
- `ProductThumbnail` (`libs/catalog/ui`) renders either `<img [ngSrc] [width]=size [height]=size>` or, when the thumbnail is empty or fails to load, a decorative `<svg>` with a `surface-container-highest` `rect`. The failure is a `linkedSignal` reset per product. The product detail uses it with `[size]="300"`.
- Material 22.2 card, as installed:
  - `[mat-card-image]` adds `.mat-mdc-card-image.mdc-card__media`: `position: relative`, and the card's top corner radius via `:first-child { border-top-*-radius: inherit }`.
  - `mat-card-title` (element or attribute) uses `title-large` tokens with `padding: 16px 16px 0`.
  - `mat-card` is a flex column.
- The product list is the only `mat-card` in the app (checked with grep over `libs` and `src`).
- `NgOptimizedImage` with `fill` sets the image to `position: absolute; inset: 0; width/height: 100%` and defaults `sizes` to `100vw`. It needs a positioned parent with a non-zero height.
- The e2e image CDN stub serves a 1 × 1 PNG, so rendered sizes come from CSS alone.
- Existing contracts this change must keep:
  - Product list presentation, Price display in text, and Thumbnails are decorative (`product-catalog` spec).
  - The link name starts `<title> Final price` (`product-list.spec.ts`).

## Goals / Non-Goals

**Goals:**

- The card uses Material's slots for its media, title and content. The spacing comes from Material's card styles, not utilities.
- `ProductThumbnail` has one sizing mode, and its container decides its width.

**Non-Goals:**

- Image cropping or art direction (`object-fit: cover`, `srcset` from a loader).
- Line-clamping long titles.

## Decisions

### D1. The thumbnail host is the card's media slot

`<app-product-thumbnail mat-card-image [product]="product" />` is the card's first child. The `MatCardImage` directive is imported by `ProductList`.

`mat-card-image` only gets the card's corner radius as the card's direct first child. The `<img>` inside the component is not one, but the host element is. The host is a positioned block with `aspect-ratio: 1` and `overflow: hidden` (so the radius clips the absolutely positioned image). It has no background of its own: the dummyjson images are transparent, so they sit on the card's surface in the list and on the page's surface on the detail, as they did before. A host background would add a visible square behind the detail thumbnail.

Rejected:

- `mat-card-image` on the inner `<img>`. It isn't the card's first child, so no radius. It would also put Material's card into a component that is reused outside cards.
- Moving the `<img>` into `product-list.html`. That would duplicate the placeholder and load-failure logic that the detail page shares.

### D2. Always fluid: `fill` mode, no `size` input

The `<img>` uses `ngSrc` with `fill`. `object-fit: contain` keeps the whole product in view, and the surface behind shows through any letterbox. The placeholder `<svg>` is `width: 100%; height: 100%`. The `size` input is removed. The product detail gives its thumbnail a 300px width with the `w-75` utility (18.75rem).

Rejected: keeping a fixed mode for the detail page next to a fluid mode for the card. That's two template branches for one caller each. It's also less clear than "the thumbnail fills the width its container gives it".

### D3. Card anatomy

```
<a routerLink class="block h-full pressable rounded-md ...">
  <mat-card appearance="outlined" class="h-full">
    <app-product-thumbnail mat-card-image />
    <mat-card-header><h2 mat-card-title>{{ title }}</h2></mat-card-header>
    <mat-card-content class="mt-auto pt-2"><app-price-tag /></mat-card-content>
  </mat-card>
</a>
```

- `h2[mat-card-title]` keeps the level-two heading that the list tests locate by role.
- `mat-card` is already a flex column and `h-full` stretches it to the row height. `mt-auto` on the content pushes the Price display to the bottom, which lines the Final prices up across a row. `pt-2` keeps 8px under a title that fills the space.
- The DOM order stays thumbnail (`alt=""`), title, price. So the link's accessible name is unchanged.
- The link keeps `rounded-md` (`corner-medium`), which matches the outlined card's shape token, so the focus outline still follows the card.

Rejected: putting the Price display in `mat-card-footer`. The footer has no padding of its own, so we'd add back the padding `mat-card-content` already gives.

### D4. Title type through a card token override

In `theme.scss`, inside the `html` block next to `mat.sidenav-overrides`:

```scss
@include mat.card-overrides(
  (
    title-text-font: var(--mat-sys-title-medium-font),
    title-text-line-height: var(--mat-sys-title-medium-line-height),
    title-text-size: var(--mat-sys-title-medium-size),
    title-text-tracking: var(--mat-sys-title-medium-tracking),
    title-text-weight: var(--mat-sys-title-medium-weight),
  )
);
```

The override is global, but the product list is the only card in the app, so nothing else changes. If a later card wants `title-large`, scope the override to the product list.

Rejected: the `text-title-medium` utility on the `h2`. It sets the `font` shorthand, and its winner against Material's longhand properties on `.mat-mdc-card-title` depends on cascade layers and load order. That's the same fight the `theme.scss` drawer comment already describes. Overriding the token is what Material supports.

### D6. `priority` on the thumbnails that can be the LCP element

`NgOptimizedImage` logs NG02955 when the Largest Contentful Paint image isn't marked `priority`. That was already the case on `main`, and the full-width thumbnail makes it more likely. `ProductThumbnail` gets a `priority` boolean input, passed to the `<img>`:

- **Product list:** `[priority]="index < 4"`. The main column is capped at `max-w-5xl`, which fits at most four 12rem columns, so the first row is always among the first four entries.
- **Product detail:** `priority`, for its single thumbnail.

`priority` then needs a `preconnect` to the image origin (NG02956), so `src/index.html` gets `<link rel="preconnect" href="https://cdn.dummyjson.com">`.

Rejected: computing the column count from the viewport. The cap makes a constant correct at every width, and an over-eager hint on a narrow viewport costs at most three early fetches.

### D5. Tests at the e2e seam

The new requirement is about layout, so the tests are box measurements in Playwright (`product-list.spec.ts`), with locators by role and text:

- **Thumbnail:** `getByRole('presentation')`.
- **Placeholder:** `getByRole('img', { includeHidden: true })`.
- **Final price:** `getByText('Final price')`.
- **Tolerance:** the outlined card's 1px border sits inside the entry, so width comparisons allow 2px.

The "prices line up" scenario first checks its own precondition: "Essence Mascara Lash Princess" must wrap onto more lines than "iPhone 9" at 1280px. Otherwise the test could pass without testing anything.

For the product detail, a characterization test (passes before and after) pins the thumbnail at 300 × 300.

There are no unit tests. No domain function, store or adapter changes, and jsdom has no layout.

### State and reactivity

- No new writable signal. The existing `#loadFailed` `linkedSignal` and the `showImage` `computed` are unchanged.
- No `effect()`.
- No new boundary parsing: the thumbnail URL is already parsed by the product source adapter.

### Libraries and dependencies

- **Affected libs:** `libs/catalog/ui` (`scope:catalog`, `type:ui`) and `src/styles/theme.scss` (`type:app`).
- **New imports:** `@angular/material/card` (`MatCardHeader`, `MatCardTitle`, `MatCardImage`), a third-party package, so no tag rule applies. There are no new edges between libs.

### angular-developer references consulted

- **`component-styling`:** host styling with `:host` in the component stylesheet, and no `::ng-deep` (D1, D2).
- **`host-elements`:** a Material directive placed on a component's host element by the consumer works without a host binding (D1).
- **`tailwind-css`:** layout utilities in templates and tokens in stylesheets (D3).

## Risks / Trade-offs

- **[White product images in the dark color scheme]** Full width, they become large white blocks on a dark surface. → Manual check in light and dark at 1280 and 320px. If it reads badly, a follow-up adds padding or a tone inside the media block. The spec doesn't constrain that.
- **[Inner and outer radius differ by the border width]** The image's inherited 12px radius sits inside the outlined card's 1px border. → Accept it. It's below what you can see at this size, and it's how Material's own `mat-card-image` renders.
- **[`NgOptimizedImage` dev warnings]** For example, fill-mode height, `sizes` or LCP `priority`. → The manual check reads the console. A warning about `sizes` is fixed by giving `sizes` the list's column width. The LCP warning is handled by D6.
- **[The detail page changes through a shared component]** → The characterization test from D5, plus the accessibility gate over the detail states.

## Open Questions

- Does the dark color scheme need a treatment for white product images? This is answered by the manual check, and any fix belongs to a follow-up (see Risks).
