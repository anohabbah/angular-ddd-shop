# localization Specification

## Purpose

Lets every Shopper use the shop in their language: French (France) by default, US English when their browser prefers English. It states how the Locale is chosen, which texts and formats follow it, and what stays untranslated.

## Requirements

### Requirement: Supported Locales

The shop SHALL support exactly two Locales: French (France), `fr-FR`, and US English, `en-US`. The default Locale is `fr-FR`.

#### Scenario: Only the two Locales

- **WHEN** the Shopper's Preferred languages are `["de-DE"]`
- **THEN** the shop is shown in `fr-FR`, not in German

### Requirement: Locale from the Preferred languages

At startup, the Locale SHALL be the supported Locale whose language part (the subtag before the first `-`, compared case-insensitively) matches the first entry of the Shopper's Preferred languages that has a supported language. When no entry matches, the Locale SHALL be `fr-FR`.

#### Scenario: Exact match

- **WHEN** the Preferred languages are `["en-US"]`
- **THEN** the Locale is `en-US`

#### Scenario: Same language, other region

- **WHEN** the Preferred languages are `["en-GB"]`
- **THEN** the Locale is `en-US`

#### Scenario: French from another region

- **WHEN** the Preferred languages are `["fr-CA", "en-US"]`
- **THEN** the Locale is `fr-FR`

#### Scenario: Unsupported first entry

- **WHEN** the Preferred languages are `["de-DE", "en-GB"]`
- **THEN** the Locale is `en-US`

#### Scenario: Nothing supported

- **WHEN** the Preferred languages are `["de-DE", "es-ES"]`
- **THEN** the Locale is `fr-FR`

#### Scenario: No Preferred languages

- **WHEN** the Preferred languages are `[]`
- **THEN** the Locale is `fr-FR`

#### Scenario: Bare language and case

- **WHEN** the Preferred languages are `["EN"]`
- **THEN** the Locale is `en-US`

#### Scenario: Malformed entry

- **WHEN** the Preferred languages are `["", "x", "en-US"]`
- **THEN** the Locale is `en-US`

### Requirement: Locale fixed for the session

The Locale SHALL stay the same while the shop is open. The shop SHALL NOT offer a language setting and SHALL NOT remember a Locale between visits; reloading resolves it again from the Preferred languages.

#### Scenario: Navigating

- **WHEN** the Locale is `en-US` and the Shopper navigates from the Catalog to the cart page
- **THEN** the cart page is shown in `en-US`

### Requirement: Document language

The document language SHALL be the Locale's tag.

#### Scenario: French

- **WHEN** the Locale is `fr-FR`
- **THEN** the document's language is `fr-FR`

#### Scenario: English

- **WHEN** the Locale is `en-US`
- **THEN** the document's language is `en-US`

### Requirement: Texts follow the Locale

Every text the shop itself provides, visible or accessible (headings, labels, buttons, links, status and error messages, accessible names, page names in document titles), SHALL be shown in the Locale. Texts quoted in other capabilities are the `en-US` texts; in `fr-FR` the shop SHALL show their French counterparts listed in this requirement's scenarios. The shop name "ngsample" is not translated.

#### Scenario: Shell in French

- **WHEN** the Locale is `fr-FR`
- **THEN** the navigation links read "Catalogue" and "Panier", the navigation landmark is named "Principale", and the narrow-viewport menu control is named "Ouvrir la navigation"

#### Scenario: Product list in French

- **WHEN** the Locale is `fr-FR` and the product list is shown
- **THEN** its level-one heading is "Catalogue", the search field is labelled "Rechercher des produits", the loading indicator is named "Chargement des produits", and the document title is "Catalogue | ngsample"

#### Scenario: Product list failure in French

- **WHEN** the Locale is `fr-FR` and the product source fails for the product list
- **THEN** the Catalog shows "Les produits n'ont pas pu être chargés." and a "Réessayer" button

#### Scenario: No matches in French

- **WHEN** the Locale is `fr-FR` and the settled search term "zzzz" matches no products
- **THEN** the status message reads "Aucun produit ne correspond à « zzzz »"

