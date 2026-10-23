import { expect, iphone, mascara, test } from './support/fixtures';
import { productInList } from './support/shopper';

test.describe('App shell', () => {
  test.describe('on a wide viewport', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('has one navigation landmark, named "Main", holding the Catalog and Cart links', async ({
      page,
    }) => {
      await page.goto('/catalog');

      const navigation = page.getByRole('navigation');
      await expect(navigation).toHaveCount(1);
      await expect(navigation).toHaveAccessibleName('Main');
      await expect(navigation.getByRole('link', { name: 'Catalog', exact: true })).toBeVisible();
      await expect(navigation.getByRole('link', { name: 'Cart', exact: true })).toBeVisible();
    });
  });

  test.describe('focus after navigating', () => {
    test('following a product link with Enter focuses the main content, so the next Tab reaches "Back to catalog"', async ({
      page,
    }) => {
      await page.goto('/catalog');

      await productInList(page, mascara.title).getByRole('link').press('Enter');

      await expect(page.getByRole('heading', { name: mascara.title })).toBeVisible();
      await expect(page.getByRole('main')).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(page.getByRole('link', { name: 'Back to catalog' })).toBeFocused();
    });

    test('selecting the Cart navigation link with the keyboard focuses the main content', async ({
      page,
    }) => {
      await page.goto('/catalog');
      // The link works as a plain link, reloading the shop, until the app has started.
      await expect(page.getByRole('heading', { name: 'Catalog', level: 1 })).toBeVisible();

      await page
        .getByRole('navigation')
        .getByRole('link', { name: 'Cart', exact: true })
        .press('Enter');

      await expect(page).toHaveURL('/cart');
      await expect(page.getByRole('main')).toBeFocused();
    });

    test('opening the shop leaves focus on the document', async ({ page }) => {
      await page.goto('/catalog');
      await expect(page.getByRole('heading', { name: 'Catalog', level: 1 })).toBeVisible();

      expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
    });
  });

  test.describe('on a short narrow viewport', () => {
    test.use({ viewport: { width: 390, height: 500 } });

    test('moving focus backwards to the first product shows it entirely below the page header', async ({
      page,
    }) => {
      await page.goto('/catalog');
      await productInList(page, iphone.title).getByRole('link').focus();

      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Shift+Tab');

      const first = productInList(page, mascara.title).getByRole('link');
      await expect(first).toBeFocused();
      const headerBottom = await page
        .getByRole('banner')
        .evaluate((header) => header.getBoundingClientRect().bottom);
      const focusedTop = await first.evaluate((link) => link.getBoundingClientRect().top);
      expect(focusedTop).toBeGreaterThanOrEqual(headerBottom);
    });
  });
});
