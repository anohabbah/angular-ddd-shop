# Design

## Context

See proposal.md (Why) for motivation and `specs/app-shell/spec.md` for behavior. Facts in the current code that shape this design:

- `src/app/app.html` is `<header><app-cart-link /></header><router-outlet />`. `App` imports `CartLink` from `@ngsample/cart-ui-header` (`type:app -> type:ui`, allowed).
- `src/styles.scss` is empty. `project.json` `build.options.styles` is `["./src/styles.scss"]`. No PostCSS config exists.
- `src/app/app.spec.ts` drives the real cart flow from `appConfig.providers`. It finds the cart link as the first `header a` and the first cart line as the first `li` on the page. The shell must keep both selectors true: no anchor before the cart link inside `<header>`, and no `<li>` in the navigation.
- Tests run in jsdom, which has no `window.matchMedia`. The CDK `MediaMatcher` falls back to a matcher that never matches.
- Angular 22.2 router exposes `Router.lastSuccessfulNavigation` as a `Signal<Navigation | null>`. A new `Navigation` object is emitted per completed navigation.
- Available versions: `@angular/material` / `@angular/cdk` 22.2.x, `tailwindcss` 4.3.x.

## Goals / Non-Goals

**Goals:**

- One palette: Tailwind color tokens are aliases of Material system tokens, so Material components, Tailwind utilities and dark mode never drift.
- The shell has no writable signal of its own. Drawer state is derived and only overridable by the shopper.
- Motion follows the design-engineering rules (custom curves, short durations, press feedback, hover only on fine pointers, reduced motion respected).

**Non-Goals:**

- No `libs/shared/ui` lib, no new tag, no lint change, no ADR.
- No restyling of catalog or cart screens. Their component CSS stays.
- No icon font, no web font, no color scheme toggle.

## Decisions

### D1. Placement: everything in the app

```
src/ (type:app, no scope)
  styles/
    theme.scss       Sass: mat.theme(), Material token overrides, html/body base
    tailwind.css     plain CSS: @import "tailwindcss", @theme tokens, @utility pressable
  app/
    app.ts           App = shell; owns wide / mode / opened
    app.html         mat-sidenav-container > nav + header(toolbar) + router-outlet
    app.scss         shell layout only
    app.config.ts    + MAT_RIPPLE_GLOBAL_OPTIONS { disabled: true }
.postcssrc.json      { "plugins": { "@tailwindcss/postcss": {} } }
project.json         styles: [src/styles/theme.scss, src/styles/tailwind.css]
```

Dependencies added: `App -> @angular/material/{sidenav,toolbar,list,button}`, `@angular/cdk/layout`, `@angular/router` (`RouterLink`, `RouterLinkActive`), `@ngsample/cart-ui-header` (existing). External packages are not tagged, so `@nx/enforce-module-boundaries` is unaffected. No new lib-to-lib edge. The app still only composes context `ui` and `infrastructure` libs.

_Alternative:_ a `libs/shared/ui` design-system lib. Rejected for this change: it needs a new tag and an ADR, and Material already is the component library (explored and dropped).

### D2. Two global stylesheets, Sass for Material and plain CSS for Tailwind

Material theming is a Sass API (`@use '@angular/material' as mat`). Tailwind v4 runs as a PostCSS plugin and is not meant to run through Sass. Each goes into its own entry in the `styles` array, Material first.

- `theme.scss`: `html { color-scheme: light dark; @include mat.theme((color: mat.$azure-palette, typography: system-ui, density: 0)); }`, plus `body` using `--mat-sys-surface`, `--mat-sys-on-surface` and `--mat-sys-body-medium`, and `margin: 0`. `color-scheme: light dark` makes Material's `light-dark()` tokens follow the OS (spec: color scheme follows the system preference).
- `tailwind.css`: `@import "tailwindcss";` then `@theme inline { --color-primary: var(--mat-sys-primary); --color-on-primary: ...; --color-surface: ...; --color-on-surface: ...; --color-on-surface-variant: ...; --color-surface-container: ...; --color-outline-variant: ...; --font-sans: system-ui, sans-serif; }`. `inline` makes the utilities reference the Material variable, so they switch with the color scheme.

Cascade: Tailwind emits into `@layer theme, base, components, utilities`. Material's styles are unlayered and therefore beat every layer, preflight included. So preflight can't break Material components, and utilities don't override Material internals; that's expected. Material components are customized through their `mat.*-overrides` mixins, not utilities.

_Implementation finding (task 5.1), decided with the user:_ preflight is dropped. It doesn't affect Material, but it did change the existing screens, which rely on browser defaults (the catalog search input lost its border, and the cart `<h1>` became body text). `tailwind.css` imports only `tailwindcss/theme.css` and `tailwindcss/utilities.css` into their layers. Material's `body` base in `theme.scss` takes the reset's place. Bringing preflight back belongs to the change that restyles the catalog and cart screens.

