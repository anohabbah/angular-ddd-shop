# product-catalog Specification

## Purpose

Lets shoppers browse and search the products offered for sale in the Catalog and see each product's details and prices.

## Requirements

### Requirement: Final price

A product's final price SHALL equal its list price reduced by its discount percentage, rounded to the nearest minor unit (cent), in the list price's currency. A product with no discount has a final price equal to its list price.

#### Scenario: Discounted product

- **WHEN** a product has a list price of 9.99 USD and a discount of 10.48%
- **THEN** its final price is 8.94 USD

#### Scenario: Product without discount

- **WHEN** a product has a list price of 19.99 USD and a discount of 0%
- **THEN** its final price is 19.99 USD

### Requirement: Valid product data only

The Catalog SHALL show only products whose data is valid. A list price is never negative, and a discount is between 0% and 100% inclusive. If the product source returns data that breaks these rules or is missing required fields, the Catalog SHALL show an error state instead of partial or wrong products.

#### Scenario: Negative price from the source

- **WHEN** the product source returns a product with a price of -1
- **THEN** the Catalog shows an error state and no products

#### Scenario: Discount above 100%

- **WHEN** the product source returns a product with a discount of 120%
- **THEN** the Catalog shows an error state and no products

### Requirement: Product list follows the settled search term

The product list SHALL be the products from the product source that match the settled search term. The settled search term is the search term after leading and trailing whitespace is removed. When the settled search term is empty, the product list SHALL be the first page of all products.

#### Scenario: No search term

- **WHEN** the shopper opens the Catalog without typing a search term
- **THEN** the product list shows the first page of all products

#### Scenario: Search term with surrounding whitespace

- **WHEN** the search term is " phone " and it has settled
- **THEN** the product list shows the products matching "phone"

#### Scenario: Blank search term

- **WHEN** the search term is " " and it has settled
- **THEN** the product list shows the first page of all products

### Requirement: Search term settles after typing pauses

A search term SHALL become the settled search term only after 300 ms pass with no further change. Intermediate terms typed within 300 ms of each other SHALL never become the settled search term, and no products are requested for them.

#### Scenario: Fast typing

- **WHEN** the shopper types "p", "ph", "pho" with less than 300 ms between keystrokes and then pauses
- **THEN** products are requested only for "pho", 300 ms after the last keystroke

#### Scenario: Unchanged term after pause

- **WHEN** the settled search term is "phone" and the shopper types a character and deletes it within 300 ms
- **THEN** no new products are requested

### Requirement: Product list presentation

Each product in the product list SHALL show its title, thumbnail, and final price. A product's list price SHALL also be shown, as a struck-through value, only when it differs from its final price. Each product SHALL link to its product detail.

#### Scenario: Discounted product in the list

- **WHEN** the product list contains a product with a list price of 9.99 USD and a final price of 8.94 USD
- **THEN** that entry shows "$8.94" and a struck-through "$9.99"

#### Scenario: Selecting a product

- **WHEN** the shopper selects the product with id 1 in the product list
- **THEN** the shopper is taken to `/catalog/1`

### Requirement: Product list states

While products are loading, the Catalog SHALL show a loading indicator. When the settled search term matches no products, the Catalog SHALL show "No products match" followed by the settled search term. When the product source fails, the Catalog SHALL show an error message.

#### Scenario: No matches

- **WHEN** the settled search term is "zzzz" and the product source returns no products
- **THEN** the Catalog shows "No products match \"zzzz\""

#### Scenario: Product source unavailable

- **WHEN** the product source responds with a server error
- **THEN** the Catalog shows an error message and no products

### Requirement: Product detail follows the URL

The product detail at `/catalog/:productId` SHALL show the product whose id equals `productId`: its title, description, category, thumbnail, final price, and, when it differs, list price. A product id is a positive whole number.

#### Scenario: Existing product

- **WHEN** the shopper opens `/catalog/1` and product 1 is "Essence Mascara Lash Princess" with a list price of 9.99 USD and a discount of 10.48%
- **THEN** the page shows "Essence Mascara Lash Princess", "$8.94" and a struck-through "$9.99"

### Requirement: Unknown product

The product detail SHALL show "Product not found" when `productId` is not a valid product id, or when the product source has no product with that id. When `productId` is not a valid product id, no product SHALL be requested.

#### Scenario: Non-numeric id

- **WHEN** the shopper opens `/catalog/abc`
- **THEN** the page shows "Product not found" and no product is requested

#### Scenario: Id unknown to the source

- **WHEN** the shopper opens `/catalog/99999` and the product source responds 404
- **THEN** the page shows "Product not found"

### Requirement: Catalog is the entry point

The application's root path SHALL lead to the Catalog's product list.

#### Scenario: Opening the app

- **WHEN** the shopper opens `/`
- **THEN** the shopper is at `/catalog` and sees the product list

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
