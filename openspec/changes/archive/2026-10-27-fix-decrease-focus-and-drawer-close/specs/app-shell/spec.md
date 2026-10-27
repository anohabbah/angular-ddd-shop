# Spec Delta

## MODIFIED Requirements

### Requirement: Navigation closes after navigating on narrow viewports

On a narrow viewport the navigation SHALL be closed whenever a navigation to another page has completed, however the navigation was started. It SHALL also be closed once the shopper selects any link in the navigation, including the link for the page already shown, which leads to no navigation.

#### Scenario: Selecting a navigation link

- **WHEN** the viewport is narrow, the navigation is open, and the shopper selects the Cart link
- **THEN** the cart page is shown and the navigation is closed

#### Scenario: Following a link in the page

- **WHEN** the viewport is narrow, the navigation is open, and the shopper follows the cart link in the toolbar
- **THEN** the cart page is shown and the navigation is closed

#### Scenario: Selecting the link for the page already shown

- **WHEN** the viewport is narrow, the Catalog at `/catalog` is shown, the navigation is open, and the shopper selects the Catalog link
- **THEN** the Catalog is still shown at `/catalog`, the navigation is closed, and the menu control reports it as not expanded
