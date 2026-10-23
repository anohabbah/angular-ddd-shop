# Proposal

## Why

Nothing checks code before it is committed today: lint (including `@nx/enforce-module-boundaries`, which guards the DDD layering in CLAUDE.md) and Prettier only run when someone remembers to. A boundary violation or unformatted file can land in a commit unnoticed.

## What Changes

- Add a git pre-commit hook, installed automatically on `pnpm install`, using `simple-git-hooks`.
- The hook runs `nano-staged` over the staged files:
  - Lintable files (`*.{ts,mts,mjs,js,html}`): `nx affected -t lint --fix` with the staged files as `--files`, so every project touched by the commit, plus its dependents, is linted. Then `prettier --write` on those files.
  - Other formattable files (`*.{json,md,yaml,yml,css,scss}`): `prettier --write`.
- A lint error blocks the commit. Auto-fixes and formatting on staged files are added to the commit.
- New dev dependencies: `simple-git-hooks`, `nano-staged`.
- README documents the hook and how to skip it.

## Capabilities

### New Capabilities

None. This is developer tooling with no product behavior, so the change sets `skip_specs: true`.

### Modified Capabilities

None.

## Impact

- `package.json`: `prepare` script, `simple-git-hooks` config, two dev dependencies.
- New `nano-staged.mjs` at the workspace root.
- `README.md`: a short pre-commit section.
- No bounded context, Nx lib, domain term or signal state is touched.
- Every contributor's commits get slower by one affected-lint run (worst case is about 4s across all 12 projects without the cache).
