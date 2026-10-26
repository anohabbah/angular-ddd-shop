import type { Locator } from '@playwright/test';
import { expect, mascara, test } from './support/fixtures';
import { productInList } from './support/shopper';

/** The language an element's text is in: the `lang` of its closest ancestor that sets one. */
function languageOf(locator: Locator): Promise<string | null | undefined> {
  return locator.evaluate((el) => el.closest('[lang]')?.getAttribute('lang'));
}

test.describe('Locale', () => {
  test.describe('with Preferred languages ["fr-FR"]', () => {
    test.use({ locale: 'fr-FR', viewport: { width: 1280, height: 800 } });

    test('shows the shell in French', async ({ page }) => {
      await page.goto('/catalog');

      await expect(page.locator('html')).toHaveAttribute('lang', 'fr-FR');
      const navigation = page.getByRole('navigation');
      await expect(navigation).toHaveAccessibleName('Principale');
      await expect(navigation.getByRole('link', { name: 'Catalogue', exact: true })).toBeVisible();
      await expect(navigation.getByRole('link', { name: 'Panier', exact: true })).toBeVisible();
    });

    test('states the item count in French, 0 and 1 in the singular', async ({ page }) => {
      await page.goto('/catalog/1');
      const banner = page.getByRole('banner');
      await expect(
        banner.getByRole('link', { name: 'Panier, 0 article', exact: true }),
      ).toBeVisible();

      await page.getByRole('button', { name: 'Ajouter au panier' }).click();

      await expect(
        banner.getByRole('link', { name: 'Panier, 1 article', exact: true }),
      ).toBeVisible();
    });

    test('shows the product list in French, with French prices and plurals', async ({ page }) => {
      await page.goto('/catalog');

      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Catalogue');
      await expect(page).toHaveTitle('Catalogue | ngsample');
      const mascaraEntry = productInList(page, mascara.title);
      await expect(mascaraEntry).toContainText('Prix final 8,94\u00a0$US');
      await expect(mascaraEntry).toContainText('Prix initial 9,99\u00a0$US');

      const searchBox = page.getByRole('searchbox', { name: 'Rechercher des produits' });
      const status = page.getByRole('main').getByRole('status');
      await searchBox.fill('iphone');
      await expect(status).toHaveText('1 produit');
      await searchBox.fill('a');
      await expect(status).toHaveText('2 produits');
    });

    test('says in French that no products match', async ({ page }) => {
      await page.goto('/catalog');

      await page.getByRole('searchbox', { name: 'Rechercher des produits' }).fill('zzzz');

      await expect(page.getByRole('main').getByRole('status')).toHaveText(
        'Aucun produit ne correspond à « zzzz »',
      );
    });

    test('says in French that the products could not be loaded', async ({
      page,
      productSource,
    }) => {
      productSource.fail();
      await page.goto('/catalog');

      await expect(page.getByRole('alert')).toHaveText("Les produits n'ont pas pu être chargés.");
      await expect(page.getByRole('button', { name: 'Réessayer' })).toBeVisible();
    });

    test('shows the product detail in French, with the product title untranslated', async ({
      page,
    }) => {
      await page.goto('/catalog/1');

      await expect(page.getByRole('link', { name: 'Retour au catalogue' })).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(mascara.title);

      await page.getByRole('button', { name: 'Ajouter au panier' }).click();

      const inCart = page.getByRole('main').getByRole('status');
      await expect(inCart).toContainText('Quantité dans le panier : 1');
      await expect(inCart.getByRole('link', { name: 'Voir le panier' })).toBeVisible();
    });

    test('says in French that an unknown product is not found', async ({ page }) => {
      await page.goto('/catalog/abc');

      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Produit introuvable');
      await expect(page).toHaveTitle('Produit introuvable | ngsample');
    });

    test('names the product loading and failing in French', async ({ page, productSource }) => {
      productSource.fail();
      productSource.hold();
      await page.goto('/catalog/1');

      await expect(page.getByRole('progressbar', { name: 'Chargement du produit' })).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Produit');

      productSource.release();

      await expect(page.getByRole('alert')).toHaveText(
        "Le produit n'a pas pu être chargé. Veuillez réessayer plus tard.",
      );
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Produit');
    });

    test('shows the empty cart page in French', async ({ page }) => {
      await page.goto('/cart');

      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Panier');
      await expect(page.getByText('Votre panier est vide')).toBeVisible();
      await expect(page).toHaveTitle('Panier | ngsample');
    });

    test('names the Cart line controls and the Cart total in French', async ({ page }) => {
      await page.goto('/catalog/1');
      const addToCart = page.getByRole('button', { name: 'Ajouter au panier' });
      for (let i = 0; i < 3; i++) await addToCart.click();
      await page.getByRole('navigation').getByRole('link', { name: 'Panier', exact: true }).click();

      const main = page.getByRole('main');
      await expect(
        main.getByRole('button', { name: `Diminuer la quantité – ${mascara.title}` }),
      ).toBeVisible();
      await expect(
        main.getByRole('button', { name: `Augmenter la quantité – ${mascara.title}` }),
      ).toBeVisible();
      await expect(main.getByRole('button', { name: `Retirer ${mascara.title}` })).toBeVisible();
      await expect(main.getByRole('status', { name: `Quantité – ${mascara.title}` })).toHaveText(
        '3',
      );
      await expect(main.getByText('Total du panier : 26,82 $US')).toBeVisible();
    });

    test('marks product content as English inside the French page', async ({ page }) => {
      await page.goto('/catalog');
      await expect(page.locator('html')).toHaveAttribute('lang', 'fr-FR');
      const listTitle = productInList(page, mascara.title).getByRole('heading', { level: 2 });
      await expect.poll(() => languageOf(listTitle)).toBe('en');

      await listTitle.click();
      const main = page.getByRole('main');
      await expect.poll(() => languageOf(main.getByRole('heading', { level: 1 }))).toBe('en');
      await expect
        .poll(() => languageOf(main.getByText(mascara.category, { exact: true })))
        .toBe('en');
      await expect.poll(() => languageOf(main.getByText(mascara.description))).toBe('en');
      await expect
        .poll(() => languageOf(main.getByRole('button', { name: 'Ajouter au panier' })))
        .toBe('fr-FR');

      await main.getByRole('button', { name: 'Ajouter au panier' }).click();
      await page.getByRole('navigation').getByRole('link', { name: 'Panier', exact: true }).click();
      await expect
        .poll(() => languageOf(main.getByRole('link', { name: mascara.title })))
        .toBe('en');
    });
  });

  test.describe('with Preferred languages ["en-GB"]', () => {
    test.use({ locale: 'en-GB', viewport: { width: 1280, height: 800 } });

    test('shows the shell in US English', async ({ page }) => {
      await page.goto('/catalog');

      await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
      const navigation = page.getByRole('navigation');
      await expect(navigation.getByRole('link', { name: 'Catalog', exact: true })).toBeVisible();
      await expect(navigation.getByRole('link', { name: 'Cart', exact: true })).toBeVisible();
    });
  });

  test.describe('with Preferred languages ["de-DE"]', () => {
    test.use({ locale: 'de-DE' });

    test('falls back to French', async ({ page }) => {
      await page.goto('/catalog');

      await expect(page.locator('html')).toHaveAttribute('lang', 'fr-FR');
      await expect(
        page.getByRole('navigation').getByRole('link', { name: 'Catalogue', exact: true }),
      ).toBeVisible();
    });
  });
});
