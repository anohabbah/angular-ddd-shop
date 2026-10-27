# VoiceOver + Safari script

The manual screen-reader pass behind the [conformance statement](conformance.md). Run it on macOS with Safari and VoiceOver, and record each step as Pass or Fail, with a note for any failure. A failure goes back to the slice that owns the behavior as a new Red/Green slice, and the statement's affected verdicts stay unverified until it passes.

Expected announcements are taken from the scenarios in `openspec/specs` (accessibility, app-shell, product-catalog, shopping-cart). The wording VoiceOver adds around them ("link", "heading level 1", "button", "status") may vary by macOS version. A step passes when the quoted text is announced and nothing contradicts it.

## Setup

- Safari → Settings → Advanced: turn on **Press Tab to highlight each item on a webpage**, so Tab reaches links as well as form controls.
- Start the shop with `pnpm nx serve` and open `http://localhost:4200` in Safari.
- Turn on VoiceOver with Cmd+F5. Below, **VO** is Control+Option.
- The shop reads the live product source (dummyjson.com). Product 1 is "Essence Mascara Lash Princess" and product 2 is "Eyeshadow Palette with Mirror". Prices may differ from the amounts quoted in the specs, which come from the e2e stub. Check the pattern ("Final price <amount>"), not the amount.
- Loading and failed states: in Safari's Web Inspector (Cmd+Option+I), Network tab, throttle the connection to see a loading state, or block requests to `dummyjson.com` (Sources → Local Overrides → Block) to see a failed state. Reload the page after changing either.
- Keys used: Tab / Shift+Tab move focus. VO+Right reads the next item. VO+U opens the rotor (Left/Right switches between Landmarks and Headings, Escape closes it). VO+Space activates. VO+F2, pressed twice, reads the window (document) title. VO+A reads from the cursor.

## 1. Shell

| #   | State                      | Keys                                                           | Expected                                                                                                  | Result |
| --- | -------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------ |
| 1.1 | `/catalog` opened directly | Wait for the page to load. Press VO+F2 twice                   | "Catalog \| ngsample". Focus was not moved into the page: VoiceOver starts at the top of the web content  | Pass   |
| 1.2 | Wide window (≥ 960 px)     | VO+U, then Left/Right to **Landmarks**                         | One navigation landmark, named "Main". Inside it, the links "Catalog" (current page) and "Cart"           | Pass   |
| 1.3 | Narrow window (< 960 px)   | Tab to "Open navigation" and press VO+Space                    | "Open navigation, button, collapsed", then "expanded" after activating. The Catalog and Cart links follow | Pass   |
| 1.4 | On `/catalog`              | Tab to the Cart navigation link (wide window) and press Return | The cart page is shown. VoiceOver reads the main region. VO+F2 twice reads "Cart \| ngsample"             | Pass   |
| 1.5 | Toolbar                    | Tab to the toolbar cart link                                   | "Cart, 0 items, link" with an empty Cart, "Cart, 2 items, link" after adding two items                    | Pass   |

## 2. Product list

