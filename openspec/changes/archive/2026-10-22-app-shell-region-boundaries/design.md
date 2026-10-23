# Design

## Context

The shell lives in `src/app` (`App`, tag `type:app`).

- **Template:** `app.html` is a `mat-sidenav-container`. It holds a `mat-sidenav`, in `side` mode when wide and `over` mode when narrow, with the `mat-nav-list` (`aria-label="Main"`) inside it. The `mat-sidenav-content` holds a sticky `<header>` with the `mat-toolbar`, then `<main class="mx-auto max-w-5xl p-4">`.
- **Scrolling:** `mat-sidenav-content` is the scroll container. The document itself never scrolls.
- **Styles:** `app.scss` holds the shell's own rules under emulated encapsulation. `src/styles/theme.scss` holds the global Material theme, `mat.sidenav-overrides((container-width: 16rem))` and the drawer transition override.
- **Material constraints:**
  - The sidenav tokens are custom properties read on `.mat-drawer`: `--mat-sidenav-container-background-color` (default `surface`) and `--mat-sidenav-container-shape` (default `corner-large`), which sets the outer corners in both modes. No token is specific to a mode.
  - Material adds `.mat-drawer-side` / `.mat-drawer-over` to the `mat-sidenav` host for the current mode.
  - Material's list styles are unlayered and load after the global sheets, so they outrank Tailwind's layered utilities on Material elements (risk R3 of `add-design-system-and-shell`).
- **Width maths:** Tailwind runs without preflight, so boxes are `content-box`. `main`'s `max-w-5xl` caps its content box at 1024px, and its 16px padding sits outside that. `mat-toolbar` has 16px inline padding. So a `max-w-5xl` column inside the toolbar's content box lines up with `main`'s content box at every width.

## Goals / Non-Goals

**Goals:**

- Meet the four `app-shell` requirements in `specs/app-shell/spec.md` with CSS and one template wrapper, adding no TypeScript to `App`.
- Keep every rule specific to one region in the shell's encapsulated `app.scss`, next to the region it styles.

**Non-Goals:**

- No change to the drawer transition, breakpoint, widths or mode logic (`wide`, `mode`, `opened` are unchanged).
- No toolbar elevation or toolbar background change, and no hide-on-scroll toolbar.
- No dark-mode-specific values: every colour is a `--mat-sys-*` role, so both schemes follow from the theme.

## Decisions

### D1. Side-mode sidenav: re-declare the tokens on `.mat-drawer-side`

In `app.scss`:

```scss
@use '@angular/material' as mat;

mat-sidenav.mat-drawer-side {
  @include mat.sidenav-overrides(
    (
      container-background-color: var(--mat-sys-surface-container-low),
      container-shape: 0,
    )
  );
}
```

The mixin emits the two custom properties on the side-mode host. The host carries `App`'s `_ngcontent` attribute, so the emulated selector matches it. Over mode keeps the global defaults: `surface` and `corner-large`, the 16px corner.

- **Why `surface-container-low`:** it is the Material 3 role for a standard navigation drawer beside content. It is one tonal step from `surface`, which is enough to mark the region without competing with the content.
- **Alternatives:**
  - A divider via `container-divider-color: outline-variant`: a line alone leaves the pill floating on the same tone as the page, and two boundaries (tone and line) are noise.
  - Setting the global token to shape `0`: that would also square the over-mode drawer, which floats and should keep its corner.
  - Overriding `background-color` on `.mat-drawer-side` directly: this would fight Material's specificity, and the token is the supported knob.

### D2. Nav link inset: padding on `mat-nav-list` in `app.scss`

`mat-nav-list { padding-inline: 12px; }`. Material's `.mdc-list { padding: 8px 0 }` has specificity (0,1,0). The emulated `mat-nav-list[_ngcontent-…]` has (0,1,1), so the rule wins without `!important`. The pill shrinks to 232px, inset 12px from both drawer edges in both modes. The current-page link's `aria-current` and the focus ring are untouched.

- **Alternative:** a Tailwind `px-3` class on `mat-nav-list`. It is layered, so Material's unlayered list padding beats it (R3). Rejected.

### D3. Toolbar line: a `::after` on `<header>`, driven by a scroll timeline

In `app.scss`:

```scss
header::after {
  content: '';
  position: absolute;
  inset: auto 0 0;
  height: 1px;
  background: var(--mat-sys-outline-variant);
  opacity: 0;
}

@supports (animation-timeline: scroll()) {
  header::after {
    animation: toolbar-boundary linear both;
    animation-timeline: scroll(nearest block);
    animation-range: 0 24px;
  }
}

@keyframes toolbar-boundary {
  to {
    opacity: 1;
  }
}
```

`header` is already `sticky top-0 z-10`, which is positioned, so the pseudo-element anchors to it. `scroll(nearest block)` resolves to `mat-sidenav-content`, the nearest scroll container. The line fades in over the first 24px of scroll and stays at full opacity below that. Scrolling back to the top reverses it, because the timeline is the scroll position: no state, no listener.

- **Why a pseudo-element with `opacity`:**
  - It adds no layout height. A `border-bottom` would make the header 65px, out of step with `scroll-padding-top` (64px + 8px) and the toolbar token.
  - It animates only `opacity`, which the compositor can run.
