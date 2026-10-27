# Design

## Context

See proposal.md (Why) for the two defects. This design relies on the following facts about the current code (Angular 22.2, Angular Material 22.2):

- `libs/cart/ui/src/lib/cart-page/cart-page.html` renders each Cart line's Decrease control as `<button mat-icon-button [disabled]="row.line.quantity === 1" (click)="cart.decrease(...)">`. `disabled` on a native button removes it from the tab order and, when it is the active element, the browser moves focus to `<body>`. The domain function `decreaseQuantity` (`libs/cart/domain`) already clamps at 1 (`Math.max(1, quantity - 1)`), so the control's availability is only a cue, not the guard.
- Angular Material's button base (`MatButtonBase`, shared by `mat-icon-button`) has a `disabledInteractive` input. With it, a disabled button renders `aria-disabled="true"` and no native `disabled` attribute, keeps its `tabindex`, and gets the `mat-mdc-button-disabled-interactive` class (disabled look, pointer events allowed). Material only halts clicks on disabled _anchors_; a disabled-interactive `<button>` still emits `(click)`.
- `src/app/app.ts` holds the shell's navigation state: `opened` is a `linkedSignal` whose source is `{ wide, navigation: inAppNavigation() }` and whose computation is `wide`. `inAppNavigation` is a `computed` over `router.lastSuccessfulNavigation()`, undefined for the first navigation. The drawer closes on a narrow viewport only when that source changes. The menu control's `(click)` and the drawer's `(closedStart)` already write `opened`.
- With the router's default `onSameUrlNavigation: 'ignore'`, selecting a `routerLink` to the current URL emits `NavigationSkipped` and leaves `lastSuccessfulNavigation` unchanged, so `opened` never recomputes.
- Playwright's `toBeDisabled()` treats a button with `aria-disabled="true"` as disabled, so the existing "cannot decrease it below 1" test keeps its meaning once the control is disabled-interactive.
- `docs/accessibility/voiceover-script.md` step 4.4 covers Increase keeping focus; no step covers Decrease reaching 1. `docs/accessibility/conformance.md` records 2.4.3 Focus Order and 4.1.2 Name, Role, Value as Supports, citing V4.4–V4.7 and V1.3, V4.2.

## Goals / Non-Goals

**Goals:**

- Keep keyboard focus on the Decrease control when the quantity it decreased reaches 1, while still exposing it as disabled.
- Close the navigation drawer on a narrow viewport whenever a link in it is selected, including the current page's link.
- Keep both fixes inside the `ui` template and the shell, with no new state.

**Non-Goals:**

- No domain or application change. The Cart's rules (quantity ≥ 1, clamp on decrease) are already in `libs/cart/domain` and `CartStore`.
- No change to what a same-URL navigation does elsewhere (focus, title, scroll): only the drawer reacts to selecting the current page's link.
- Not fixing V4.4's French announcement gap (4.1.3), which is a separate, deferred diagnosis in the VoiceOver script.

## Decisions

### 1. Decrease stays focusable through Material's `disabledInteractive`

Add the `disabledInteractive` attribute to the Decrease button in `cart-page.html`, keeping `[disabled]="row.line.quantity === 1"`. Material then renders `aria-disabled="true"` instead of the native attribute: the button keeps its place in the tab order and keeps focus after it disables itself, and screen readers announce it as dimmed.

A click on the disabled-interactive button still calls `cart.decrease(productId)`. That is acceptable because the domain clamps at 1: the Cart lines are mapped to equal values, so no quantity, line total or Cart total changes and no status region re-renders. No template guard is added, to keep the rule in one place (the domain) rather than duplicating it in the template.

Alternatives considered:

- **Keep the native `disabled` and move focus to the Increase button** with `afterNextRender`, as the Remove button does. Rejected: it adds imperative focus code for a control that did not disappear, and the shopper's focus jumps to a control they did not activate.
- **Never disable Decrease and rely on the domain clamp.** Rejected: it drops the "unavailable at 1" cue the spec requires and the sighted shopper relies on.
- **A hand-written `[attr.aria-disabled]` with `[disabled]="false"`.** Rejected: Material already implements exactly this, including the disabled styling.

Layering: only `libs/cart/ui` changes (`scope:cart`, `type:ui`). It keeps importing `@ngsample/cart/application` and `@ngsample/cart/domain` (`type:ui → application, domain`) and Angular Material; nothing new.

### 2. Selecting a navigation link closes the drawer on a narrow viewport

