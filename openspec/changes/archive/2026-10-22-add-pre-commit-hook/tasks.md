# Tasks

## 1. Test seams

- [x] 1.1 (exempt) Propose to the user that this change has no unit seams, because it is config only (TDD-exempt per CLAUDE.md), and that behavior is checked by the manual commit checks in group 4. Wait for confirmation. Verify: the user agrees.

## 2. Install and wire the hook

- [x] 2.1 (exempt) `pnpm add -D simple-git-hooks nano-staged`, with `simple-git-hooks: false` in `allowBuilds` (pnpm 12 requires an explicit decision). Verify: both appear in `devDependencies` and `pnpm install` succeeds.
- [x] 2.2 (exempt) Add `"prepare": "simple-git-hooks"` and a `"simple-git-hooks": { "pre-commit": "pnpm exec nano-staged" }` key to `package.json`, then run `pnpm install`. Verify: `.git/hooks/pre-commit` exists and calls nano-staged.
- [x] 2.3 (exempt) Create `nano-staged.mjs` as one function config (see design.md). It returns `[nx affected -t lint --fix --files=<code files + project.json, relative, comma-joined>` (only if any), `prettier --write --ignore-unknown <all files>]`. Verify: `pnpm exec nano-staged` on a staged, already clean `.ts` file exits 0, and its output shows the lint command and then the Prettier command.

## 3. Documentation

- [x] 3.1 (exempt) Add a short "Pre-commit hook" section to `README.md`. It says what runs, that the hook installs on `pnpm install`, how to skip it (`git commit --no-verify`, `SKIP_SIMPLE_GIT_HOOKS=1`), and that you re-run `pnpm exec simple-git-hooks` after changing the hook config. Verify: each command in the section runs as written.

## 4. Integration checks

Run these on a throwaway branch and delete it afterwards, so no test commits reach `main`.

- [x] 4.1 Stage a `.ts` file with Prettier violations and commit. Verify: `git show HEAD -- <file>` has the formatted content and `git status` is clean for that file.
- [x] 4.2 Stage an import that breaks `@nx/enforce-module-boundaries` (for example `type:domain` importing a `type:application` lib) and commit. Verify: the commit is rejected and the staged change is still there afterwards.
- [x] 4.3 Stage a tag change in `libs/cart/domain/project.json` that makes a _dependent_ project break a module boundary, without touching the dependent's files, and commit. Verify: the commit is rejected, and the error names the dependent project.
- [x] 4.4 Stage part of a file (keep other edits unstaged) and commit. Verify: the commit holds only the staged part, and the unstaged edits are still in the working tree.
- [x] 4.5 Stage a `.md` or non-`project.json` `.json` file only and commit. Verify: Prettier runs on it and no lint task runs.
- [x] 4.6 Run `pnpm nx run-many -t lint build test`. Verify: all pass (the config files don't break existing targets).
