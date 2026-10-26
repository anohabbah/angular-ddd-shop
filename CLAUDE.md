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
- The app (`src/`, tag `type:app`) only composes: lazy-loads context `ui` routes and registers `infrastructure` providers in `app.config.ts`. Exception: it owns the app shell (`App`: navigation layout and its UI state), since the shell belongs to no bounded context.
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
- RxJS only for time-based or external event streams (debounce, websockets, media queries via CDK `BreakpointObserver`), bridged with `toSignal()` / `toObservable()`. Exception: inside an adapter, to turn an `HttpClient` call into a Promise that cancels on an `AbortSignal`.

## Angular conventions

Follow the `angular-developer` skill and read its relevant references before writing code. In particular:

- Standalone components, `inject()`, signal `input()` / `output()` / `model()`, signal queries, `@if` / `@for` / `@switch`, self-closing tags.
- v20+ naming style (no `.component` / `.service` suffixes).
- Signal Forms for new forms, `resource()` over a port for HTTP reads (see Domain types above), lazy-loaded routes per context.
- Scaffold with Nx / Angular generators.
- Run `pnpm nx build` and `pnpm nx test` after every change and fix failures before moving on.

## Testing

TDD per the `tdd` skill: agree on seams before the first test, then one red → green vertical slice at a time. Refactoring happens at review, not inside the loop.

- Unit seams (Vitest), in order: domain functions (plain Vitest, no TestBed), application stores, infrastructure adapters (`HttpTestingController`).
- UI behavior is tested end-to-end with Playwright in `e2e/`, against the product source stubbed in `e2e/src/support/fixtures.ts`. Locate elements by role, label or text only; no CSS selectors or test ids.
- No component specs. Run `pnpm nx e2e e2e` with `pnpm nx build` and `pnpm nx test`.
- Accessibility (WCAG 2.2 AA): `e2e/src/accessibility.spec.ts` runs axe over the conformance matrix (every page and state × light/dark × 1280/390/320 px). Never disable or exclude a rule to make it pass.
- A change touching a `ui` lib or the app shell re-runs that gate. If it changes what a screen reader announces, run the VoiceOver check below.

### VoiceOver check

Playwright reads roles from its own accessibility tree, not from what VoiceOver says. A change it passes can still go silent in Safari: `<output>` without an explicit `role="status"` doesn't announce content inserted into it. So markup or role changes need this manual pass.

1. Pick the steps of `docs/accessibility/voiceover-script.md` whose elements the change touches.
2. Drive VoiceOver with `tools/voiceover.sh`: `pnpm nx serve`, then `source tools/voiceover.sh; vo_start`, `go <url>`, `into`, `to "<text>"`, `act`, and `poll` to catch announcements. It needs "Allow VoiceOver to be controlled with AppleScript" (VoiceOver Utility), Automation access for the terminal to VoiceOver, and Accessibility access for Tab and typing (`tab`, `typ`). If a permission is missing, ask the user. Never skip the step.
3. When a step fails, rerun it against the previous markup (`git show <base>:<file>`, restored afterwards) to tell a regression from a pre-existing failure. A regression is red: fix it as its own slice and rerun the step until it is green.
4. Record each step's result, plus the date and versions, in the script, and update the date and affected verdicts in `docs/accessibility/conformance.md`. A step not run stays Not verified there. `vo_stop` and stop the dev server when done.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
