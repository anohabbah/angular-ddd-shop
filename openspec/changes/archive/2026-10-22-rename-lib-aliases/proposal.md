# Proposal

## Why

Lib aliases are flat (`@ngsample/catalog-domain`), while folders are nested (`libs/catalog/domain`). Making each alias `@ngsample/<context>/<layer>` lets an import name the bounded context and the layer the same way the folder tree does.

## What Changes

- Rename every lib's path alias in `tsconfig.base.json`, and update every import that uses it:

  | Folder                        | Old alias                          | New alias                          |
  | ----------------------------- | ---------------------------------- | ---------------------------------- |
  | `libs/shared/domain`          | `@ngsample/shared-domain`          | `@ngsample/shared/domain`          |
  | `libs/catalog/domain`         | `@ngsample/catalog-domain`         | `@ngsample/catalog/domain`         |
  | `libs/catalog/application`    | `@ngsample/catalog-application`    | `@ngsample/catalog/application`    |
  | `libs/catalog/infrastructure` | `@ngsample/catalog-infrastructure` | `@ngsample/catalog/infrastructure` |
  | `libs/catalog/ui`             | `@ngsample/catalog-ui`             | `@ngsample/catalog/ui`             |
  | `libs/catalog/testing`        | `@ngsample/catalog-testing`        | `@ngsample/catalog/testing`        |
  | `libs/cart/domain`            | `@ngsample/cart-domain`            | `@ngsample/cart/domain`            |
  | `libs/cart/application`       | `@ngsample/cart-application`       | `@ngsample/cart/application`       |
  | `libs/cart/ui`                | `@ngsample/cart-ui`                | `@ngsample/cart/ui`                |
  | `libs/cart/ui-header`         | `@ngsample/cart-ui-header`         | `@ngsample/cart/ui/header`         |

- `@ngsample/cart/ui/header` deliberately differs from its folder (`libs/cart/ui-header`). The folder is not moved.
- Change the ESLint rule that keeps test doubles out of non-spec files from `@ngsample/*-testing` to `@ngsample/*/testing`, so it still matches the testing libs.
- **BREAKING** (workspace-internal only): the old aliases stop resolving. There are no external consumers.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This changes no behavior, so the change sets `skip_specs: true`.

## Impact

- Bounded contexts: `catalog`, `cart`, and the `shared` kernel. No new Nx libs and no new `GLOSSARY.md` terms.
- No new source state. No runtime code changes, only import specifiers.
- Files: `tsconfig.base.json`, `eslint.config.mjs`, and the import lines of the 35 `.ts` files under `libs/` and `src/app/` that use `@ngsample/*` aliases.
- Unchanged: Nx project names (`catalog-domain` etc.), so `nx test <project>` commands stay the same. Also unchanged: tags, module-boundary rules, and archived OpenSpec changes, which keep the old aliases as history.
