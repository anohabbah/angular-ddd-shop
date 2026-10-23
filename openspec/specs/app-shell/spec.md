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

### Requirement: Navigation set apart on wide viewports

On a wide viewport, the navigation's background SHALL differ from the page content's background, in both color schemes, and the navigation's corners SHALL be square. On a narrow viewport the open navigation SHALL keep its rounded outer corners.

#### Scenario: Wide viewport, light color scheme

- **WHEN** the viewport is 1280px wide and the color scheme is light
- **THEN** the navigation's background color differs from the main content's background color, and the navigation's corners are square

#### Scenario: Wide viewport, dark color scheme

- **WHEN** the viewport is 1280px wide and the color scheme is dark
- **THEN** the navigation's background color differs from the main content's background color

#### Scenario: Open on a narrow viewport

- **WHEN** the viewport is 390px wide and the navigation is open
- **THEN** the navigation's outer corners are rounded

### Requirement: Navigation links inset

Each navigation link, including its current-page marking, SHALL lie at least 12px inside the navigation's left and right edges, on wide and narrow viewports.

#### Scenario: Current page on a wide viewport

- **WHEN** the viewport is 1280px wide and the Catalog is shown
- **THEN** the Catalog navigation link's box starts at least 12px after the navigation's left edge and ends at least 12px before its right edge

#### Scenario: Open on a narrow viewport

- **WHEN** the viewport is 390px wide, the navigation is open and the Catalog is shown
- **THEN** the Catalog navigation link's box lies at least 12px inside both edges of the navigation

### Requirement: Toolbar boundary while scrolled

The toolbar SHALL show a visible line along its bottom edge while the page content is scrolled away from its top. The line MAY fade in over the first stretch of scrolling. At the top of the page, the toolbar SHALL show no bottom line. Browsers that cannot tie styles to scroll position MAY show no line in either case.

#### Scenario: Top of the page

- **WHEN** the product list is shown and has not been scrolled
- **THEN** the toolbar shows no bottom line

#### Scenario: Scrolled down

- **WHEN** the product list is scrolled down by 400px
- **THEN** the toolbar shows a bottom line

#### Scenario: Scrolled back to the top

- **WHEN** the product list is scrolled down and then back to the top
- **THEN** the toolbar shows no bottom line

### Requirement: Toolbar aligned with the page content

On a wide viewport, the toolbar's contents SHALL share the main content's column: the shop name's left edge SHALL line up with the left edge of the main content's heading, and the cart link's right edge SHALL line up with the right edge of the main content, whatever the viewport width.

#### Scenario: Widest supported layout

- **WHEN** the viewport is 1920px wide and the Catalog is shown
- **THEN** the shop name starts at the same x position as the "Catalog" heading, and the toolbar's cart link ends at the same x position as the right edge of the main content's column

#### Scenario: At 1280px

- **WHEN** the viewport is 1280px wide and the Catalog is shown
- **THEN** the shop name starts at the same x position as the "Catalog" heading, and the toolbar's cart link ends at the same x position as the right edge of the main content's column
