# Spec Delta

## ADDED Requirements

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
