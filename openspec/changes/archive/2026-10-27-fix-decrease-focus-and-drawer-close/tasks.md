# Tasks

## 1. Test seams

- [x] 1.1 Propose the test seams and wait for the user's confirmation before writing any test. Done when the user confirms.
  - **Seam: e2e `e2e/src/cart-page.spec.ts`, Cart line controls by role and accessible name.**
    - Catches: focus dropping to the document body when Decrease reaches 1, or Decrease no longer exposed as disabled at 1.
    - Misses: what VoiceOver announces (task 2.3), and the focus ring's visibility (task 2.4).
  - **Seam: e2e `e2e/src/app-shell.spec.ts`, narrow viewport (390 px), the "Main" navigation and the "Open navigation" menu control by role and name.**
    - Catches: the navigation staying open, or the menu control still reporting expanded, after the current page's link is selected.
    - Misses: the wide viewport, where selecting a link must leave the navigation visible; the existing "Navigating on a wide viewport" scenario covers it.
  - **No unit seam.** The domain already clamps a decrease at 1 (`decreaseQuantity` tests), `CartStore` is unchanged, and the project writes no component specs.

## 2. Decrease keeps focus at quantity 1 (shopping-cart "Quantity")

- [x] 2.1 Red - with a Cart line for "Essence Mascara Lash Princess" at quantity 2, activating "Decrease quantity of Essence Mascara Lash Princess" with Enter leaves the "Quantity of Essence Mascara Lash Princess" status reading 1, the Decrease button disabled, and focus still on the Decrease button, at the cart-page e2e seam. Verify: the new test fails on the focus assertion (the active element is the body).
- [x] 2.2 Green - minimal code to pass: add `disabledInteractive` to the Decrease button in `libs/cart/ui/src/lib/cart-page/cart-page.html` (design.md, Decision 1), nothing else. Verify: the new test passes, and the existing "increases a quantity, and cannot decrease it below 1" test still passes (its `toBeDisabled()` now reads `aria-disabled`).
- [x] 2.3 VoiceOver check (`docs/accessibility/voiceover-script.md`, section 4): add step 4.8, "One line at quantity 2: Tab to Decrease, VO+Space; announces the new quantity 1 and the Cart total, then 'dimmed' for the button, and focus stays on it", run it with `tools/voiceover.sh` and rerun 4.4 since the same line's controls changed; record the results, date and versions in the script. Verify: both steps recorded as Pass; a failure is a regression to fix as its own slice before moving on.
  - Result: both recorded as Fail (pre-existing): the quantity is not heard in either step, with the previous markup too, the deferred V4.4 gap. V4.8's dimmed state and focus pass, so no regression.
- [x] 2.4 Check the focus ring on the dimmed Decrease button in both color schemes (screenshots at 1280 px, as for conformance 2.4.7). Verify: the ring is visible on the disabled-interactive button; if it is not, add a slice extending the cart page's focus-visible styles to `.mat-mdc-button-disabled-interactive` and re-check.
  - Result (2026-10-27): visible in both schemes, a 3 px primary ring at 6.17:1 (light) and 10.92:1 (dark) against the page; recorded in `conformance.md`.
- [x] 2.5 (exempt) Update `docs/accessibility/conformance.md`: the date, the V row (step 4.8 added and 4.4 rerun), and the notes of 2.4.3 Focus Order and 4.1.2 Name, Role, Value to mention the Decrease control staying focusable and `aria-disabled`. Verify: the statement's date matches the VoiceOver run and the two notes cite V4.8.

## 3. Navigation closes on the current page's link (app-shell "Navigation closes after navigating on narrow viewports")

- [x] 3.1 Red - at 390 px on `/catalog` with the navigation open, selecting the Catalog link in the "Main" navigation leaves the URL at `/catalog`, sets "Open navigation" to `aria-expanded="false"` and hides the navigation, at the app-shell e2e seam. Verify: the new test fails with `aria-expanded` still `"true"`.
- [x] 3.2 Green - minimal code to pass: `(click)="closeNavigation()"` on the navigation links in `src/app/app.html` and a `closeNavigation()` command in `src/app/app.ts` that sets `opened` to false only when the viewport is not wide (design.md, Decision 2). Verify: the new test passes, and the existing "closes the navigation once a link in it is followed", "keeps the navigation open when opened while the shop is still starting" and wide-viewport navigation tests still pass.
- [x] 3.3 Re-run the accessibility gate for the shell change (`e2e/src/accessibility.spec.ts` within `pnpm nx e2e e2e`). Verify: it passes. The shell's markup and announcements are unchanged (same `aria-expanded` states, reached one more way), so no VoiceOver step or conformance verdict changes; note that in the change summary.
  - Result: the gate passed in the full `pnpm nx e2e e2e` run; no VoiceOver step or conformance verdict changed for the shell.

## 4. Review

- [x] 4.1 Review the two new e2e tests against their neighbours (naming, `describe` placement, `exact: true` link names, no CSS selectors or test ids) and the two production edits against CLAUDE.md (no `effect()` writes, no new state, no cross-lib relative imports); refactor if needed. Verify: `pnpm nx lint` and the e2e tests still pass.
- [x] 4.2 Code review follow-ups: test the "Activating the disabled decrease action" scenario at the cart-page e2e seam (Enter and Space on the dimmed Decrease leave the line, its quantity 1, the Cart total and focus unchanged; red against a decrease without the clamp), record the 2.4 focus-ring measurement, and record V4.8 as a pre-existing Fail. Verify: `pnpm nx e2e e2e` passes.

## 5. Verification

- [x] 5.1 Run `pnpm nx build`, `pnpm nx test` and `pnpm nx e2e e2e`; verify all pass.
