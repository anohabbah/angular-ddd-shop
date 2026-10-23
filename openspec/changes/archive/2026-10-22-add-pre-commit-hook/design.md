# Design

## Context

- pnpm 12 with `allowBuilds` in `pnpm-workspace.yaml`: install scripts of dependencies are blocked unless listed there. Root lifecycle scripts (`prepare`) still run.
- One root flat `eslint.config.mjs` (Nx base/typescript/angular/angular-template, module boundaries, `eslint-config-prettier`). The Nx ESLint plugin infers a `lint` target for each of the 12 projects. The app is a root project (`project.json` at `.`).
- Lint baseline is clean: `nx run-many -t lint --skip-nx-cache` passes in 4.3s.
- Prettier baseline is not quite clean: `e2e/playwright.config.mts` and two archived OpenSpec docs are unformatted. The hook will reformat them the next time they are staged.
- Facts read from the nano-staged 1.0.2 source (`lib/cmd-runner.js`, `lib/runner.js`, `lib/git-workflow.js`):
  - A function value gets `api.filenames` as **absolute** paths, and nothing is appended to the command it returns.
  - With a string value, the matched files are appended to the command.
  - **Different glob keys run in parallel.** The commands inside one key run in order.
  - A key with no matched files runs nothing.
  - Only **staged files** have their unstaged changes stashed and restored. Other files are left as they are in the working tree.

## Goals / Non-Goals

**Goals:**

- A lint error in any project affected by the staged files blocks the commit.
- Staged files are auto-fixed, formatted, and re-staged.
- Hooks install with no manual step after `pnpm install`.

**Non-Goals:**

- Running tests, type-check or build in the hook (too slow, and that's CI's job).
- Reformatting the whole repo or fixing the three unformatted files now.
- CI enforcement.

## Decisions

### Hook installer: `simple-git-hooks` via `"prepare": "simple-git-hooks"`

The config goes in the `"simple-git-hooks"` key of `package.json`: `{ "pre-commit": "pnpm exec nano-staged" }`. `prepare` is used instead of adding the package to `allowBuilds`, because the package's own postinstall would otherwise be blocked by pnpm 12. Husky was not chosen: the user asked for simple-git-hooks, and it has no dependencies.

### Lint: `nx affected -t lint --fix --files=<relative, comma-joined>`

The user chose this over `eslint --fix <files>` so that a staged change that breaks a _dependent_ project is caught, and so the Nx cache is used. It needs a function value in the nano-staged config: Nx's `--files` is one string option, and nano-staged's paths are absolute, so the function converts them with `path.relative(process.cwd(), f)` and joins them with `,`.

### Format: `prettier --write --ignore-unknown <files>`

Prettier is called directly rather than through `nx format:write`: it's the same formatter with one less layer, and it takes the file list nano-staged gives it. `.prettierrc` and `.prettierignore` apply as usual.

### Config file: `nano-staged.mjs`, one function over all staged files

```
(all staged files) -> [ nx affected lint --fix --files=<code files + project.json>,   (only if any)
                        prettier --write --ignore-unknown <all files> ]               (in order)
```

A function export becomes nano-staged's single `*` key, so its commands run in order: lint first, then Prettier, so Prettier's output is what gets committed. Separate glob keys would run in parallel and could edit the same file at the same time.

Lint is triggered by code files (`.ts`, `.mts`, `.mjs`, `.js`, `.html`) **and `project.json`**. Lint doesn't use type information, so the only way to break a _dependent_ project's lint without touching its files is a change to a lib's tags in `project.json`, for example retagging `cart-domain` so that `catalog-domain`'s import of it breaks a boundary. `.mjs` is used because `package.json` has no `"type": "module"`.

## Risks / Trade-offs

- [Unstaged WIP in _other_ files of an affected project gets linted, and `--fix` may edit it] → This is accepted with B. A lint error in WIP that isn't being committed will block the commit. Fix it or stash it. The edits stay uncommitted in the working tree.
- [Fixes in dependent projects are not added to the commit] → With a clean lint baseline, `--fix` only has something to change in files you edited, which are usually staged.
- [Commit latency up to about 4s when a root config file is staged and every project is affected] → Nx cache. `git commit --no-verify` or `SKIP_SIMPLE_GIT_HOOKS=1` skip the hook.
- [Other config that affects lint (`tsconfig*.json`, `package.json`, `nx.json`) doesn't trigger lint] → It's rare, CI's full lint catches it, and `eslint.config.mjs` is already covered as an `.mjs` file.
- [Paths with spaces would break the argument splitting] → No tracked path contains a space today.
- [Changing the `simple-git-hooks` config doesn't update an installed hook] → The README says to re-run `pnpm exec simple-git-hooks`.

## Migration Plan

Contributors get the hook on their next `pnpm install`. To roll back, remove the config and dependencies, then run `node node_modules/simple-git-hooks/uninstall.js` (or delete `.git/hooks/pre-commit`).
