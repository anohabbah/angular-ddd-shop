# ngsample

An online shop where shoppers browse products for sale. The terms below are grouped by bounded context.

## Shared kernel

**Money**:
An amount in a specific currency, never negative.
_Avoid_: Amount, value, cost

**Shopper**:
A person browsing the shop.
_Avoid_: User, customer, visitor

**Product id**:
The positive whole number that identifies a Product.
_Avoid_: SKU, product code

## Catalog

The products offered for sale, and how shoppers find and view them.

**Catalog**:
The set of products offered for sale.
_Avoid_: Shop, store, inventory

**Product**:
An item offered for sale in the Catalog.
_Avoid_: Item, article, listing

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

## Cart

The products a Shopper has chosen to buy, and how many of each.

**Cart**:
The Cart lines a Shopper has collected during their visit, in the order their products were first added.
_Avoid_: Basket, bag, order

**Cart item**:
The snapshot of a Product taken when it is first added to the Cart: its Product id, title, thumbnail and Unit price.
_Avoid_: Cart product, entry

**Cart line**:
One Cart item in the Cart together with its Quantity.
_Avoid_: Row, line item, entry

**Quantity**:
How many of a Cart line's product the Shopper wants: a whole number of at least 1.
_Avoid_: Amount, count, qty

**Unit price**:
The Final price of a Product at the moment it was first added to the Cart.
_Avoid_: Price, item price

**Line total**:
A Cart line's Unit price multiplied by its Quantity.
_Avoid_: Subtotal, line price

**Cart total**:
The sum of the Line totals of all Cart lines.
_Avoid_: Total price, grand total, order total

**Item count**:
The sum of the Quantities of all Cart lines.
_Avoid_: Cart size, number of items
