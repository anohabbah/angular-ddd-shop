# accessibility Specification

## Purpose

States the shop's accessibility contract: the WCAG conformance target, the pages, states and conditions it covers, how conformance is checked, and the conformance statement that records it.

## Requirements

### Requirement: Conformance target

Every page of the shop SHALL conform to WCAG 2.2 level AA in each state the shopper can reach, in both color schemes, at viewport widths of 1920, 1280, 390 and 320 CSS px. The conformance matrix SHALL include, at least: product list loaded, loading, failed and with no matches; product detail loaded, loading, not found and failed; cart page empty and with Cart lines; the navigation open on a narrow viewport. The conformance matrix SHALL be checked in the default Locale, `fr-FR`.

#### Scenario: Every cell of the matrix

- **WHEN** any page of the conformance matrix is shown in any listed state, color scheme and width
- **THEN** an automated WCAG 2.2 A and AA check reports no violations

#### Scenario: A failing cell fails verification

- **WHEN** a change makes one cell of the conformance matrix produce an automated WCAG 2.2 A or AA violation
- **THEN** the end-to-end verification fails and names the page, state, color scheme, width and violated rule

#### Scenario: Widest layout

- **WHEN** any page of the conformance matrix is shown 1920 CSS px wide
- **THEN** an automated WCAG 2.2 A and AA check reports no violations

#### Scenario: Checked in French

- **WHEN** the conformance matrix is checked
- **THEN** every cell is shown in the `fr-FR` Locale, with the document language `fr-FR`

### Requirement: Page titles

Each page's document title SHALL name the page and then the shop, as "<page> | ngsample". The page name SHALL be "Catalog" for the product list, the product's title for a loaded product detail, "Product not found" for an unknown product, "Product" while a product detail loads or has failed, and "Cart" for the cart page.

#### Scenario: Product list

- **WHEN** the shopper is on `/catalog`
- **THEN** the document title is "Catalog | ngsample"

#### Scenario: Product detail

- **WHEN** the shopper is on `/catalog/1` and product 1 is "Essence Mascara Lash Princess"
- **THEN** the document title is "Essence Mascara Lash Princess | ngsample"

#### Scenario: Unknown product

- **WHEN** the shopper opens `/catalog/abc`
- **THEN** the document title is "Product not found | ngsample"

#### Scenario: Cart page

- **WHEN** the shopper is on `/cart`
- **THEN** the document title is "Cart | ngsample"

### Requirement: One level-one heading per page

Every page, in every state of the conformance matrix, SHALL have exactly one level-one heading, and it SHALL name what the page shows.

#### Scenario: Product list

- **WHEN** the shopper is on `/catalog` in any state
- **THEN** the page has one level-one heading, "Catalog"

#### Scenario: Cart page

- **WHEN** the shopper is on `/cart`, whether the Cart is empty or not
- **THEN** the page has one level-one heading, "Cart"

### Requirement: Visible focus indicator

Every element that can receive keyboard focus SHALL show a focus indicator while focused. The indicator SHALL contrast at least 3:1 with the colors next to it, in both color schemes, and SHALL be distinct from the element's selected or current-page state.

#### Scenario: Icon button in light color scheme

- **WHEN** the color scheme is light and the cart link in the toolbar has keyboard focus
- **THEN** a focus indicator with at least 3:1 contrast against the toolbar is shown around it

#### Scenario: Current navigation link

- **WHEN** the Catalog navigation link is the current page and receives keyboard focus
- **THEN** its focus indicator is visible in addition to its current-page marking

### Requirement: Focus not obscured

No focused element SHALL be covered by the sticky page header, however focus reached it. Moving focus to an element under the header SHALL scroll it into view below the header.

#### Scenario: Tabbing backwards on a narrow viewport

- **WHEN** the viewport is 390 × 500 CSS px, the product list is scrolled down, and the shopper moves focus backwards to the first product
- **THEN** the focused product is shown entirely below the page header

### Requirement: Reflow and text spacing

At a viewport width of 320 CSS px, and with text spacing increased to line height 1.5, letter spacing 0.12em, word spacing 0.16em and paragraph spacing 2em, no page SHALL scroll horizontally or clip any text content.

#### Scenario: Cart at 320 px with increased text spacing

- **WHEN** the cart page with Cart lines is shown 320 CSS px wide with increased text spacing
- **THEN** the page does not scroll horizontally and every title, price and quantity is fully visible

### Requirement: Target size

Every pointer target SHALL be at least 24 × 24 CSS px, or have at least 24 CSS px of space around its center free of other targets. Links inside a sentence are exempt.

#### Scenario: Cart line controls

- **WHEN** the cart page shows a Cart line
- **THEN** its decrease, increase and remove controls are each at least 24 × 24 CSS px

### Requirement: Conformance statement

The repository SHALL hold a conformance statement for WCAG 2.2 level AA. It SHALL contain the date, the standard and level, the pages covered, the technologies relied upon, a verdict and note for each A and AA success criterion, and the assistive-technology pairs tested and not tested. It SHALL claim conformance only for criteria verified by the automated check or the manual screen-reader pass.

#### Scenario: Criterion not yet verified manually

- **WHEN** a success criterion depends on what a screen reader announces and the manual VoiceOver pass has not confirmed it
- **THEN** the statement does not record that criterion as supported

#### Scenario: Untested assistive technology

- **WHEN** the statement is read
- **THEN** it lists VoiceOver with Safari on macOS as tested, and NVDA and mobile screen readers as not tested

### Requirement: Statement kept current

Any change to a page's markup, styles or behavior SHALL re-run the automated check. When the change affects what a screen reader announces, it SHALL also repeat the affected steps of the manual VoiceOver script and update the conformance statement's date and verdicts.

#### Scenario: Change touching a page

- **WHEN** a change alters the cart page
- **THEN** the automated check passes for every cart cell of the conformance matrix and the statement's cart verdicts are re-confirmed
