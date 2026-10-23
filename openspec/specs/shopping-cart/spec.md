# shopping-cart Specification

## Purpose

Lets shoppers collect the products they want to buy into a Cart, adjust how many of each they want, and see what the Cart costs.

## Requirements

### Requirement: Add to cart from the product detail

The product detail SHALL offer an "Add to cart" action. When a product is not in the Cart, adding it SHALL create a Cart line for it with a quantity of 1. Its Cart item is a snapshot of the product taken at that moment: its title, thumbnail, and its final price as the unit price.

#### Scenario: Adding a product to an empty Cart

- **WHEN** the Cart is empty and the shopper adds a product with a list price of 9.99 USD and a discount of 10.48% from its product detail
- **THEN** the Cart has one Cart line for that product, with a quantity of 1 and a unit price of 8.94 USD

#### Scenario: Adding a second, different product

- **WHEN** the Cart has a line for product 1 and the shopper adds product 2
- **THEN** the Cart has two Cart lines, product 1 first and product 2 second

### Requirement: Adding a product already in the Cart

When a product is already in the Cart, adding it again SHALL increase that Cart line's quantity by 1. The line keeps the Cart item it was first added with, so its title, thumbnail and unit price do not change, even if the product's final price has changed since.

#### Scenario: Adding the same product twice

- **WHEN** the Cart has a line for product 1 with a quantity of 1 and the shopper adds product 1 again
- **THEN** the Cart still has one Cart line for product 1, with a quantity of 2

#### Scenario: Final price changed since the first add

- **WHEN** product 1 was added at a final price of 8.94 USD and the shopper adds it again after its final price became 7.99 USD
- **THEN** the Cart line for product 1 has a quantity of 2 and a unit price of 8.94 USD

### Requirement: Quantity

A Cart line's quantity SHALL be a whole number of at least 1. On the cart page, the shopper SHALL be able to increase or decrease each line's quantity by 1. Decreasing SHALL be unavailable when the quantity is 1.

#### Scenario: Increasing a quantity

- **WHEN** a Cart line has a quantity of 2 and the shopper increases it
- **THEN** that Cart line has a quantity of 3

#### Scenario: Decreasing a quantity

- **WHEN** a Cart line has a quantity of 2 and the shopper decreases it
- **THEN** that Cart line has a quantity of 1

#### Scenario: Quantity of 1

- **WHEN** a Cart line has a quantity of 1
- **THEN** its decrease action is disabled and the line stays in the Cart

### Requirement: Removing a Cart line

On the cart page, the shopper SHALL be able to remove a Cart line, whatever its quantity. The other Cart lines keep their order and quantities.

#### Scenario: Removing one of two lines

- **WHEN** the Cart has lines for product 1 (quantity 3) and product 2 (quantity 1) and the shopper removes the line for product 1
- **THEN** the Cart has one Cart line, for product 2, with a quantity of 1

### Requirement: Line total

A Cart line's line total SHALL equal its unit price multiplied by its quantity, in the unit price's currency.

#### Scenario: Line with several units

- **WHEN** a Cart line has a unit price of 8.94 USD and a quantity of 3
- **THEN** its line total is 26.82 USD

### Requirement: Cart total

The Cart total SHALL equal the sum of the line totals of all Cart lines. An empty Cart has no Cart total.

#### Scenario: Two lines

- **WHEN** the Cart has a line with a line total of 26.82 USD and a line with a line total of 19.99 USD
- **THEN** the Cart total is 46.81 USD

#### Scenario: Empty Cart

- **WHEN** the Cart is empty
- **THEN** the cart page shows "Your cart is empty" and no Cart total

### Requirement: Single currency

All Cart lines SHALL share one currency. Adding a product whose final price is in a different currency from the Cart lines already in the Cart SHALL be refused, and the Cart SHALL stay unchanged.

#### Scenario: Product in another currency

- **WHEN** the Cart has a line priced in USD and the shopper adds a product whose final price is in EUR
- **THEN** the Cart is unchanged

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

### Requirement: Cart page presentation

The cart page at `/cart` SHALL list every Cart line in the order its product was first added. Each line SHALL show its title, thumbnail, unit price, quantity and line total. The page SHALL show the Cart total, and each title SHALL link to that product's detail.

#### Scenario: One line

- **WHEN** the Cart has a line for product 1 "Essence Mascara Lash Princess" with a unit price of 8.94 USD and a quantity of 3
- **THEN** the cart page shows "Essence Mascara Lash Princess" linking to `/catalog/1`, "$8.94", a quantity of 3, a line total of "$26.82", and a Cart total of "$26.82"

### Requirement: Cart lasts for the session

The Cart SHALL keep its lines while the shopper navigates between pages of the application. The Cart is not saved: reloading the application SHALL start with an empty Cart.

#### Scenario: Navigating away and back

- **WHEN** the shopper adds a product from its product detail, goes back to the product list, then opens the cart page
- **THEN** the cart page shows that product's Cart line

#### Scenario: Reload

- **WHEN** the Cart has lines and the shopper reloads the application
- **THEN** the Cart is empty

### Requirement: Add-to-cart confirmation

Each time the shopper adds a product to the Cart from its product detail, the shop SHALL show a brief confirmation, "Added to cart", that disappears on its own. The confirmation SHALL offer a "View cart" action that leads to the cart page.

#### Scenario: Adding a product

- **WHEN** the shopper adds product 1 to the Cart from its product detail
- **THEN** the confirmation "Added to cart" is shown with a "View cart" action

#### Scenario: Viewing the cart from the confirmation

- **WHEN** the confirmation is shown and the shopper selects "View cart"
- **THEN** the cart page at `/cart` is shown, with a Cart line for product 1
