# Proposal

## Why

The `app-shell` requirement "Navigation destinations" says the navigation link for the section shown is marked as the current page, with two scenarios: "Current page marked" (`/cart`) and "Product detail" (`/catalog/1`). The shell implements this, but no e2e test asserts either scenario, so a regression in the marking (the cue screen readers announce as "current page") would pass every gate.

## What Changes

- Add two Playwright tests to `e2e/src/app-shell.spec.ts`, one per scenario, asserting the current-page marking through the links' `aria-current="page"` state, located by role and name inside the "Main" navigation.
- No production code changes; no requirement changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The behavior is already specified in `app-shell`; this change only covers it with tests (`skip_specs: true`).

## Impact

- Bounded context: none. The tests cover the app shell (`src/`, `type:app`), which belongs to no bounded context.
- New Nx libs: none. New GLOSSARY.md terms: none.
- Source (writable) state introduced: none.
- Affected files: `e2e/src/app-shell.spec.ts` only. The accessibility gate and `docs/accessibility/conformance.md` are unaffected, since no `ui` lib, shell code, or screen reader output changes.
