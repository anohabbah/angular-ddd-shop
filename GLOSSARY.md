# ngsample

An online shop where shoppers browse products for sale. The terms below are grouped by bounded context.

## Shared kernel

**Money**:
An amount in a specific currency, never negative.
_Avoid_: Amount, value, cost

**Shopper**:
A person browsing the shop.
_Avoid_: User, customer, visitor

## Catalog

The products offered for sale, and how shoppers find and view them.

**Catalog**:
The set of products offered for sale.
_Avoid_: Shop, store, inventory

**Product**:
An item offered for sale in the Catalog.
_Avoid_: Item, article, listing

**Product id**:
The positive whole number that identifies a Product.
_Avoid_: SKU, product code

**Product source**:
The external system the Catalog reads its Products from.
_Avoid_: Backend, API, repository

**List price**:
The Money a Product costs before its Discount.
_Avoid_: Original price, base price, MSRP

**Discount**:
The percentage, from 0 to 100, taken off a Product's List price.
_Avoid_: Sale, reduction, rebate

**Final price**:
A Product's List price reduced by its Discount: what the Shopper pays.
_Avoid_: Sale price, discounted price, net price

**Price display**:
The prices shown for a Product: its Final price, and its List price when the two differ.
_Avoid_: Price label

**Search term**:
The text a Shopper types to narrow the Catalog.
_Avoid_: Query, keyword, filter

**Settled search term**:
The Search term once the Shopper has paused typing, without surrounding whitespace. It is the term the product list follows.
_Avoid_: Debounced query, final term