#### Scenario: Price display read out in French

- **WHEN** the Locale is `fr-FR` and a product has a Final price of 8.94 USD and a List price of 9.99 USD
- **THEN** its text reads "Prix final 8,94 $US" and "Prix initial 9,99 $US"

#### Scenario: Product detail in French

- **WHEN** the Locale is `fr-FR` and product 1 is shown
- **THEN** the page shows "Retour au catalogue" and an "Ajouter au panier" action

#### Scenario: Product detail states in French

- **WHEN** the Locale is `fr-FR`
- **THEN** an unknown product shows the heading "Produit introuvable", a loading or failed product shows the heading "Produit", the loading indicator is named "Chargement du produit", and a failure shows "Le produit n'a pas pu être chargé. Veuillez réessayer plus tard."

#### Scenario: Add-to-cart confirmation in French

- **WHEN** the Locale is `fr-FR` and product 1 is in the Cart with a quantity of 2
- **THEN** its product detail shows "Quantité dans le panier : 2" and a "Voir le panier" link

#### Scenario: Cart page in French

- **WHEN** the Locale is `fr-FR` and the Cart has one line for "Essence Mascara Lash Princess" with a unit price of 8.94 USD and a quantity of 3
- **THEN** the level-one heading is "Panier", the line's buttons are named "Diminuer la quantité – Essence Mascara Lash Princess", "Augmenter la quantité – Essence Mascara Lash Princess" and "Retirer Essence Mascara Lash Princess", its quantity is exposed as "Quantité – Essence Mascara Lash Princess", and the Cart total reads "Total du panier : 26,82 $US"

#### Scenario: Empty Cart in French

- **WHEN** the Locale is `fr-FR` and the Cart is empty
- **THEN** the cart page shows "Votre panier est vide" and the document title is "Panier | ngsample"

### Requirement: Plurals follow the Locale's rules

Texts that state a count SHALL use the plural form the Locale's grammar requires for that count. In `fr-FR`, 0 and 1 take the singular.

#### Scenario: Item count in French

- **WHEN** the Locale is `fr-FR` and the item count is 0, 1 or 4
- **THEN** the cart link's accessible name is "Panier, 0 article", "Panier, 1 article" or "Panier, 4 articles"

#### Scenario: Item count in English

- **WHEN** the Locale is `en-US` and the item count is 0, 1 or 4
- **THEN** the cart link's accessible name is "Cart, 0 items", "Cart, 1 item" or "Cart, 4 items"

#### Scenario: Product list outcome in French

- **WHEN** the Locale is `fr-FR` and the settled search term matches 1 or 2 products
- **THEN** the status message reads "1 produit" or "2 produits"

### Requirement: Money formatted for the Locale

Every amount of Money SHALL be formatted with the Locale's conventions for its currency: decimal separator, symbol and their placement. The currency itself SHALL NOT change.

#### Scenario: Price in French

- **WHEN** the Locale is `fr-FR` and a product's Final price is 8.94 USD
- **THEN** it is shown as "8,94 $US"

#### Scenario: Price in English

- **WHEN** the Locale is `en-US` and a product's Final price is 8.94 USD
- **THEN** it is shown as "$8.94"

### Requirement: Product content untranslated

A product's title, description and category SHALL be shown as the product source provides them, whatever the Locale. Texts that embed a product title SHALL embed it unchanged.

#### Scenario: Product title in French

- **WHEN** the Locale is `fr-FR` and product 1 is "Essence Mascara Lash Princess"
- **THEN** the product detail's level-one heading is "Essence Mascara Lash Princess"

### Requirement: Product content language

The product source provides its content in English. Wherever the shop shows a product's title, description or category as its own text, that text SHALL be marked with the language `en`, whatever the Locale. Accessible names that embed a product title are a single attribute and are not split.

#### Scenario: Product content marked as English

- **WHEN** the Locale is `fr-FR` and product 1 is shown on the product list, the product detail or as a Cart line
- **THEN** its title, and on the product detail its category and description, have the language `en`, while the surrounding page has the language `fr-FR`
