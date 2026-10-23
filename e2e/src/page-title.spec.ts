import { expect, mascara, test } from './support/fixtures';

test.describe('Page title', () => {
  test('names the product list, then the shop', async ({ page }) => {
    await page.goto('/catalog');

    await expect(page).toHaveTitle('Catalog | ngsample');
  });

  test('names the cart page, then the shop', async ({ page }) => {
    await page.goto('/cart');

    await expect(page).toHaveTitle('Cart | ngsample');
  });

  test('names the loaded product, then the shop', async ({ page }) => {
    await page.goto('/catalog/1');
    await expect(page.getByRole('heading', { name: mascara.title })).toBeVisible();

    await expect(page).toHaveTitle(`${mascara.title} | ngsample`);
  });

  test('says an unknown product is not found, then names the shop', async ({ page }) => {
    await page.goto('/catalog/abc');

    await expect(page).toHaveTitle('Product not found | ngsample');
  });
});