- **Why a 24px range rather than a step at 1px:** a short fade ties the line to the first bit of scrolling instead of popping. The spec scenarios (0px, 400px, back to 0px) sit at the ends of the range.
- **Why the `@supports` guard is required:** where `animation-timeline` is unsupported the property is dropped. The `animation` shorthand would then run as a 0s time-based animation, and fill `both` would show the line all the time. With the guard, those browsers keep `opacity: 0`, today's look, as the spec permits.
- **Reduced motion:** a fade with no movement, allowed by the existing Reduced motion requirement ("SHALL NOT slide or scale"). No `prefers-reduced-motion` branch is needed.
- **Keyframe name:** emulated encapsulation scopes the component's `@keyframes` name, so it can't collide.
- **Alternatives:**
  - An `IntersectionObserver` or `scroll` listener feeding a signal: that is a writable signal synced from a DOM event, which the reactivity rules allow only through `toSignal`, and it is more code for the same result.
  - CDK `ScrollDispatcher`: same objection.
  - A `surface-container` toolbar background instead of a line: rejected in the proposal.

### D4. Toolbar column: one wrapper `div` in `app.html`

```html
<mat-toolbar>
  <div class="mx-auto flex w-full max-w-5xl items-center gap-2">
    …menu button, shop name, cart link (unchanged)…
  </div>
</mat-toolbar>
```

`gap-2` moves from `mat-toolbar` to the wrapper. The wrapper is a plain element, so Tailwind utilities apply with no Material conflict. Per the width maths in Context:

- at 1920px, the wrapper and `main`'s content box both run x = 576 → 1600
- at 1280px, both run x = 272 → 1264

The DOM order in `<header>` (menu control, shop name, cart link) is unchanged, so the accessibility tree and the existing specs that rely on it are unaffected.

- **Alternative:** a shared CSS custom property for the column width, applied as `padding-inline: max(16px, (100% - 64rem) / 2)` on the toolbar. It works without a wrapper but duplicates `main`'s layout in a formula. The wrapper reuses the same utilities as `main`, so the two can't drift apart.

### D5. Conformance matrix: every width in both schemes

Add a 1920 × 1080 width to `e2e/src/accessibility.spec.ts`. It covers the misalignment found at this width.

`setups` is the cross product of the four widths (1920, 1280, 390, 320) and both color schemes. Before this change, 390 ran light only and 320 dark only, so the matrix tested less than the Conformance target's "in both color schemes" promised. Code review caught the gap, and running every pair closes it at the cost of 32 more cells.

### D6. Test seams: Playwright, through the page

None of these behaviors can be observed in jsdom (layout, computed colours, scroll timelines), and the project allows no component specs. So every scenario is an e2e test in `e2e/src/app-shell.spec.ts`. Elements are located by role, label or text only:

| Element             | Locator                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------- |
| Navigation          | `getByRole('navigation', { name: 'Main' })`                                               |
| Toolbar             | `getByRole('banner')`                                                                     |
| Shop name           | `getByRole('banner').getByText('ngsample')`                                               |
| Toolbar cart link   | `getByRole('banner').getByRole('link', { name: /^Cart/ })`                                |
| Heading             | `getByRole('heading', { level: 1, name: 'Catalog' })`                                     |
| Column's right edge | `getByRole('main').getByRole('list')`, the product grid, which fills `main`'s content box |

- **Background and corners:** the navigation landmark is the transparent `mat-nav-list`, and the colour and corners belong to its drawer. So a small helper evaluates from the located landmark up to its first ancestor with a non-transparent background: the drawer. It is reached from a role locator, not a CSS selector. `main`'s effective background is found the same way.
- **The toolbar line:** read as `getComputedStyle(banner, '::after').opacity`, polled with `expect.poll` after the page is scrolled with `page.mouse.wheel` over `main`. Expected values come from the spec: `0` at the top, `1` after 400px.

### Architecture, state and references

- **Libs and dependencies:** no new lib and no new import. `App` already depends only on `ui` and `infrastructure`, and this change adds no TypeScript. Tags and boundaries are unchanged.
- **Domain types and parsing:** none. The change has no untrusted input.
- **Writable signals:** none added. The scrolled state is the CSS scroll timeline (D3), and no signal derives or holds it. Existing signals (`wide`, `mode`, `opened`) are unchanged. No `effect()` is added.
- **angular-developer references consulted:**
  - `component-styling.md`: emulated encapsulation scopes `app.scss` to elements in `App`'s template, including the `mat-sidenav` host, and `::ng-deep` is discouraged. This drove D1–D3 living in `app.scss` with plain element selectors and no `::ng-deep`.
  - `tailwind-css.md`: utilities for the plain wrapper in D4.
  - `angular-animations.md`: native CSS over the animations DSL. This drove D3's pure-CSS scroll timeline.

## Risks / Trade-offs

- [R1] `.mat-drawer-side` is a Material internal class, not public API. → It has been stable across Material's MDC versions. If it is renamed, D1 silently stops applying, and the "Navigation set apart on wide viewports" e2e scenario fails. The test is the guard.
- [R2] Scroll-driven animations are unsupported in some browsers at the time of writing (the e2e gate runs Chromium only). → The `@supports` guard degrades to no line, which the spec permits. No other behavior depends on the line.
- [R3] Polling a pseudo-element's computed `opacity` couples the test to how the line is drawn. → It is the only observable signal for a decorative line short of a screenshot. If the drawing changes, the test changes with it, with no impact on the spec.
- [R4] `surface-container-low` changes the background behind the navigation links and their focus ring, so the contrast figures in `conformance.md` (focus ring and link text against the navigation background) are stale. → A docs task re-measures them in both schemes. `on-surface` text and the `primary` ring keep large margins, since the tone shift from `surface` is small.
- [R5] The 12px inset shortens the pill to 232px. → The labels "Catalog" and "Cart" fit with room to spare. The text-spacing probe doesn't open the drawer, so the manual check covers it.

## Migration Plan

Styling only, with no data and no API. To roll back, revert the commit.
