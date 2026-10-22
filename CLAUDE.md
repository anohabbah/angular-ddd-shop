# ngsample

Angular 22 single app in an Nx workspace, pnpm, Vitest. Build: `pnpm nx build`. Test: `pnpm nx test`.

## Scope

The rules below apply to production code. Exempt: one-off scripts, config, docs, generated code.

## Architecture: DDD with Nx libs

- Each bounded context is a folder of Nx libs, one lib per layer, tagged `scope:<context>` and `type:<layer>`:
  - `libs/<context>/domain` (`@nx/js:library`, no Angular, RxJS or HTTP imports): zod/mini schemas for entities and value objects, domain functions, and ports. Write ports as abstract classes: they double as DI tokens without importing Angular.
  - `libs/<context>/application` (`@nx/angular:library`): the context's state and use cases, as injectable stores that expose signals and call domain functions. State keyed by a component input (e.g. a route param) is a factory function called in an injection context, taking the input as a signal, never a store holding a copy of it.
  - `libs/<context>/infrastructure` (`@nx/angular:library`): adapters (HTTP, storage) implementing domain ports, exported as DI providers.
  - `libs/<context>/ui` (`@nx/angular:library`): components and lazy-loaded routes.
  - `libs/<context>/testing` (`@nx/js:library`, tag `type:testing`): test doubles for the context's ports, imported by spec files only.
- Shared kernel: `libs/shared/<layer>`, tagged `scope:shared`.
- The app (`src/`, tag `type:app`) only composes: lazy-loads context `ui` routes and registers `infrastructure` providers in `app.config.ts`.
- Allowed dependencies:
  - `type:app → ui, infrastructure`
  - `type:ui → application, domain`
  - `type:application → domain`
  - `type:infrastructure → domain`
  - `type:domain → domain`
  - `type:testing → domain`; any layer's spec files may also import `type:testing`
  - `scope:<context> → same scope, scope:shared`
  - Recorded exception: `scope:catalog → scope:cart`, one-way ([ADR 0001](docs/adr/0001-catalog-may-depend-on-cart.md)). Any other cross-context edge needs its own ADR.
- `pnpm nx lint` enforces these (`@nx/enforce-module-boundaries` in `eslint.config.mjs`). A new bounded context needs its own `scope:<context>` constraint there.
- Import a lib only through its path alias (its `index.ts` public API), never by relative path into another lib.
- Name things in the ubiquitous language from `GLOSSARY.md`. Add new terms there (`domain-modeling` skill).

## Domain types and validation: zod/mini

- Import only `import * as z from 'zod/mini'` (never `zod`), to keep bundles small.
- Define entities and value objects as schemas in `domain`; derive TS types with `z.infer`. No hand-written duplicate interfaces. Invariants (e.g. non-negative price) live in schema checks.
- Parse untrusted data at the boundary, once:
  - HTTP behind a domain port: `Schema.parse` in the infrastructure adapter; the store reads the port with `resource()`. Use `httpResource(..., { parse: Schema.parse })` only where no port is involved.
  - Storage and URL params: parse in the adapter or route input.
  - Forms: `validateStandardSchema(path, Schema)` reusing the domain schema.
- Inside `domain` and `application`, trust typed data and don't re-parse.

## Reactivity: declarative

Declare what state _is_; never write code that keeps state in sync.

- Keep writable signals to the minimal source state; derive everything else.
- Derived: `computed()`. Derived but user-overridable: `linkedSignal()`. Async from state: `resource()` / `httpResource()`.
- Derivation logic lives in pure domain functions; `computed()` just calls them, e.g. `total = computed(() => cartTotal(this.items()))`.
- `.set()` / `.update()` only in commands triggered by events (store methods, event handlers).
- `effect()` / `afterRenderEffect()` only sync outward to non-signal APIs (storage, canvas, third-party libs, analytics) and never write to signals.
- No subscribe-and-assign, no deriving state in `ngOnInit` / `ngOnChanges`.
- RxJS only for time-based streams (debounce, websockets), bridged with `toSignal()` / `toObservable()`. Exception: inside an adapter, to turn an `HttpClient` call into a Promise that cancels on an `AbortSignal`.

## Angular conventions

Follow the `angular-developer` skill and read its relevant references before writing code. In particular:

- Standalone components, `inject()`, signal `input()` / `output()` / `model()`, signal queries, `@if` / `@for` / `@switch`, self-closing tags.
- v20+ naming style (no `.component` / `.service` suffixes).
- Signal Forms for new forms, `resource()` over a port for HTTP reads (see Domain types above), lazy-loaded routes per context.
- Scaffold with Nx / Angular generators.
- Run `pnpm nx build` and `pnpm nx test` after every change and fix failures before moving on.

## Testing

TDD per the `tdd` skill: agree on seams before the first test, then one red → green vertical slice at a time. Refactoring happens at review, not inside the loop. Preferred seams, in order: domain functions (plain Vitest, no TestBed), application stores, components (through the DOM or harnesses).
