# ngsample

Angular 22 app in an Nx workspace (pnpm). Architecture and coding rules are in [CLAUDE.md](CLAUDE.md); changes are specified with [OpenSpec](openspec/).

```sh
pnpm install
pnpm nx serve ngsample   # dev server
pnpm nx build ngsample   # production build
pnpm nx test ngsample    # unit tests (Vitest)
pnpm nx e2e e2e          # end-to-end tests (Playwright)
```

## Pre-commit hook

`pnpm install` installs a git pre-commit hook ([simple-git-hooks](https://github.com/toplenboren/simple-git-hooks) + [nano-staged](https://github.com/usmanyunusov/nano-staged), config in `nano-staged.mjs`). On the staged files it runs `nx affected -t lint --fix`, which lints every project they touch and its dependents, then `prettier --write`. A lint error blocks the commit.

```sh
git commit --no-verify               # skip the hook once
SKIP_SIMPLE_GIT_HOOKS=1 git commit   # same, via env
pnpm run prepare                     # reinstall the hook after changing its config in package.json
```
