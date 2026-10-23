# Spec Delta

## ADDED Requirements

### Requirement: Product list entry layout

Each product's entry in the product list SHALL show its thumbnail first, as a square spanning the entry from edge to edge, with its title and Price display below it. A placeholder shown in place of a thumbnail SHALL fill the same square. Within one row of the product list, the entries' Final prices SHALL line up, whatever the length of their titles.

#### Scenario: Thumbnail spans the entry on a wide viewport

- **WHEN** the viewport is 1280px wide and the product list contains "Essence Mascara Lash Princess"
- **THEN** that entry's thumbnail starts at the entry's top edge, is as wide as the entry, and is as tall as it is wide

#### Scenario: Thumbnail spans the entry on a narrow viewport

- **WHEN** the viewport is 320px wide and the product list contains "Essence Mascara Lash Princess"
- **THEN** that entry's thumbnail is as wide as the entry and as tall as it is wide

#### Scenario: Placeholder fills the thumbnail's square

- **WHEN** the viewport is 1280px wide and a product's thumbnail fails to load
- **THEN** that entry's placeholder starts at the entry's top edge, is as wide as the entry, and is as tall as it is wide

#### Scenario: Final prices line up across a row

- **WHEN** the viewport is 1280px wide and one row of the product list holds a product with a one-line title and a product whose title wraps onto several lines
- **THEN** both entries' Final prices sit at the same vertical position
