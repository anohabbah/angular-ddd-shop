# Tasks

## 1. Seams

- [x] 1.1 Propose the test seam and wait for user confirmation before any test: e2e `e2e/src/app-shell.spec.ts`, wide viewport (1280px), asserting `aria-current="page"` on links found by role and name in the "Main" navigation. Catches: the wrong link, or no link, marked as the current page for a route, including the `/catalog/1` prefix match. Misses: the visual `activated` pill (left to the existing inset test and axe), and the narrow viewport (same link markup). Verify: user confirms the seam.

## 2. Current page marked (app-shell "Navigation destinations")

- [x] 2.1 Red - on `/cart`, the "Cart" navigation link has `aria-current="page"` and the "Catalog" link has no `aria-current`, at the app-shell e2e seam. The behavior already exists, so prove the test can fail: temporarily remove both `[activated]="link.isActive"` and `ariaCurrentWhenActive="page"` from `src/app/app.html` (Material's list item sets `aria-current="page"` on an activated anchor by itself, so removing only `ariaCurrentWhenActive` leaves the test green) and verify the test fails on the missing attribute
- [x] 2.2 Green - restore `src/app/app.html` unchanged (verify `git diff src/` is empty) and verify the test passes

## 3. Product detail (app-shell "Navigation destinations")

- [x] 3.1 Red - on `/catalog/1`, the "Catalog" navigation link has `aria-current="page"`, at the app-shell e2e seam. Prove it can fail: temporarily set `[routerLinkActiveOptions]="{ exact: true }"` on the navigation links in `src/app/app.html` and verify the test fails
- [x] 3.2 Green - restore `src/app/app.html` unchanged (verify `git diff src/` is empty) and verify the test passes

## 4. Review

- [x] 4.1 Review the new tests against the neighboring tests in `e2e/src/app-shell.spec.ts` (naming, `describe` placement under "on a wide viewport", `exact: true` link names, no CSS selectors or test ids) and refactor if needed; verify the e2e tests still pass

## 5. Verification

- [x] 5.1 Run `pnpm nx build`, `pnpm nx test` and `pnpm nx e2e e2e`; verify all pass
