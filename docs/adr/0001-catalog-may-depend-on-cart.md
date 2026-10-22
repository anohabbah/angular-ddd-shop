# Catalog may depend on Cart, one-way

Bounded contexts may normally depend only on themselves and the shared kernel. The Cart is the exception. A Product must be added to the Cart from the Catalog's product detail, and the layer rules leave no neutral place to bind a port to the Cart. We therefore let `scope:catalog` depend on `scope:cart`. The intended edges are `catalog-domain -> cart-domain` (translating a Product into a Cart item) and `catalog-ui -> cart-application` (the "Add to cart" action). The Cart never imports the Catalog: it stores a snapshot Cart item in its own terms. `ProductId` lives in the shared kernel so both contexts can name products.

## Considered Options

- **Cart depends on Catalog** (Cart lines hold a Product and price it live). The button would still need Catalog -> Cart, making the dependency mutual. Rejected.
- **A cart port in the shared kernel.** The app may only depend on ui and infrastructure, and infrastructure only on domain, so no layer can bind the port to the Cart's store. Rejected.
- **Relax only `catalog-ui`.** A narrower edge, but the Product-to-Cart-item translation would move out of pure domain code, and lint would need a per-project rule. Rejected for simplicity.

## Consequences

- Lint allows any catalog lib to import cart libs. Review watches for edges beyond the two above.
- Cart prices are snapshots taken when a product is first added. The Cart does not reflect later Catalog price changes.
- Any further cross-context edge needs its own ADR.
