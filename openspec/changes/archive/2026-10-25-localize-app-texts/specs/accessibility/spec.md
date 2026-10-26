# Spec Delta

## MODIFIED Requirements

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
