# Spec Delta

## MODIFIED Requirements

### Requirement: Add-to-cart confirmation

While the product shown on the product detail is in the Cart, the product detail SHALL show, next to the "Add to cart" action, a status message "Quantity in cart: <quantity>" stating that product's Cart line quantity, and a "View cart" link that leads to the cart page. Assistive technologies SHALL announce the message whenever the quantity changes, without moving focus. The message SHALL NOT disappear on its own. It is absent while the product is not in the Cart.

#### Scenario: Adding a product

- **WHEN** the Cart is empty and the shopper adds product 1 to the Cart from its product detail
- **THEN** the status message "Quantity in cart: 1" is shown with a "View cart" link, and focus stays on "Add to cart"

#### Scenario: Adding the same product again

- **WHEN** the product detail shows "Quantity in cart: 1" and the shopper adds the product again
- **THEN** the status message reads "Quantity in cart: 2"

#### Scenario: Message stays

- **WHEN** the shopper has added product 1 and then waits 10 seconds without acting
- **THEN** the status message and the "View cart" link are still shown

#### Scenario: Product already in the Cart

- **WHEN** the Cart has a line for product 1 with a quantity of 3 and the shopper opens `/catalog/1` through the navigation
- **THEN** the status message "Quantity in cart: 3" is shown with a "View cart" link

#### Scenario: Viewing the cart from the confirmation

- **WHEN** the status message is shown and the shopper selects "View cart"
- **THEN** the cart page at `/cart` is shown, with a Cart line for product 1

## ADDED Requirements

### Requirement: Cart line controls name their product

Each Cart line's controls SHALL have accessible names that include the line's product title: "Decrease quantity of <title>", "Increase quantity of <title>" and "Remove <title>".

#### Scenario: Two lines

- **WHEN** the Cart has lines for "Essence Mascara Lash Princess" and "Eyeshadow Palette with Mirror"
- **THEN** the cart page has buttons named "Remove Essence Mascara Lash Princess" and "Remove Eyeshadow Palette with Mirror", and no button named only "Remove"

### Requirement: Quantity and Cart total announced

Each Cart line's quantity SHALL be exposed as "Quantity of <title>". The quantity and the Cart total SHALL be status messages, so that assistive technologies announce their new values when they change, without moving focus.

#### Scenario: Increasing a quantity

- **WHEN** the Cart has one line for "Essence Mascara Lash Princess" with a quantity of 1 and a unit price of 8.94 USD, and the shopper increases it
- **THEN** the status message "Quantity of Essence Mascara Lash Princess" reads 2, the Cart total status message reads "Cart total: $17.88", and focus stays on the increase button

### Requirement: Focus after removing a Cart line

After the shopper removes a Cart line, keyboard focus SHALL move to the Remove button of the line that followed it. If there was none, focus SHALL move to the Remove button of the line before it. If the Cart is then empty, focus SHALL move to the "Your cart is empty" message.

#### Scenario: Removing the first of two lines

- **WHEN** the Cart has lines for product 1 and product 2, and the shopper removes the line for product 1 with the keyboard
- **THEN** focus is on "Remove Eyeshadow Palette with Mirror"

#### Scenario: Removing the last line in the list

- **WHEN** the Cart has lines for product 1 and product 2, and the shopper removes the line for product 2
- **THEN** focus is on "Remove Essence Mascara Lash Princess"

#### Scenario: Removing the only line

- **WHEN** the Cart has one line and the shopper removes it
- **THEN** the cart page shows "Your cart is empty" and that message has focus