_Alternative:_ one `styles.scss` with `@use 'tailwindcss'`. Rejected: it puts Tailwind through Sass, which Tailwind v4 does not support (the angular-developer `tailwind-css` reference shows the SCSS form, but upstream Tailwind advises against preprocessors).

_Alternative:_ `ng add tailwindcss`. Usable for the PostCSS and dependency steps, but it writes the import into the existing `styles.scss`, which D2 replaces. Doing the setup by hand keeps the result explicit.

### D3. Motion tokens and design-engineering defaults

In `tailwind.css` `@theme`, Tailwind's `--ease-*` namespace gives utilities for free:

- `--ease-out-strong: cubic-bezier(0.23, 1, 0.32, 1)` (UI enter/exit)
- `--ease-in-out-strong: cubic-bezier(0.77, 0, 0.175, 1)` (on-screen movement)
- `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)` (drawer)

Defaults:

| Material / browser default                    | Design system                                                                                     | Where                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Ripple on every press                         | Ripples off globally                                                                              | `MAT_RIPPLE_GLOBAL_OPTIONS` in `app.config.ts`        |
| No press feedback without ripple              | `@utility pressable`: `transition: scale 160ms var(--ease-out-strong)`, `:active { scale: 0.97 }` | Menu button, nav links                                |
| Hover on touch                                | Tailwind v4 `hover:` is already gated by `@media (hover: hover)`                                  | Free                                                  |
| Drawer slides with Material's standard easing | `--ease-drawer`, at most 300ms open, faster close                                                 | `mat.sidenav-overrides` or a scoped override (see R1) |
| Motion under reduced-motion                   | `pressable` drops `scale`; drawer slide disabled                                                  | `@media (prefers-reduced-motion: reduce)`             |

### D4. Shell state: no writable signals

```
BreakpointObserver.observe('(min-width: 960px)')    Router.lastSuccessfulNavigation
        | toSignal(map(s => s.matches),                   (Signal<Navigation|null>)
        |   initialValue: isMatched(...))                       |
        v                                                       |
   wide: Signal<boolean>  ---------------------------+          |
        |                                            v          v
        v                               opened = linkedSignal({
   mode = computed(() =>                  source: () => ({ wide: wide(),
     wide() ? 'side' : 'over')                             nav: lastSuccessfulNavigation() }),
                                          computation: ({ wide }) => wide })
                                                     ^
                                                     | [opened]="opened()" one-way; menu button opens;
                                                     | (closedStart) writes false (backdrop / Esc)
```

| Signal           | Primitive                            | Why                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wide`           | `toSignal` over `BreakpointObserver` | Viewport width is external, a browser media-query event stream. This is the "bridge an external stream" case. The CDK observer handles listener cleanup. `initialValue` from `isMatched` avoids an `undefined` first render.                                                                                                                                                            |
| `mode`           | `computed`                           | Strictly derived from `wide`.                                                                                                                                                                                                                                                                                                                                                           |
| `opened`         | `linkedSignal`                       | Derived (`wide` means open, narrow means closed) and overridable by the shopper. Resets whenever `wide` changes or a navigation completes, which covers the "closes after navigating" and "follows viewport changes" requirements without an effect or a `NavigationEnd` handler. On wide viewports it resets to `true` after each navigation too, which is the spec's "still visible". |
| writable signals | none                                 | `opened.set` is called only by the menu button (toggle) and the sidenav's `closedStart` (backdrop, Escape).                                                                                                                                                                                                                                                                             |

_Implementation finding (task 4.12):_ `[(opened)]` ping-pongs. Material emits `openedChange` asynchronously, after the (simulated) animation and carrying the drawer's state at that moment. If a navigation resets `opened` while an open emission is pending, the stale `true` reopens the drawer, and each toggle queues an emission with the opposite value, so it loops forever. In the browser this is reachable by tapping a link during the open animation. So the binding is one-way, and the only write-back is `(closedStart)`. It only ever writes `false`, and Material filters it on the drawer's current state, so a stale event can't reopen the drawer.

_Code review follow-up (group 8):_ the backdrop covers the toolbar while the drawer is open, so the menu button only opens it (`opened.set(true)`) and exposes `aria-expanded`. Closing is by the backdrop, Escape or navigating (spec amended). `[disableClose]="wide()"` stops Escape from hiding the side navigation on wide viewports. The Catalog link stays marked on product details (non-exact `routerLinkActive`), and the spec now says the link for the section is marked.

The derivation is a one-line boolean, so no domain function is extracted. There's no bounded context to host one, and no rule worth naming.

No `effect()`. The menu button is `@if (!wide())`. The nav uses `<nav>` with `<a mat-list-item routerLink routerLinkActive #rla="routerLinkActive" [activated]="rla.isActive" ariaCurrentWhenActive="page">` inside `mat-nav-list`, which renders anchors and no `<li>`. The shop name in the toolbar is plain text, not a link (see Context: first `header a`).

