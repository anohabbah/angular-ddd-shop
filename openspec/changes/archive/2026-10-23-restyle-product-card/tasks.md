# Tasks

## 1. Agree on test seams

- [x] 1.1 Propose these seams to the user and wait for explicit confirmation before writing any test. Done when the user has confirmed (or amended) this list.
  - **e2e product list layout** (`e2e/src/product-list.spec.ts`, Playwright Chromium, stubbed product source and image CDN), located by role and text (design D5).
    - Catches: the thumbnail's and placeholder's box against the entry's box (top edge, width, square), and the Final prices' vertical position across a row.
    - Misses: how a real product image looks inside the square (the stub is 1 × 1 px), and the inherited corner radius.
  - **e2e product detail characterization** (`e2e/src/product-detail.spec.ts`).
    - Catches: the detail thumbnail staying 300 × 300 px once the thumbnail goes fluid.
    - Misses: everything else on the detail page's look.
  - **e2e axe gate** (`e2e/src/accessibility.spec.ts`).
    - Catches: automatically detectable WCAG 2.2 A/AA failures on the list and the detail, in both schemes at every matrix width.
    - Misses: the contrast cases axe marks as incomplete.
  - **Manual check** (task 7.1).
    - Catches: dark-mode tone of white images, rounded media corners, title type, console warnings from `NgOptimizedImage`.
    - Misses: nothing that is automated.
  - **No unit seams:** no domain function, store or adapter changes, and jsdom has no layout.

## 2. Detail thumbnail size (characterization, seam: e2e product detail)

- [x] 2.1 Characterization test, not a Red/Green slice: on `/catalog/1` at 1280 × 800, the thumbnail (`getByRole('main').getByRole('presentation')`) is 300 × 300 px. It must pass today. Verify it once by changing `[size]="300"` to `301` by hand and seeing it go red, then revert. It guards decision D2 in group 4.

## 3. Placeholder fills the thumbnail's square (seam: e2e product list layout)

- [x] 3.1 Red - e2e: at 1280 × 800, with the mascara thumbnail set to `missingThumbnail`, the entry's placeholder (`getByRole('img', { includeHidden: true })`) starts at the entry's top edge (within 2px), is as wide as the entry (within 2px), and its height equals its width (product-catalog spec, Product list entry layout, "Placeholder fills the thumbnail's square"). Verify that it fails today (96 × 96 inside the content padding).
- [x] 3.2 Green - minimal code to pass:
  - Put `<app-product-thumbnail mat-card-image>` as the card's first child, outside `mat-card-content`, and import `MatCardImage`.
  - In `product-thumbnail.css`, make the host `aspect-ratio: 1`, `overflow: hidden`, with a `surface-container-highest` background. (Background removed during 7.1: it showed behind the detail thumbnail; see design D1.)
  - Make the `<svg>` `width: 100%; height: 100%`.
  - Keep the `size` input for the `<img>` for now (design D1).

  Verify: the 3.1 test passes, and the existing product-list and product-detail specs, including 2.1, still pass.

## 4. Thumbnail spans the entry (seam: e2e product list layout)

- [x] 4.1 Red - e2e: at 1280 × 800, the mascara entry's thumbnail (`getByRole('presentation')`) starts at the entry's top edge, is as wide as the entry, and is square, each within 2px ("Thumbnail spans the entry on a wide viewport"). Verify that it fails (the `<img>` is still 96px).
- [x] 4.2 Green - minimal code to pass:
  - `ngSrc` with `fill` and `object-fit: contain` on the `<img>`.
  - Remove the `size` input and both `[size]` bindings.
  - Give the detail thumbnail `class="w-75"` (design D2).

  Verify: the 4.1 test, test 2.1 (300 × 300) and the existing thumbnail and placeholder tests pass.

- [x] 4.3 Red - e2e: the same check at 320 × 640 ("Thumbnail spans the entry on a narrow viewport"). It is expected to already pass after 4.2. If it does, record that and add no code. If it fails, the next task fixes it.
- [x] 4.4 Green - only if 4.3 failed: minimal code to pass. Verify the 4.3 test passes.
  - Recorded: the 4.3 test passed as soon as it was written, after 4.2, so 4.4 needed no code.

## 5. Title in the card header (characterization, seam: existing e2e)

- [x] 5.1 Structural change kept green by the existing tests:
  - Move the title to `<mat-card-header><h2 mat-card-title>` and import `MatCardHeader` and `MatCardTitle`.
  - Drop the `text-title-medium` / `m-0` classes from the `h2`.
  - Add `mat.card-overrides` mapping `title-text-*` to the `title-medium` tokens in `theme.scss` (design D4).

  Verify:
  - The heading-by-role and link-name tests in `product-list.spec.ts` still pass.
  - The `h2`'s computed `font-size` and `font-weight` in Chromium equal today's values, measured before the change.

## 6. Final prices line up across a row (seam: e2e product list layout)

