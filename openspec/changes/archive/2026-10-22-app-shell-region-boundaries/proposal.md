# Proposal

## Why

A design audit of the app shell (2026-10-22, Chromium at 1280, 1920 and 390 px) found that the shell's three regions have no visible boundaries. The sidenav, the toolbar and the main content all paint `--mat-sys-surface` with no line, tone or shadow between them.

- **Sidenav:** in side mode it can't be told apart from the page. Its 16px right corners round a drawer that never floats, so they can't be seen either.
- **Nav pill:** the current-page pill runs from x = 0 to the drawer's edge, touching both sides. Its left rounding is lost against the viewport.
- **Scrolling:** content slides under the toolbar, which has the same colour, and is cut off at y = 64 with no edge.
- **Above 1280 px:** `main` is a centred `max-w-5xl` column but the toolbar fills the full width. At 1920 px the cart link sits 284 px beyond the content's right edge.

The shell only lines up at 1280 px, because 1280 − 256 = 1024 = `max-w-5xl`. That is also the widest width in the conformance matrix, so the matrix can't catch the misalignment.

## What Changes

- **Sidenav in side mode:** a `surface-container-low` background so it reads as a region beside the page, with square corners. In over mode (narrow viewports) the drawer keeps its surface background and its 16px rounded corner.
- **Nav items:** inset 12px on each side, so the current-page pill has space around it in both modes.
- **Toolbar boundary while scrolled:** once the main content is scrolled away from the top, the sticky toolbar shows a 1px `outline-variant` line along its bottom edge. At the top of the page there is no line. The line comes from a CSS scroll-driven animation, so it adds no signal and no script. Browsers without `animation-timeline` support show no line, which is how the shell looks today.
  - _Assumption:_ the audit offered a line or a `surface-container` toolbar background. This proposal picks the line: it marks the edge without recolouring the toolbar.
- **Toolbar column:** the toolbar's contents (menu control, shop name, cart link) sit in the same centred `max-w-5xl` column as the main content. The shop name and the cart link line up with the content's left and right edges at every wide width.
- **Conformance matrix:** adds a wide viewport above 1280 px (1920 × 1080) to the automated check and runs every width in both color schemes, and records the width in the conformance statement. The contrast measurements against the navigation background are re-measured against the new sidenav background.
- **Reduced motion:** no change. Material leaves out `mat-drawer-transition` when the system asks for reduced motion (spike outcome R2 of `add-design-system-and-shell`), so the drawer transition override in `theme.scss` never applies then. The new toolbar line fades by changing colour, with no movement, so it is allowed under reduced motion.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-shell`: adds how the shell's regions are bounded:
  - the side-mode navigation is set apart from the page by its background
  - the current-page pill is inset from the navigation's edges
  - the toolbar shows a bottom boundary only while the content is scrolled
  - the toolbar's contents share the main content's column
- `accessibility`: the conformance target adds a 1920 CSS px viewport width.

## Impact

- **Bounded contexts:** none. The change is in the app shell (`src/app`, `type:app`), which belongs to no bounded context. No new Nx libs and no new GLOSSARY.md terms: "navigation", "toolbar" and "main content" are already the spec's terms.
- **State:** no new writable state. The scrolled boundary is a CSS function of the scroll position, and no signal holds it.
- **Code:**
  - `src/app/app.html`: a column wrapper inside `mat-toolbar`
  - `src/app/app.scss`: sidenav side-mode background and shape, nav list inset, toolbar scroll boundary
  - `e2e/src/app-shell.spec.ts`: boundary and alignment scenarios
  - `e2e/src/accessibility.spec.ts`: the 1920 setup
- **Docs:** `docs/accessibility/conformance.md`: date, matrix widths, re-measured navigation contrast. No screen-reader output changes, so the VoiceOver script needs no repeat.
- **Dependencies:** none.