_Alternative:_ `toSignal(router.events.pipe(filter(NavigationEnd)))` as the reset source. Rejected: `lastSuccessfulNavigation` is already a signal, so no RxJS is needed for routing.

_Alternative:_ a separate injectable `ShellLayout` in `src/app`. Rejected for now: the state is three lines and used by one template. The assumption that it lives in `App` is recorded here.

_Alternative (explored and dropped):_ top bar only, or bottom tabs on narrow viewports. Dropped in favor of side nav plus drawer.

### D5. Testing seams

- `App` through the DOM, using `MatSidenavHarness` / `MatNavListHarness` (TestBed). jsdom has no `matchMedia`, so the spec provides a fake `MediaMatcher` whose `matches` and change listeners the test controls. This is a test double for a CDK service in the spec file, not a port, so no `testing` lib. Covers every `app-shell` requirement except color scheme and reduced motion.
- The existing `app.spec.ts` cart flow stays unchanged as a regression check. With the fake matcher absent, jsdom is "narrow", so the drawer is closed and nothing in `<header>` precedes the cart link.
- Color scheme, reduced motion and motion feel can't be observed in jsdom. They're checked manually in the browser with DevTools rendering emulation (`prefers-color-scheme`, `prefers-reduced-motion`).

### angular-developer references consulted

- `tailwind-css`: v4 PostCSS setup (`.postcssrc.json`, `@import "tailwindcss"`, no `tailwind.config.js`). This drove D2.
- `linked-signal`: `source`/`computation` form that resets on source change. This drove `opened` in D4.
- `signals-overview` and `effects`: "never use effect to sync state". No effect in the shell.
- `angular-animations`: native CSS over the legacy DSL. Motion is CSS tokens and transitions only.
- `component-harnesses`: Material harnesses as the component-test seam (D5).
- `navigate-to-routes`: `RouterLink` / `RouterLinkActive` for the nav and current-page marking.

## Risks / Trade-offs

- [R1] The sidenav open/close transition may not be exposed as a `mat.sidenav-overrides` token (Material 22 moved to CSS animations, but the duration and curve may be internal). → Spike task first: inspect the installed `@angular/material/sidenav` styles. If no token exists, override with one scoped selector in `app.scss` and record it. If even that is brittle, accept Material's curve.
  - _Spike outcome (task 2.3, Material 22.2.4):_ no token. The transition is hard-coded as `.mat-drawer-transition .mat-drawer { transition: transform 400ms cubic-bezier(0.25, 0.8, 0.25, 1) }` (likewise for `.mat-drawer-backdrop` and `.mat-drawer-content`). The sidenav uses no view encapsulation, and its styles are injected after the global stylesheet. So the override goes in `theme.scss` with one extra class for specificity (`.mat-drawer-container.mat-drawer-transition .mat-drawer`): 300ms `--ease-drawer` on open, 200ms on close (`:not(.mat-drawer-opened)`), backdrop 200ms. _Code review follow-up:_ the content gets no transition. Only `side` and `over` modes are used, so the content margin changes only when the mode switches on resize, and it snaps, as D3's table intends. `mat-drawer-transition` is only added 200ms after the container is created, so the first render never animates.
- [R2] Material may already disable its animations under `prefers-reduced-motion`, or may not. → Same spike checks it. Add the reduced-motion override only if Material doesn't handle it.
  - _Spike outcome:_ Material handles it. `_animationsDisabled()` is true when `MediaMatcher.matchMedia('(prefers-reduced-motion)')` matches (cached once per page) or when `MATERIAL_ANIMATIONS.animationsDisabled` is set, and then the drawer never gets `mat-drawer-transition`. No drawer override is needed for reduced motion; only `pressable` needs its own fallback. Tests provide `MATERIAL_ANIMATIONS` `{ animationsDisabled: true }` so jsdom never waits on a `transitionend` that never fires, and so the module-level reduced-motion cache can't leak between tests.
- [R3] Unlayered Material CSS outranks Tailwind utilities, so a utility class on a Material component can appear to "not work". → Documented in D2. Customize Material through `mat.*-overrides` mixins.
- [R4] `app.spec.ts` relies on DOM order (`header a`, first `li`). → Shell decisions in D4 keep both true. The existing test is the regression check.
- [R5] The 960px breakpoint is a judgment call (Material's Small/Medium boundary) and isn't tied to content. → It's one constant in `App`; the spec names it so tests and code agree.
- [R6] `system-ui` renders differently per OS. → Accepted trade-off for zero font bytes.

## Migration Plan

Additive. Rollback is reverting the commit: no data, no persisted state, no API change.
