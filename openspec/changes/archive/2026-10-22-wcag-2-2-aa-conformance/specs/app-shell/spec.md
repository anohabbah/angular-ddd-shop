# Spec Delta

## ADDED Requirements

### Requirement: Focus after navigating

After an in-app navigation to another page has completed, however it was started, keyboard focus SHALL be on the page's main content region, so the next Tab reaches the first focusable element of the new page. Opening the shop, or reloading it, SHALL NOT move focus.

#### Scenario: Following a product link

- **WHEN** the shopper focuses the product "Essence Mascara Lash Princess" in the product list and activates it with Enter
- **THEN** the product detail is shown, the main content region has focus, and the next Tab focuses "Back to catalog"

#### Scenario: Selecting a navigation link

- **WHEN** the shopper is on the Catalog and activates the Cart navigation link with the keyboard
- **THEN** the cart page is shown and the main content region has focus

#### Scenario: Opening the shop

- **WHEN** the shopper opens `/catalog` directly
- **THEN** focus is not moved into the page

### Requirement: Navigation landmark

The shell SHALL expose exactly one navigation landmark, named "Main", that holds the Catalog and Cart navigation links.

#### Scenario: Landmarks on a wide viewport

- **WHEN** the viewport is 1280px wide
- **THEN** the page has one navigation landmark, named "Main", containing the Catalog and Cart links
