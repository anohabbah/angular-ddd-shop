# app-shell Specification

## Purpose

The layout every page of the shop sits in: how the shopper moves between the Catalog and the cart on wide and narrow viewports, the toolbar that frames each page, and the color scheme.

## Requirements

### Requirement: Navigation destinations

The navigation SHALL offer one link to the Catalog page at `/catalog` and one link to the cart page at `/cart`, in that order. The link for the section currently shown SHALL be marked as the current page: Catalog for the Catalog and its product details, Cart for the cart page.

#### Scenario: Navigating to the cart

- **WHEN** the shopper is on the Catalog and selects the Cart link in the navigation
- **THEN** the cart page at `/cart` is shown

#### Scenario: Current page marked

- **WHEN** the cart page is shown
- **THEN** the Cart navigation link is marked as the current page and the Catalog link is not

#### Scenario: Product detail

- **WHEN** a product detail at `/catalog/1` is shown
- **THEN** the Catalog navigation link is marked as the current page

### Requirement: Navigation on wide viewports

A viewport at least 960px wide is wide. On a wide viewport the navigation SHALL be visible beside the page content at all times, whatever keys the shopper presses, and no menu control SHALL be shown.

#### Scenario: Wide viewport

- **WHEN** the viewport is 1280px wide
- **THEN** the navigation is visible beside the page content and there is no menu control

#### Scenario: Navigating on a wide viewport

- **WHEN** the viewport is wide and the shopper selects a navigation link
- **THEN** the navigation is still visible after the new page is shown

#### Scenario: Escape on a wide viewport

- **WHEN** the viewport is wide and the shopper presses Escape in the navigation
- **THEN** the navigation is still visible

### Requirement: Navigation on narrow viewports

A viewport narrower than 960px is narrow. On a narrow viewport the navigation SHALL be closed by default, and a menu control in the toolbar SHALL open it and expose whether it is open. While open, it SHALL cover the page content, including the toolbar, and selecting outside it or pressing Escape SHALL close it.

#### Scenario: Closed by default

- **WHEN** the shopper opens any page on a viewport 390px wide
- **THEN** the navigation is closed and the menu control is shown

#### Scenario: Opening from the menu control

- **WHEN** the viewport is narrow, the navigation is closed, and the shopper selects the menu control
- **THEN** the navigation is open and the menu control reports it as expanded

#### Scenario: Closing by selecting outside

- **WHEN** the viewport is narrow, the navigation is open, and the shopper selects the page area outside it
- **THEN** the navigation is closed

### Requirement: Navigation closes after navigating on narrow viewports

On a narrow viewport the navigation SHALL be closed whenever a navigation to another page has completed, however the navigation was started.

#### Scenario: Selecting a navigation link

- **WHEN** the viewport is narrow, the navigation is open, and the shopper selects the Cart link
- **THEN** the cart page is shown and the navigation is closed

#### Scenario: Following a link in the page

- **WHEN** the viewport is narrow, the navigation is open, and the shopper follows the cart link in the toolbar
- **THEN** the cart page is shown and the navigation is closed

### Requirement: Navigation follows viewport changes

When the viewport changes between wide and narrow, the navigation SHALL take the default state for the new width: visible when wide, closed when narrow.

#### Scenario: Narrowing the viewport

- **WHEN** the viewport is 1280px wide and is resized to 390px
- **THEN** the navigation is closed and the menu control is shown

#### Scenario: Widening with the drawer open

- **WHEN** the viewport is narrow with the navigation open and is resized to 1280px
- **THEN** the navigation is visible beside the page content and there is no menu control

### Requirement: Toolbar

Every page SHALL show a toolbar at the top of the content area, inside the page header, holding the shop name and the cart link with its item count. On narrow viewports the toolbar SHALL also hold the menu control.

#### Scenario: Cart link in the toolbar

- **WHEN** the shopper is on any page and the Cart has an item count of 2
- **THEN** the toolbar shows the cart link with an item count of 2

### Requirement: Color scheme follows the shopper's system preference

The shop SHALL use a dark color scheme when the shopper's system prefers dark and a light color scheme otherwise. It SHALL NOT offer its own color scheme setting.

#### Scenario: System prefers dark

- **WHEN** the shopper's system color scheme preference is dark
- **THEN** the shop is shown with the dark color scheme

#### Scenario: No preference

- **WHEN** the shopper's system has no color scheme preference
- **THEN** the shop is shown with the light color scheme

### Requirement: Reduced motion

When the shopper's system asks for reduced motion, the shop SHALL NOT slide or scale elements. Opening and closing the navigation SHALL then be a fade or immediate.

#### Scenario: Opening the drawer with reduced motion

- **WHEN** the shopper's system asks for reduced motion and the shopper opens the navigation on a narrow viewport
- **THEN** the navigation appears without sliding
