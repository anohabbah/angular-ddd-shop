# Spec Delta

## ADDED Requirements

### Requirement: Price display in text

Wherever a product's Price display is shown, its text alternative SHALL say which value is which: the Final price as "Final price <amount>" and, when shown, the List price as "List price <amount>". The visual presentation stays as it is: the List price is struck through.

#### Scenario: Discounted product read out

- **WHEN** the product list contains a product with a Final price of 8.94 USD and a List price of 9.99 USD
- **THEN** that entry's text reads "Final price $8.94" and "List price $9.99"

#### Scenario: Product without discount read out

- **WHEN** the product list contains a product with a Final price of 19.99 USD and no List price shown
- **THEN** that entry's text reads "Final price $19.99" and contains no List price

### Requirement: Thumbnails are decorative

A product thumbnail SHALL have no text alternative, because the product's title is always shown next to it. A product's link in the product list SHALL have an accessible name that contains the product's title exactly once.

#### Scenario: Product link name

- **WHEN** the product list contains "Essence Mascara Lash Princess"
- **THEN** its link's accessible name contains "Essence Mascara Lash Princess" once, followed by its prices

### Requirement: Product list heading

The product list SHALL have the level-one heading "Catalog" in every state: loaded, loading, failed and with no matches.

#### Scenario: Product source unavailable

- **WHEN** the product source responds with a server error
- **THEN** the page has the level-one heading "Catalog" and shows the error message

### Requirement: Product list outcome announced

The outcome of each settled search term SHALL be stated in a status message that assistive technologies announce without moving focus: "1 product" or "<count> products" when products match, otherwise "No products match" followed by the settled search term.

#### Scenario: Several matches

- **WHEN** the settled search term is "a" and the product source returns 2 products
- **THEN** the status message reads "2 products"

#### Scenario: One match

- **WHEN** the settled search term is "iphone" and the product source returns 1 product
- **THEN** the status message reads "1 product"

#### Scenario: No matches

- **WHEN** the settled search term is "zzzz" and the product source returns no products
- **THEN** the status message reads "No products match \"zzzz\"" and focus stays in the search field

### Requirement: Product detail heading in every state

The product detail SHALL have one level-one heading in every state. It SHALL be the product's title when the product is loaded, "Product not found" for an unknown product, and "Product" while the product loads or after the product source fails.

#### Scenario: Unknown product

- **WHEN** the shopper opens `/catalog/abc`
- **THEN** the level-one heading is "Product not found"

#### Scenario: Product source unavailable

- **WHEN** the product source responds with a server error for `/catalog/1`
- **THEN** the level-one heading is "Product" and the error message is shown as an alert