- [x] 6.1 Red - e2e: at 1280 × 800, on the first row of the product list:
  - First, assert the precondition: the "Essence Mascara Lash Princess" heading is taller than the "iPhone 9" heading.
  - Then check that the two entries' `getByText('Final price')` boxes have the same `y`, within 1px ("Final prices line up across a row").

  Verify that it fails (prices follow their titles).

- [x] 6.2 Green - minimal code to pass: `mt-auto pt-2` on the `mat-card-content` that holds the Price display, and drop its `grid gap-1` (design D3). Verify the 6.1 test and the whole `product-list.spec.ts` pass.

## 7. Manual verification

- [x] 7.1 Serve the app (`pnpm nx serve`) with the real dummyjson images and check:
  - At 1280 and 320px, light and dark:
    - the image is full-bleed with rounded top corners matching the card
    - the title reads as `title-medium`
    - prices line up across rows
    - the press feedback and focus outline follow the card
  - The product detail thumbnail looks as it does on `main` (300px, no new background visible).
  - The browser console shows no `NgOptimizedImage` warnings. If it warns about `sizes`, set `sizes` to the list's column width (design Risks).
  - White product images in the dark scheme: record whether they read acceptably. If not, note a follow-up change (design Open Questions); don't fix it here.

  Done when each item is observed and recorded.

  Recorded (Chromium against `pnpm nx serve`, real dummyjson images, 1920, 1280 and 320px, light and dark):
  - Image full-bleed, top corners 12px like the card; title is `title-medium` (16px/500/24px); first-row prices line up; focus outline follows the card.
  - Detail thumbnail: first run showed a new grey square from the host background. Fixed by dropping the host background (design D1), and now it matches `main`.
  - Console: NG02955 (LCP image not `priority`), also on `main`. Fixed with design D6 (`priority` input, `preconnect`). There are no `NgOptimizedImage` warnings left.
  - White images in dark mode: the dummyjson images are transparent and read fine on the dark card surface. No follow-up.

## 8. Accessibility gate and build

- [x] 8.1 Run `pnpm nx e2e e2e`, including `accessibility.spec.ts` over every list and detail state × light/dark × every matrix width. Fix any violation in the changed templates or styles, with no rule disabled or excluded. Verify that every cell passes.
  - What a screen reader announces is unchanged (DOM order and names are pinned by 4.x and the link-name test), so no VoiceOver steps are repeated and `conformance.md` doesn't change. Record that in the change.
  - Recorded: every accessibility cell passes, and screen reader output is unchanged, so no VoiceOver steps were repeated and `conformance.md` is unchanged. The one failure in the run was in `app-shell.spec.ts` "shows a toolbar bottom line only away from the top". It pointed the mouse at the middle of `main`, which the taller cards push below the 500px viewport, so the wheel missed the scroller. The test now points at the middle of `main`'s visible part.
- [x] 8.2 Run `pnpm nx build`, `pnpm nx test`, `pnpm nx lint` and `pnpm nx e2e e2e`; all must pass. Then check the changed code for:
  - `effect()` bodies calling `.set()`/`.update()`
  - subscribe-and-assign
  - state derived in `ngOnInit`/`ngOnChanges`
  - `::ng-deep`
  - relative imports across libs

## 9. Review

- [x] 9.1 Refactoring review of the changed code with fresh eyes (refactoring happens only here, not inside slices). Look at:
  - whether the e2e box-comparison helpers should be shared with `app-shell.spec.ts`'s `box()` helper
  - comment density in `product-thumbnail.css` and `theme.scss` matching the surrounding code
  - leftover utilities on the card that Material's slots now cover

  Verify that `pnpm nx test` and `pnpm nx e2e e2e` still pass afterwards.

  Recorded: `box()` moved to `e2e/src/support/box.ts`, shared by `app-shell.spec.ts` and `product-list.spec.ts`. Comment density matches the surrounding code. No leftover card utilities. Build, test, lint and all 146 e2e tests pass.

## 10. Code review follow-ups

- [x] 10.1 Red - e2e: at 320 × 640, the product detail thumbnail is square and its right edge stays inside `main`'s 16px padding (seam: e2e product detail). It failed as expected: the right edge was at 316px against a 304px limit.
- [x] 10.2 Green - `grid-cols-1` on the detail `<article>` and `max-w-full` on its thumbnail. `max-w-full` alone was not enough, because the article's implicit `auto` column took its 300px width from the thumbnail. `grid-cols-1` (`minmax(0, 1fr)`) lets the column shrink to the content width.
- [x] 10.3 Test hardening, no product change:
  - the line-up test now checks that its two entries share a row
  - the detail 300px test uses the shared `box()` helper
  - the `priority` comment in `product-list.html` names its dependency on `max-w-5xl` in `src/app/app.html`
- [x] 10.4 Re-run `pnpm nx build`, `pnpm nx test`, `pnpm nx run-many -t lint` and `pnpm nx e2e e2e` (accessibility gate included). Screen reader output is unchanged, so the VoiceOver script and `conformance.md` don't change.
