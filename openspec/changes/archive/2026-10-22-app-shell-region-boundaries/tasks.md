# Tasks

## 1. Agree on test seams

- [x] 1.1 Propose these seams to the user and wait for explicit confirmation before writing any test; done when the user has confirmed (or amended) the list below
  - e2e shell layout tests (`e2e/src/app-shell.spec.ts`, Playwright Chromium, stubbed product source), located by role, label and text (design D6): catch the navigation's effective background and corners against `main`, the nav link inset inside the navigation landmark, the toolbar's `::after` line opacity at the top and after scrolling, and the shop name / cart link edges against the "Catalog" heading and the product list; miss how the line looks in browsers without scroll-driven animations, and anything a screenshot would show but the box and computed-style probes don't.
  - e2e axe gate (`e2e/src/accessibility.spec.ts`) with the new 1920 setup: catches automatically detectable WCAG 2.2 A/AA failures at the widest layout; misses the contrast cases axe marks incomplete (measured by hand in 6.3).
  - Manual check (task 7.1): catches dark-mode tone, the unsupported-browser fallback and the narrow drawer at 320px; misses nothing automated.
  - No unit seams: the change adds no domain function, store or adapter, and layout and scroll timelines can't be observed in jsdom.

## 2. Toolbar aligned with the page content (seam: e2e shell layout)

- [x] 2.1 Red - e2e: at 1920 × 1080 and at 1280 × 800 on `/catalog`, the shop name's left edge equals the "Catalog" heading's left edge, and the toolbar cart link's right edge equals the product list's right edge, within 1px (app-shell spec, Toolbar aligned with the page content); verify it fails at 1920 (today: shop name at 272 vs heading at 576)
- [x] 2.2 Green - minimal code to pass: wrap the toolbar contents in `<div class="mx-auto flex w-full max-w-5xl items-center gap-2">` and move `gap-2` off `mat-toolbar` (design D4); verify `pnpm nx e2e e2e` passes, including the 2.1 tests and the existing app-shell, cart-link and focus-not-obscured specs

## 3. Navigation set apart on wide viewports (seam: e2e shell layout)

- [x] 3.1 Red - e2e: at 1280px in light and in dark, the navigation drawer's effective background (first non-transparent ancestor of `getByRole('navigation', { name: 'Main' })`) differs from `main`'s effective background; in light its top-right and bottom-right radii are `0px`. At 390px with the navigation open, its top-right radius is `16px` (app-shell spec, Navigation set apart on wide viewports); verify the wide cases fail and the narrow case passes
- [x] 3.2 Green - minimal code to pass: `mat.sidenav-overrides((container-background-color: var(--mat-sys-surface-container-low), container-shape: 0))` under `mat-sidenav.mat-drawer-side` in `app.scss` (design D1); verify the 3.1 tests and the existing app-shell specs pass

## 4. Navigation links inset (seam: e2e shell layout)

- [x] 4.1 Red - e2e: on `/catalog` at 1280px, and at 390px with the navigation open, the Catalog navigation link's box starts at least 12px after the navigation landmark's left edge and ends at least 12px before its right edge (app-shell spec, Navigation links inset); verify it fails (today the link spans x = 0 → 255)
- [x] 4.2 Green - minimal code to pass: `mat-nav-list { padding-inline: 12px; }` in `app.scss` (design D2); verify the 4.1 tests and the existing navigation and focus-indicator specs pass

## 5. Toolbar boundary while scrolled (seam: e2e shell layout)

- [x] 5.1 Red - e2e: on `/catalog` with the product list loaded, the banner's `::after` opacity is `0` before scrolling; after `page.mouse.wheel(0, 400)` over `main` it polls to `1`; after scrolling back to the top it polls to `0` (app-shell spec, Toolbar boundary while scrolled); verify the scrolled case fails
- [x] 5.2 Green - minimal code to pass: the `header::after` line at `opacity: 0`, plus the `@supports (animation-timeline: scroll())` block with `toolbar-boundary` over `animation-range: 0 24px` in `app.scss` (design D3); verify the 5.1 tests pass, and that the focus-not-obscured spec in `app-shell.spec.ts` still passes, since the header height must stay 64px

## 6. Conformance matrix at 1920 (seam: e2e axe gate)

- [x] 6.1 Red - add the `widest light 1920` setup (1920 × 1080, light, not narrow) to `setups` in `e2e/src/accessibility.spec.ts` (accessibility spec, Conformance target, "Widest layout"); expected to already pass after groups 2–5. If it does, record that and add no code; if a cell fails, the failure names the page, state, scheme, width and rule
- [x] 6.1a Review follow-up - run every matrix width in both color schemes (`setups` as widths × schemes), so the matrix tests what the Conformance target promises; verify every new cell passes
- [x] 6.2 Green - fix any violation 6.1 reports in `app.scss` or `app.html`, with no rule disabled or excluded; verify `pnpm nx e2e e2e` passes for every cell
- [x] 6.3 (exempt) Update `docs/accessibility/conformance.md`:
  - the date
  - the matrix widths (1920, 1280, 390 and 320 CSS px), with 1.3.4 Orientation's viewport list
  - the rows measured against the "Navigation background": focus ring and current and other navigation link text, re-measured in Chromium in both schemes against `surface-container-low`

  The screen-reader output is unchanged, so no VoiceOver steps are repeated. Verify every changed ratio meets its threshold (3:1 for the ring, 4.5:1 for text) and the matrix description matches `setups`.

## 7. Manual verification

- [x] 7.1 Serve the app (`pnpm nx serve`) and check:
  - at 1280 and 1920, light and dark: the sidenav reads as a separate tone with square corners, the pill is inset, and the toolbar row lines up with the content column
  - scrolling the product list fades the toolbar line in within the first 24px, and it fades out on the way back
  - at 390 and 320 with the drawer open: rounded outer corner, inset pill, labels unclipped
  - with `prefers-reduced-motion: reduce` emulated: the line still fades and the drawer doesn't slide
  - in Firefox (no scroll-driven animations by default): no toolbar line at any scroll position

  Done when each item is observed.

## 8. Build and test

- [x] 8.1 Run `pnpm nx build`, `pnpm nx test`, `pnpm nx lint` and `pnpm nx e2e e2e`; all pass. Then check the changed code for `effect()` bodies calling `.set()`/`.update()`, subscribe-and-assign, state derived in `ngOnInit`/`ngOnChanges`, `transition: all`, `::ng-deep`, and an `animation` shorthand outside the `@supports` guard

## 9. Review

- [x] 9.1 Refactoring review of the changed code with fresh eyes (refactor only here, not inside slices): the e2e helpers for effective background and box edges (shared or inlined), comment density in `app.scss` matching `theme.scss`, and whether the drawer rules in `theme.scss` and `app.scss` read as one story; verify `pnpm nx test` and `pnpm nx e2e e2e` still pass afterwards
