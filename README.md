# ngsample

Angular 22 app in an Nx workspace (pnpm). Architecture and coding rules are in [CLAUDE.md](CLAUDE.md); changes are specified with [OpenSpec](openspec/).

```sh
pnpm install
pnpm nx serve ngsample   # dev server
pnpm nx build ngsample   # production build
pnpm nx test ngsample    # unit tests (Vitest)
pnpm nx e2e e2e          # end-to-end tests (Playwright)
```
