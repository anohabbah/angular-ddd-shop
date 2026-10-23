# Spec Delta

## ADDED Requirements

### Requirement: Add-to-cart confirmation

Each time the shopper adds a product to the Cart from its product detail, the shop SHALL show a brief confirmation, "Added to cart", that disappears on its own. The confirmation SHALL offer a "View cart" action that leads to the cart page.

#### Scenario: Adding a product

- **WHEN** the shopper adds product 1 to the Cart from its product detail
- **THEN** the confirmation "Added to cart" is shown with a "View cart" action

#### Scenario: Viewing the cart from the confirmation

- **WHEN** the confirmation is shown and the shopper selects "View cart"
- **THEN** the cart page at `/cart` is shown, with a Cart line for product 1

## MODIFIED Requirements

### Requirement: Item count in the header

Every page SHALL show a cart link in the header that leads to the cart page. The link SHALL show the item count, which is the sum of the quantities of all Cart lines, as a badge on the link. The badge SHALL be hidden when the item count is 0. The link's accessible name SHALL always state the item count: "Cart, 1 item" for an item count of 1, otherwise "Cart, <item count> items".

#### Scenario: Several lines and quantities

- **WHEN** the Cart has a line with a quantity of 3 and a line with a quantity of 1
- **THEN** the cart link shows a badge with an item count of 4 and its accessible name is "Cart, 4 items"

#### Scenario: One item

- **WHEN** the Cart has one line with a quantity of 1
- **THEN** the cart link's accessible name is "Cart, 1 item"

#### Scenario: Empty Cart

- **WHEN** the Cart is empty
- **THEN** the cart link shows no badge and its accessible name is "Cart, 0 items"

#### Scenario: Following the cart link

- **WHEN** the shopper is on a product detail and selects the cart link
- **THEN** the cart page at `/cart` is shown
