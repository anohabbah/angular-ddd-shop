# Tasks

## 1. Test seams

- [x] 1.1 (exempt) Confirm with the user that this change adds no test seams. It changes no behavior, so the existing specs pass unchanged and act as the regression net. Verify: the user agrees before task 2.1.

## 2. Rename aliases

- [x] 2.1 (exempt) In `tsconfig.base.json`, replace the 10 `paths` keys with the new aliases from proposal.md. Keep the targets as they are. Verify: `git grep -E "@ngsample/(shared|catalog|cart)-" tsconfig.base.json` returns nothing.
- [x] 2.2 (exempt) Rewrite the import specifiers in the `.ts` files under `libs/` and `src/`, longest alias first and anchored on the closing quote (design D4). Verify: `git grep -E "@ngsample/(shared|catalog|cart)-" -- libs src` returns nothing, and `git grep -n "@ngsample/cart/ui-header"` returns nothing.

## 3. Keep the testing-import guardrail

- [x] 3.1 (exempt) In `eslint.config.mjs`, change the `no-restricted-imports` pattern `@ngsample/*-testing` to `@ngsample/*/testing` (design D3). Verify: `pnpm nx run-many -t lint` passes.
- [x] 3.2 Negative check: temporarily add `import { FakeProductSource } from '@ngsample/catalog/testing';` to a non-spec file in `libs/catalog/ui`. Confirm `pnpm nx lint catalog-ui` fails with "Test doubles are for spec files only.", then revert it and confirm lint passes again.

## 4. Integration

- [x] 4.1 Run `pnpm nx reset`, then `pnpm nx build` and `pnpm nx test`. Verify that both pass with the same test count as before the change.
- [x] 4.2 Review: `git diff --stat` touches only `tsconfig.base.json`, `eslint.config.mjs`, the import lines in `libs/` and `src/`, and nothing under `openspec/changes/archive/`.
