# Tasks

## 1. Agree on test seams

- [x] 1.1 Propose these seams to the user and wait for explicit confirmation before writing any test; done when the user has confirmed (or amended) the list below
  - `App` through the DOM with `MatSidenavHarness` / `MatNavListHarness` (TestBed, `provideRouter` with stub `/catalog` and `/cart` routes, a fake `MediaMatcher` in the spec file controlling the 960px query): catches navigation destinations, current-page marking, wide vs narrow mode, menu open, backdrop close, close-after-navigation and viewport changes; misses real CSS media queries, animation, color scheme.
  - Existing `app.spec.ts` cart flow (TestBed from `appConfig.providers`, unchanged): catches regressions in the header cart link and lazy routes caused by the new shell; misses shell behavior.
  - Manual browser check (DevTools rendering emulation): catches color scheme, reduced motion, motion curves and press feedback; misses nothing automatable, but isn't repeatable in CI.

## 2. Dependencies and tooling (exempt)

- [x] 2.1 (exempt) Add `@angular/material` and `@angular/cdk` `~22.2.0` to dependencies, and `tailwindcss`, `@tailwindcss/postcss` and `postcss` to devDependencies, with `pnpm add`; verify `pnpm install` succeeds and `pnpm nx build` still passes
- [x] 2.2 (exempt) Add `.postcssrc.json` with the `@tailwindcss/postcss` plugin (design D2); verify `pnpm nx build` passes
- [x] 2.3 (exempt, spike) Inspect the installed `@angular/material/sidenav` styles for a token or variable controlling the drawer transition duration and curve, and whether Material disables it under `prefers-reduced-motion` (design R1, R2); write the outcome (token name, scoped override, or accept default) as a note under R1/R2 in `design.md`