| #   | State      | Keys                                                                                      | Expected                                                                                                                              | Result |
| --- | ---------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 2.1 | Loaded     | VO+U → **Headings**                                                                       | One level-one heading, "Catalog". Each product title is a level-two heading                                                           | Pass   |
| 2.2 | Loaded     | Tab to the first product link                                                             | The link name says "Essence Mascara Lash Princess" once, then "Final price <amount>" and "List price <amount>". The image is not read | Pass   |
| 2.3 | Loaded     | Tab to "Eyeshadow Palette with Mirror"                                                    | "Final price <amount>" and no "List price" (unless the live source discounts it)                                                      | Pass   |
| 2.4 | Loaded     | Tab into "Search products". Type `iphone` and wait a second                               | Without focus leaving the field, VoiceOver announces "1 product"                                                                      | Pass   |
| 2.5 | Loaded     | In "Search products", replace the text with `a` and wait                                  | Announces "<count> products"                                                                                                          | Pass   |
| 2.6 | No matches | In "Search products", replace the text with `zzzz` and wait                               | Announces "No products match "zzzz"". Focus stays in the search field                                                                 | Pass   |
| 2.7 | Loading    | Throttle, reload `/catalog`, VO+U → **Headings**                                          | One level-one heading, "Catalog". The progress bar is read as "Loading products"                                                      | Pass   |
| 2.8 | Failed     | Block dummyjson.com, reload `/catalog`                                                    | "Products could not be loaded." is announced as an alert. VO+U → Headings lists one level-one heading, "Catalog"                      | Pass   |
| 2.9 | Scrolled   | Narrow window, scroll to the bottom of the list, then Shift+Tab back to the first product | The focused product is fully visible below the toolbar (visual check; VoiceOver's cursor outline is not covered either)               | Pass   |

## 3. Product detail

| #    | State                   | Keys                                                                                | Expected                                                                                                          | Result |
| ---- | ----------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------ |
| 3.1  | From the list           | On `/catalog`, Tab to "Essence Mascara Lash Princess" and press Return              | The product detail is shown and the main region has focus. The next Tab focuses "Back to catalog"                 | Pass   |
| 3.2  | Loaded                  | VO+F2 twice, then VO+U → **Headings**                                               | Title "Essence Mascara Lash Princess \| ngsample". One level-one heading, "Essence Mascara Lash Princess"         | Pass   |
| 3.3  | Loaded, not in the Cart | Tab to "Add to cart" and press VO+Space                                             | Announces "Quantity in cart: 1". Focus stays on "Add to cart". A "View cart" link follows the message             | Pass   |
| 3.4  | Loaded, in the Cart     | Press VO+Space on "Add to cart" again                                               | Announces "Quantity in cart: 2". Focus stays on "Add to cart"                                                     | Pass   |
| 3.5  | Loaded, in the Cart     | Wait 10 seconds, then VO+Right from "Add to cart"                                   | "Quantity in cart: 2" and the "View cart" link are still there                                                    | Pass   |
| 3.6  | Loaded, in the Cart     | Tab to "View cart" and press Return                                                 | The cart page is shown at `/cart` with a line for "Essence Mascara Lash Princess"                                 | Pass   |
| 3.7  | Reached with quantity 3 | Add product 1 three times, go to the Catalog through the navigation, open product 1 | "Quantity in cart: 3" and a "View cart" link are shown next to "Add to cart" (VO+Right from the button)           | Pass   |
| 3.8  | Not found               | Open `/catalog/abc`, VO+F2 twice, VO+U → **Headings**                               | Title "Product not found \| ngsample". One level-one heading, "Product not found"                                 | Pass   |
| 3.9  | Loading                 | Throttle, reload `/catalog/1`, VO+U → **Headings**                                  | One level-one heading, "Product". The progress bar is read as "Loading product". Title "Product \| ngsample"      | Pass   |
| 3.10 | Failed                  | Block dummyjson.com, reload `/catalog/1`                                            | "Product could not be loaded. Please try again later." is announced as an alert. One level-one heading, "Product" | Pass   |

## 4. Cart page

Fill the Cart through the shop's own links (the Cart lives in memory, so a reload empties it): add product 1, then product 2, then open the Cart.

| #   | State                      | Keys                                                                                          | Expected                                                                                                                                                                                                                                                                                   | Result                                                                          |
| --- | -------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| 4.1 | Empty                      | Open `/cart`, VO+F2 twice, VO+U → **Headings**                                                | Title "Cart \| ngsample". One level-one heading, "Cart". "Your cart is empty" is read after it                                                                                                                                                                                             | Pass                                                                            |
| 4.2 | With two lines             | VO+U → **Headings**, then Tab through the first line                                          | One level-one heading, "Cart". Buttons "Decrease quantity of Essence Mascara Lash Princess", "Increase quantity of Essence Mascara Lash Princess", "Remove Essence Mascara Lash Princess", and on the second line "Remove Eyeshadow Palette with Mirror". No button is named only "Remove" | Pass                                                                            |
| 4.3 | With two lines             | VO+Right to the first line's quantity                                                         | "Quantity of Essence Mascara Lash Princess", then its value                                                                                                                                                                                                                                | Pass                                                                            |
| 4.4 | One line at quantity 1     | Remove product 2 first. Tab to "Increase quantity of Essence Mascara Lash Princess", VO+Space | Announces the new quantity "2" and "Cart total: <amount>". Focus stays on the increase button                                                                                                                                                                                              | Pass                                                                            |
| 4.5 | Lines for products 1 and 2 | Tab to "Remove Essence Mascara Lash Princess" and press VO+Space                              | Focus moves to "Remove Eyeshadow Palette with Mirror"                                                                                                                                                                                                                                      | Pass                                                                            |
| 4.6 | Lines for products 1 and 2 | Tab to "Remove Eyeshadow Palette with Mirror" and press VO+Space                              | Focus moves to "Remove Essence Mascara Lash Princess"                                                                                                                                                                                                                                      | Pass                                                                            |
| 4.7 | One line                   | Tab to its Remove button and press VO+Space                                                   | "Your cart is empty" is shown and has focus, and VoiceOver reads it                                                                                                                                                                                                                        | Pass                                                                            |
| 4.8 | One line at quantity 2     | Tab to "Decrease quantity of Essence Mascara Lash Princess", VO+Space                         | Announces the new quantity "1" and "Cart total: <amount>", then "dimmed" for the button. Focus stays on the decrease button: the next Tab reaches "Increase quantity of Essence Mascara Lash Princess"                                                                                     | Pass, except the quantity, not heard as in 4.4 (`fr-FR` run, 2026-10-27, below) |

## Recording the pass

When every step has a result, note the date, macOS, Safari and VoiceOver versions here, and carry the results into the statement's verdicts.

- Date: 2026-10-22, all steps Pass
- macOS / Safari: macOS 27.0.1, Safari 27.0.1, VoiceOver (built in)
- Tester: Abbah A (maintainer)

## French pass (`fr-FR`)

The steps whose announcements are translated, run with macOS and Safari in French (Preferred languages `["fr-FR"]`), so the shop shows the `fr-FR` Locale. Product titles stay in English. Driven with `tools/voiceover.sh`, which reads VoiceOver's last spoken phrase, so a short phrase replaced quickly by another can be missed.

| #   | Expected in `fr-FR`                                                                                                | Heard                                                                                          | Result |
| --- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- | ------ |
| 1.5 | "Panier, 0 article, lien" with an empty Cart, "Panier, 2 articles, lien" after adding two items                    | "lien Panier, 0 article bannière", then "lien Panier, 2 articles bannière"                     | Pass   |
| 2.4 | "1 produit", focus stays in "Rechercher des produits"                                                              | "1 produit" for `kiwi` (the live source has 8 results for `iphone`: "8 produits"). Focus stays | Pass   |
| 2.5 | "<count> produits"                                                                                                 | "30 produits" for `a`                                                                          | Pass   |
| 2.6 | "Aucun produit ne correspond à « zzzz »", focus stays in the field                                                 | "Aucun produit ne correspond à « zzzz »". Focus stays                                          | Pass   |
| 3.3 | "Quantité dans le panier : 1", focus stays on "Ajouter au panier", a "Voir le panier" link follows                 | "Quantité dans le panier : 1", focus stays; VO+Right: "Voir le panier" link                    | Pass   |
| 3.4 | "Quantité dans le panier : 2", focus stays on "Ajouter au panier"                                                  | "Quantité dans le panier : 2"                                                                  | Pass   |
| 4.3 | "Quantité de Essence Mascara Lash Princess", then its value                                                        | "Quantité de Essence Mascara Lash Princess sortie"                                             | Pass   |
| 4.4 | The new quantity "2" and "Total du panier : <amount>", focus stays on "Augmenter la quantité de Essence Mascara …" | "Total du panier : 17,88 $US" only, twice (quantities 2 and 3). Focus stays                    | Fail   |

4.4 fails the same way with the markup from before localization (`git show HEAD:libs/cart/ui/src/lib/cart-page/cart-page.html`, restored afterwards): only "Cart total: <amount>" is heard. It is a pre-existing failure, not a regression of the French texts. Confirm by ear before fixing it, since the driver may miss the quantity.

#### 4.4: diagnosis, deferred (2026-10-25)

Throwaway markup variants of the cart page's quantity `<output>`, run through steps 4.4 with one Cart line (increase 1 → 2 → 3), each restored afterwards:

| Variant                                                                                 | Quantity announced           | Cart total announced |
| --------------------------------------------------------------------------------------- | ---------------------------- | -------------------- |
| Current: `[attr.aria-label]="Quantité de <title>"`                                      | No                           | Yes                  |
| Plus `role="status"`, or plus `aria-live="polite" aria-atomic="true"`                   | No                           | Yes                  |
| `aria-labelledby` to a visually hidden span instead of `aria-label`                     | No                           | Yes                  |
| No name at all (Cart total removed)                                                     | Yes: "2", "3"                | —                    |
| Label as visually hidden text inside the `<output>` (`<span class="sr-only">`), no name | Yes: "Quantité de <title> 2" | No                   |
| Same, with `role="status" aria-live="polite"` on both outputs                           | Yes                          | No                   |

Findings: VoiceOver with Safari 27 does not announce content changes in a live region that has an author name (`aria-label` or `aria-labelledby`). When two live regions change in one update, only one is announced. So two separate regions cannot announce both the quantity and the Cart total, as the shopping-cart requirement "Quantity and Cart total announced" asks.

Options, to decide before the fix (its own slice, and a spec change either way):

- **One combined message**: one visually hidden status region says "Quantité de <title> : 2. Total du panier : <amount>"; the visible quantity and total stop being live (`aria-live="off"`), and the quantity keeps its name. Needs the last changed Cart line as source state, set by the increase and decrease commands. What it says on removal is still to be designed.
- **Quantity only**: the label moves into the quantity's text, visually hidden. The changed line is named in its announcement; the Cart total is not announced on a quantity change. The requirement is relaxed to match.

Not yet tested with more than one Cart line. Only the changed line's region changes, so the same one-of-two limit applies. Whichever option is chosen, add a scenario and a VoiceOver step with two lines: increasing the second line announces that line's title and quantity, and the right total.

- Date: 2026-10-25. 7 steps Pass, 4.4 Fail (pre-existing)
- macOS / Safari: macOS 27.0.1, Safari 27.0.1, VoiceOver (built in), system language French
- Tester: Claude Code, driving VoiceOver with `tools/voiceover.sh`

### Product content in English (`lang="en"`)

Product titles, categories and descriptions are marked `lang="en"` inside the French page. Rerun of the steps whose elements changed, 2026-10-25, same versions and driver. The driver reads the spoken text, not the voice, so whether VoiceOver switches to an English voice for those parts is Not verified until checked by ear.

| #   | Heard                                                                                                                                             | Result       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 2.2 | "lien niveau d'en-tête 2 Essence Mascara Lash Princess Prix final 8,94 $US Prix initial …": the title once, then the prices                       | Pass         |
| 3.2 | Title "Essence Mascara Lash Princess \| ngsample"; "niveau d'en-tête 1 Essence Mascara Lash Princess", then "Beauty" and the description          | Pass         |
| 4.2 | One line: "lien Essence Mascara Lash Princess", "Augmenter la quantité de Essence Mascara Lash Princess", "Retirer Essence Mascara Lash Princess" | Pass         |
| —   | English voice for the `lang="en"` parts                                                                                                           | Not verified |

### Cart line names without an article

The French Cart line names no longer use "de" before the title, which needed elision for some titles ("d'Essence"): they read "Diminuer la quantité – <title>", "Augmenter la quantité – <title>" and "Quantité – <title>". Rerun of the steps whose names changed, 2026-10-25, same versions and driver, with lines for product 1 (quantity 2) and product 2 (quantity 1). 4.4 is left to the by-ear check above.

| #   | Heard                                                                                                                                                                                                                                                                                                                                                           | Result |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 4.2 | VO+Cmd+H: "niveau d'en-tête 1 Panier", then "Dernier en-tête". Tab: "lien Essence Mascara Lash Princess", "Diminuer la quantité – Essence Mascara Lash Princess bouton", "Augmenter la quantité – Essence Mascara Lash Princess bouton", "Retirer Essence Mascara Lash Princess bouton", then "Retirer Eyeshadow Palette with Mirror bouton" on the second line | Pass   |
| 4.3 | "Quantité – Essence Mascara Lash Princess sortie", then "2"                                                                                                                                                                                                                                                                                                     | Pass   |

### Decrease stays focusable at quantity 1

The Cart line's decrease button is disabled-interactive (`aria-disabled="true"`, still in the tab order) instead of natively disabled, so keyboard focus stays on it when the quantity it decreased reaches 1. Step 4.8 added, and 4.4 rerun since the same line's controls changed. Run 2026-10-27, same versions and driver, with one line for product 1 at quantity 2.

| #   | Heard                                                                                                                                                                                                                                                         | Result                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 4.8 | "Diminuer la quantité – Essence Mascara Lash Princess bouton"; VO+Space: "Total du panier : 8,94 $US", then "Vous êtes actuellement sur bouton. Cet élément est estompé." The next Tab reaches "Augmenter la quantité – Essence Mascara Lash Princess bouton" | Pass; the quantity "1" is not heard, as in 4.4     |
| 4.4 | VO+Space on "Augmenter …": "Total du panier : 17,88 $US". The next Tab reaches "Retirer Essence Mascara Lash Princess bouton"                                                                                                                                 | Fail (pre-existing, unchanged: quantity not heard) |

4.8 rerun with the previous markup (`git show HEAD:libs/cart/ui/src/lib/cart-page/cart-page.html`, restored afterwards): the same two phrases, and the next Tab also reaches "Augmenter …". The quantity is not heard with either markup, so that is the pre-existing 4.4 gap, not a regression. Safari keeps keyboard focus on a natively disabled button, unlike Chromium, which moves it to the document: the defect the change fixes shows in the Chromium e2e test, not in this pass.

- Date: 2026-10-27. 4.8 Pass (dimmed state and focus), 4.4 Fail (pre-existing)
- macOS / Safari: macOS 27.0.1, Safari 27.0.1, VoiceOver (built in), system language French
- Tester: Claude Code, driving VoiceOver with `tools/voiceover.sh`