In `src/app/app.html`, each navigation link gets `(click)="closeNavigation()"`. In `src/app/app.ts`, `closeNavigation()` is a command: `if (!this.wide()) this.opened.set(false)`. On a wide viewport it does nothing, so the side drawer stays visible as the spec requires. On a narrow viewport the drawer starts closing as soon as the link is selected; for a link to another page the existing `linkedSignal` source change then resets `opened` to `wide` (false) again, which is idempotent.

This is a `.set()` in an event handler, which the project's reactivity rules allow. The existing source state (`opened`) gains a third command next to the menu control's `(click)` and the drawer's `(closedStart)`; no new writable signal.

Alternatives considered:

- **`withRouterConfig({ onSameUrlNavigation: 'reload' })`** in `app.config.ts`, so a same-URL link is a real navigation and the existing rule closes the drawer. Rejected: a global change that also re-runs guards, resolvers and the title, re-binds route inputs, and moves focus to the main region on a same-page link, none of which the spec asks for.
- **Fold `NavigationSkipped` router events into the `linkedSignal` source** through `toSignal(router.events.pipe(filter(...)))`. It honours "however the navigation was started" for same-URL navigations, but adds an RxJS bridge for a case only the drawer's own links can trigger (while open, the drawer covers the page, so no other same-URL link is reachable). Rejected as more machinery than the behavior needs.

### 3. Test seams

- **e2e `e2e/src/cart-page.spec.ts`**, next to "announces the new quantity and Cart total, keeping focus on the control": a shopper with a Cart line at quantity 2 activates Decrease with Enter; the quantity status reads 1, Decrease `toBeDisabled()`, and Decrease `toBeFocused()`. Located by role and accessible name. Catches: focus dropping to the body, or the control no longer exposed as disabled. Misses: the announcement itself (VoiceOver step).
- **e2e `e2e/src/app-shell.spec.ts`**, under "on a narrow viewport with the navigation open": on `/catalog`, open the navigation and select the Catalog link; the URL stays `/catalog`, the menu control has `aria-expanded="false"`, and the navigation is hidden. Catches: the drawer staying open on a same-page link. Misses: the wide viewport, where the handler must be a no-op (covered by the existing "Navigating on a wide viewport" scenario, which selects a link while wide).
- **No unit seam.** No domain function, store or adapter changes, and the project writes no component specs.

### Signals and state

- Writable signals: none added. `opened` (`linkedSignal`, `src/app/app.ts`) is unchanged in definition and gains one command.
- Derived values: none added. The Decrease control's disabled state stays a template expression over `row.line.quantity`.
- `effect()`: none added.

### angular-developer references consulted

- `linked-signal`: a `linkedSignal` is writable, and `.set()` from an event handler holds until the source next changes, which is exactly the "shopper's toggle lasts until the next navigation" behavior the shell already relies on. It drove keeping `opened` as is and adding a command instead of a new source.
- `router-lifecycle` / `navigate-to-routes`: a same-URL `routerLink` yields `NavigationSkipped` under the default `onSameUrlNavigation`, so no `lastSuccessfulNavigation` change can be relied on. It drove closing on the link's own event and rejecting the `'reload'` option.
- `components` (template control flow and event bindings): the handler lives on the `@for`-generated links with a plain `(click)` binding.

## Risks / Trade-offs

- **[The focus indicator may not show on a disabled-interactive button]** → Material's `.mat-mdc-button-disabled-interactive` keeps pointer events but the project's 3 px focus ring is applied by its own styles; the VoiceOver and screenshot step checks the ring is visible on the dimmed Decrease button in both color schemes. If it is not, the cart page styles extend the focus-visible rule to that class as its own slice.
- **[A click on the dimmed Decrease still dispatches a store command]** → The domain clamp makes it a no-op on every derived value; the "Activating the disabled decrease action" scenario and the existing "cannot decrease it below 1" test cover it.
- **[The drawer now starts closing before a navigation to another page completes]** → Same end state as today, a few milliseconds earlier; the existing "closes the navigation once a link in it is followed" test and the "keeps the navigation open when opened while the shop is still starting" test (which does not select a link) stay as they are.
- **[axe or VoiceOver changes]** → Both edits touch a `ui` lib or the shell, so the full accessibility gate re-runs; the Decrease change adds a VoiceOver step and updates the conformance statement's date and the 2.4.3 and 4.1.2 notes.

## Migration Plan

Static deploy, no data. Each fix is a separate commit and can be reverted on its own.