- [x] 2.4 (exempt, added at the user's request) Add `prettier-plugin-tailwindcss` to devDependencies and to `.prettierrc` (`plugins`, `tailwindStylesheet: "./src/styles/tailwind.css"`) so Prettier orders Tailwind classes in templates; do it after 3.2, since it needs that stylesheet; verify `pnpm prettier --check` reorders a deliberately unsorted `class` attribute
- [x] 2.5 (exempt, added at the user's request) Add `prettier-plugin-organize-imports` before `prettier-plugin-tailwindcss` in `.prettierrc` and apply it to every `.ts` file in `src/` and `libs/`; verify `pnpm nx run-many -t test` passes after the reordering (side-effect imports in `test-setup.ts` moved)

## 3. Design system styles (exempt: global styles and providers, not observable in jsdom; verified by build and manual check)

- [x] 3.1 (exempt) Create `src/styles/theme.scss` with `mat.theme` (azure, `system-ui`, density 0), `color-scheme: light dark` and the `body` base (design D2); replace `./src/styles.scss` with it in `project.json` `styles` and delete `src/styles.scss`; verify `pnpm nx build` passes and the served app background follows DevTools `prefers-color-scheme` light/dark
- [x] 3.2 (exempt) Create `src/styles/tailwind.css` with `@import "tailwindcss"`, the `@theme inline` color and font aliases onto `--mat-sys-*`, the `--ease-*` motion tokens and `@utility pressable` with its reduced-motion fallback (design D2, D3); add it after `theme.scss` in `project.json` `styles`; verify `pnpm nx build` passes and a `bg-primary` element in the served app matches Material's primary in both color schemes
- [x] 3.3 (exempt) Register `MAT_RIPPLE_GLOBAL_OPTIONS` `{ disabled: true }` in `app.config.ts` (design D3); verify `pnpm nx test` passes (`app.config.spec.ts`, `app.spec.ts`)

## 4. Shell (seam: `App` through the DOM)

- [x] 4.1 Red - the navigation offers a Catalog link to `/catalog` then a Cart link to `/cart`, and selecting Cart shows `/cart`, at `App` (spec: Navigation destinations)
- [x] 4.2 Green - minimal code to pass: `mat-sidenav-container` with a `<nav>` `mat-nav-list` of two `routerLink` anchors around the existing header and `<router-outlet />` (design D4: no `<li>`, no anchor before the cart link in `<header>`); verify `pnpm nx test` (new test and existing cart flow)
- [x] 4.3 Red - on `/cart` the Cart link has `aria-current="page"` and the Catalog link does not, at `App` (spec: Current page marked)
- [x] 4.4 Green - minimal code to pass: `routerLinkActive` and `ariaCurrentWhenActive="page"` on the nav links; verify `pnpm nx test`
- [x] 4.5 Red - with the fake matcher wide, the sidenav is open in `side` mode and there is no menu button, at `App` (spec: Navigation on wide viewports, "Wide viewport")
- [x] 4.6 Green - minimal code to pass: `wide = toSignal(BreakpointObserver…)`, `mode = computed(...)`, bind `[mode]` and `[opened]` (design D4); verify `pnpm nx test`
- [x] 4.7 Red - with the fake matcher narrow, the sidenav is closed in `over` mode and a menu button is shown; selecting it opens the sidenav, at `App` (spec: Navigation on narrow viewports, "Closed by default", "Opening from the menu control")
- [x] 4.8 Green - minimal code to pass: `opened = linkedSignal(...)` with `[(opened)]` and an `@if (!wide())` menu button in the toolbar with `pressable`, an inline SVG icon and an accessible name (design D3, D4); verify `pnpm nx test`
- [x] 4.9 Red - narrow and open, selecting the backdrop closes the sidenav, at `App` (spec: "Closing by selecting outside")
- [x] 4.10 Green - minimal code to pass (expected to already pass through `[(opened)]`; if it does, record that and add no code) — recorded: passed with no new code; the 4.9 test was strengthened (reopen in one press) after a one-way-binding mutation still passed; verify `pnpm nx test`
- [x] 4.11 Red - narrow and open, selecting the Cart nav link shows `/cart` with the sidenav closed; and following the toolbar cart link does the same, at `App` (spec: Navigation closes after navigating on narrow viewports)
- [x] 4.12 Green - minimal code to pass: add `lastSuccessfulNavigation` to the `opened` linkedSignal source (design D4); verify `pnpm nx test`
- [x] 4.13 Red - wide, after selecting a nav link the sidenav is still open, at `App` (spec: "Navigating on a wide viewport")
- [x] 4.14 Green - minimal code to pass (expected to already pass via D4's reset to `wide`; if so, record that and add no code) — recorded: passed with no new code; a mutation that closes on every navigation makes it fail; verify `pnpm nx test`
- [x] 4.15 Red - switching the fake matcher wide to narrow closes the sidenav and shows the menu button; switching narrow-and-open to wide shows the sidenav in `side` mode without a menu button, at `App` (spec: Navigation follows viewport changes)
- [x] 4.16 Green - minimal code to pass (expected to already pass via `wide` in the linkedSignal source; if so, record that and add no code) — recorded: passed with no new code; untracking `wide` in the source makes it fail; verify `pnpm nx test`
- [x] 4.17 Red - `<header>` contains a toolbar showing the shop name as text and the cart link with an item count of 2 after two products are added to the root `CartStore`, at `App` (spec: Toolbar) — corrected at review: the test asserts the toolbar inside `<header>` with the shop name as text and the cart link (`Cart (0)`) first. `src/app` specs may not import `CartStore` (`type:app` cannot depend on `type:application`), so the item count stays covered by the cart flow test in `app.spec.ts` (`Cart (1)`)
- [x] 4.18 Green - minimal code to pass: `mat-toolbar` inside `<header>` holding the shop name, the menu button and `<app-cart-link />`; shell layout in `app.scss` / Tailwind utilities; verify `pnpm nx test`, including the unchanged cart flow test

## 5. Manual verification

- [x] 5.1 Serve the app (`pnpm nx serve`) and check, with DevTools device and rendering emulation: wide (1280px) shows the side nav and no menu; narrow (390px) drawer opens with the drawer curve and closes after navigating; `prefers-color-scheme: dark` switches the palette for Material and Tailwind surfaces; `prefers-reduced-motion: reduce` removes the drawer slide and press scale; buttons and nav links scale on press with no ripple; done when each spec scenario not covered by tests (color scheme, reduced motion) is observed

## 6. Review

- [x] 6.1 Review the changed code with fresh eyes (refactor only here, not inside slices): check for `effect()` writing signals, subscribe-and-assign, state derived in lifecycle hooks, `transition: all`, `ease-in`, UI durations over 300ms and hover styles not gated by pointer; verify `pnpm nx lint` passes

## 7. Build and test

- [x] 7.1 Run `pnpm nx build` and `pnpm nx test`; done when both pass

## 8. Code review follow-ups

- [x] 8.1 Red - on a wide viewport, pressing Escape in the navigation leaves it open, at `App` (spec: Navigation on wide viewports, "Escape on a wide viewport")
- [x] 8.2 Green - minimal code to pass: `[disableClose]="wide()"` on the sidenav; verify `pnpm nx test`
- [x] 8.3 (exempt, docs) Amend `specs/app-shell/spec.md`: the menu control opens the navigation (closing is by selecting outside, Escape or navigating), the open state is exposed on the control, the current page marking covers the section shown (Catalog on product details), and add the Escape-on-wide scenario; verify `openspec validate add-design-system-and-shell --strict`
- [x] 8.4 Red - on a narrow viewport the menu control reports `aria-expanded="false"`, and `"true"` once the navigation is open, at `App` (spec: Navigation on narrow viewports)
- [x] 8.5 Green - minimal code to pass: `[attr.aria-expanded]="opened()"` and an open-only `(click)="opened.set(true)"`; verify `pnpm nx test`
- [x] 8.6 Red - on `/catalog/1` the Catalog link has `aria-current="page"`, at `App` (spec: Current page marked, "Product detail")
- [x] 8.7 Green - minimal code to pass (expected to already pass via non-exact `routerLinkActive`; if so, record that and add no code) — recorded: passed with no new code; exact matching makes it fail; verify `pnpm nx test`
- [x] 8.8 (exempt, docs) Amend CLAUDE.md: the app may also own the app shell (layout and its UI state), and RxJS may bridge external event streams such as media queries; verify the wording matches design D1/D4
- [x] 8.9 (exempt, styles) No content transition in `side` mode (design D3), so resizing snaps; verify in the browser that switching width doesn't animate the content margin
- [x] 8.10 (exempt, config) Restore `@angular/compiler` as the first import in every `test-setup.ts` and add `// organize-imports-ignore`; verify `pnpm nx format:check` and `pnpm nx run-many -t test`
- [x] 8.11 Review refactor (no behavior change): `@for` over nav items, export and reuse `WIDE_VIEWPORT_QUERY`, a module-level `openNavigation` test helper, `FakeMediaMatcher` reading its own instance; correct the task 4.17 note; list `--color-on-surface-variant` in D2; verify `pnpm nx run-many -t test lint`
- [x] 8.12 Run `pnpm nx build` and `pnpm nx test`; done when both pass
