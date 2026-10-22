# Design

## Context

See proposal.md for the motivation and the full alias mapping. Today:

- `tsconfig.base.json` has 10 `paths` entries, all `@ngsample/<context>-<layer>`, each pointing at `./libs/<context>/<layer>/src/index.ts`.
- 35 `.ts` files under `libs/` and `src/app/` import through these aliases.
- `eslint.config.mjs` enforces module boundaries by tag (`scope:*`, `type:*`), not by alias. The only alias-based rule is a `no-restricted-imports` pattern, `@ngsample/*-testing`, that blocks test doubles in non-spec files.
- No spec, `CLAUDE.md` or `GLOSSARY.md` mentions an alias.

## Goals / Non-Goals

**Goals:**

- Every import uses the new alias, and no old alias is left in `tsconfig.base.json`, `libs/`, `src/` or `eslint.config.mjs`.
- The test-double import restriction still fires after the rename.

**Non-Goals:**

- Renaming Nx projects, moving folders, or changing tags and boundary constraints.
- Rewriting archived OpenSpec changes.

## Decisions

### D1: Change aliases only, keep Nx project names

Edit the `paths` keys in `tsconfig.base.json` and the import specifiers. Leave `project.json` names alone.

- Alternative: `nx g @nx/workspace:move` per lib, which also renames projects. Rejected: it churns `project.json` files and task commands, and the CLI gets no clearer from it.

### D2: `cart-ui-header` gets `@ngsample/cart/ui/header` and keeps its folder

It reads as part of the cart UI, which it is (`type:ui`). TypeScript `paths` without wildcards match keys exactly, so `@ngsample/cart/ui` and `@ngsample/cart/ui/header` resolve independently. The lib is still a separate project, as add-cart design D6 requires, so `cart/ui` stays lazy-loaded.

- Alternative: `@ngsample/cart/ui-header`, which matches the folder. Not chosen, at the user's request.
- Alternative: also move the folder to `libs/cart/ui/header`. Rejected: it nests a project inside `cart-ui`'s folder for no functional gain.

### D3: Testing restriction pattern becomes `@ngsample/*/testing`

`no-restricted-imports` patterns use gitignore syntax, where `*` doesn't cross `/`. So `@ngsample/*/testing` matches `@ngsample/catalog/testing` and any future `@ngsample/<context>/testing`.

### D4: Rewrite imports mechanically, from the longest alias to the shortest

Do the replacement as a scripted find-and-replace over `libs/` and `src/` `.ts` files.

- Order matters only for `cart-ui-header` versus `cart-ui`. Replacing `@ngsample/cart-ui-header` first keeps `@ngsample/cart-ui` from producing `@ngsample/cart/ui-header`.
- Anchor each match on the closing quote (`'@ngsample/cart-ui'`) so that it can't hit a prefix.

### Layering and TDD

No new pieces, no new dependencies and no state, so the layer/tag table, signals, ports, schemas and parsing boundaries don't apply. The `angular-developer` skill references aren't needed, because no Angular code changes. The work is a config and import refactor with no behavior change. Its tasks are marked `(exempt)` and are verified by the build, test and lint commands, plus a negative lint check for D3.

## Risks / Trade-offs

- [Risk] The ESLint testing pattern no longer matches, lint stays green, and the guardrail silently disappears. → Mitigation: a negative check. Temporarily import `@ngsample/catalog/testing` in a non-spec file, confirm `pnpm nx lint` fails, then revert.
- [Risk] A leftover old alias somewhere. → Mitigation: `git grep -E "@ngsample/(shared|catalog|cart)-"` over `libs/`, `src/`, `tsconfig.base.json` and `eslint.config.mjs` returns nothing. The build also fails on any unresolved import.
- [Risk] Nx or Vite caches resolve stale paths. → Mitigation: run `pnpm nx reset` before the verification runs.
- [Trade-off] `cart/ui/header` is the one alias that differs from its folder. Someone may later "fix" it. This design records the choice (D2).

## Migration Plan

One commit. Rollback is `git revert`, because nothing outside the workspace consumes the aliases.
