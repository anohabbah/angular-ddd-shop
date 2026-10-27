# Proposal

## Why

Two keyboard and screen-reader defects were found by exploring the shop beyond the e2e fixtures, and both pass every current gate (build, unit tests, lint, e2e, axe):

1. On the cart page, activating "Decrease quantity of <title>" at a quantity of 2 natively disables the button that holds focus. The browser drops focus to the document body, so a keyboard or screen-reader shopper loses their place in the Cart line. The spec requires decreasing to be unavailable at 1, but says nothing about keeping focus, and the only focus test covers the Increase button.
2. On a narrow viewport, selecting the navigation link for the page already shown (Catalog while on `/catalog`) leaves the navigation open and the menu control reporting `aria-expanded="true"`. The router ignores a same-URL navigation, so the "closes after navigating" rule never fires. The spec only covers links to another page.

## What Changes

- The Decrease control on a Cart line stays focusable while it is unavailable at a quantity of 1: it is exposed as disabled to assistive technologies, does nothing when activated, and keeps keyboard focus when the quantity it just decreased reaches 1.
- On a narrow viewport, selecting any link in the navigation closes the navigation, whether or not it leads to another page. Links to another page keep closing it once the navigation completes, however the navigation was started.
- Two new e2e tests, one per defect, and the accessibility follow-through the project rules require: the axe gate re-runs, the VoiceOver script gets the cart step the Decrease change affects, and `docs/accessibility/conformance.md` is updated.
- No **BREAKING** changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `shopping-cart`: the "Quantity" requirement gains that the decrease action stays focusable while unavailable, and that keyboard focus stays on it when the quantity reaches 1.
- `app-shell`: the "Navigation closes after navigating on narrow viewports" requirement gains that selecting a navigation link closes the navigation even when it is the link for the page already shown.

## Impact

- Bounded contexts: Cart, in its `ui` lib (`libs/cart/ui`, `scope:cart`, `type:ui`: the cart page template), and the app shell (`src/app`, `type:app`), which belongs to no bounded context. The domain, application and infrastructure layers are untouched: the domain already clamps a decrease at 1, so no new rule is needed there.
- New Nx libs: none. New GLOSSARY.md terms: none.
- Source (writable) state introduced: none. The shell's existing `opened` state gains one more command that writes it, from the navigation links' selection event. The cart page gains no state: the Decrease control's availability stays derived from the line's quantity.
- Affected files: `libs/cart/ui/src/lib/cart-page/cart-page.html`, `src/app/app.html` and `src/app/app.ts`, `e2e/src/cart-page.spec.ts`, `e2e/src/app-shell.spec.ts`, `docs/accessibility/voiceover-script.md`, `docs/accessibility/conformance.md`.
- Gates: both edits touch a `ui` lib or the app shell, so the accessibility gate re-runs. The Decrease change alters what a screen reader announces (a dimmed, still-focused button instead of silence), so the VoiceOver check runs for the cart step it touches.
