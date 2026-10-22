# Proposal

## Why

The app has no visual foundation: `src/styles.scss` is empty, the shell is a bare `<header>` with the cart link above a `<router-outlet />`, and the catalog and cart screens each style themselves ad hoc. Before more screens are built, the app needs one design system (component library, utility CSS, tokens, motion) and a layout that gives shoppers a stable way to move between the Catalog and the cart.

## What Changes

- Add `@angular/material` and `@angular/cdk` as the component library, and Tailwind CSS v4 for utility styling.
- Add an app-wide design system in `src/styles/`: a Material theme (azure palette, system-ui typeface, density 0, light/dark following the OS), Tailwind tokens mapped onto the Material system tokens so both share one palette, and motion tokens (custom ease-out and drawer curves, short durations, reduced-motion fallbacks).
- Tune Material to the design-engineering motion rules: ripples off globally, press feedback by a small scale on `:active`, hover styles only on fine pointers.
- Replace the app shell with a navigation layout: a side navigation (Catalog, Cart) beside the content on wide viewports, and a drawer opened from a menu control on narrow viewports that closes after each navigation. The toolbar keeps the cart link with its item count.
- Existing catalog and cart screens keep their own styles. Restyling them is a later change.

Bounded contexts: none touched. The shell and the design system live in the app (`src/`, `type:app`). No new Nx libs, no lint boundary change, no ADR.

New domain terms: none. Shell and navigation are presentation, not ubiquitous language, so `GLOSSARY.md` is unchanged.

Minimal source state: none of its own. The viewport width comes from the browser. Whether the drawer is open is derived from the viewport width and the current URL, and the shopper can override it from the menu control or the backdrop until the next navigation or viewport change.

## Capabilities

### New Capabilities

- `app-shell`: the layout every page sits in: navigation between the Catalog and the cart on wide and narrow viewports, the toolbar, and the color scheme.

### Modified Capabilities

None. The `shopping-cart` requirement "Item count in the header" stays as written: the cart link remains in the header on every page.

## Impact

- Dependencies: `@angular/material`, `@angular/cdk` (~22.2), `tailwindcss`, `@tailwindcss/postcss`, `postcss`.
- Config: `project.json` `styles` array (Material theme in Sass, Tailwind in plain CSS, motion CSS), new `.postcssrc.json`, `src/styles.scss` replaced.
- Code: `src/app/app.ts`, `app.html`, `app.css`/`app.scss`, `app.config.ts` (global ripple options), `app.spec.ts` (shell tests; the existing cart flow test must keep passing).
- Unchanged: every `libs/**` project, `eslint.config.mjs`, `GLOSSARY.md`, existing specs.
