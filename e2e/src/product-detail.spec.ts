import { expect, mascara, test } from './support/fixtures';
import { openCart } from './support/shopper';

test.describe('Product detail', () => {
  test('shows the product the URL points to, with its description, category and prices', async ({
    page,
  }) => {
    await page.goto('/catalog/1');

    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { name: mascara.title })).toBeVisible();
    await expect(main.getByText(mascara.description)).toBeVisible();
    await expect(main.getByText(mascara.category)).toBeVisible();
    await expect(main).toContainText('$8.94');
    await expect(main.getByRole('deletion')).toHaveText('$9.99');
  });

  test('says the product is not found, without asking the product source, for a non-numeric id', async ({
    page,
    productSource,
  }) => {
    await page.goto('/catalog/abc');

    await expect(page.getByRole('alert')).toHaveText('Product not found');
    expect(productSource.requests).toEqual([]);
  });

  test('says the product is not found when the product source has no product with that id', async ({
    page,
  }) => {
    await page.goto('/catalog/99999');

    await expect(page.getByRole('alert')).toHaveText('Product not found');
  });

  test('shows an error, and no product, when the product source fails', async ({
    page,
    productSource,
  }) => {
    productSource.fail();
    await page.goto('/catalog/1');

    await expect(page.getByRole('alert')).toHaveText(
      'Product could not be loaded. Please try again later.',
    );
    await expect(page.getByRole('main').getByRole('heading')).toHaveCount(0);
  });

  test('links back to the catalog', async ({ page }) => {
    await page.goto('/catalog/1');

    await page.getByRole('link', { name: 'Back to catalog' }).click();

    await expect(page).toHaveURL('/catalog');
  });

  test('adds the product to the Cart, once per selection, at its final price', async ({ page }) => {
    await page.goto('/catalog/1');
    const addToCart = page.getByRole('button', { name: 'Add to cart' });

    await addToCart.click();
    await addToCart.click();
    await openCart(page);

    const lines = page.getByRole('main').getByRole('listitem');
    await expect(lines).toHaveCount(1);
    await expect(lines).toContainText(mascara.title);
    await expect(lines).toContainText('$8.94');
    await expect(lines.getByLabel('Quantity', { exact: true })).toHaveText('2');
  });

  test('shows a loading indicator while the product is loading', async ({
    page,
    productSource,
  }) => {
    productSource.hold();
    await page.goto('/catalog/1');

    await expect(page.getByRole('progressbar', { name: 'Loading product' })).toBeVisible();

    productSource.release();
    await expect(page.getByRole('progressbar')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: mascara.title })).toBeVisible();
  });

  test('confirms that the product was added to the Cart, with a "View cart" action', async ({
    page,
  }) => {
    await page.goto('/catalog/1');

    await page.getByRole('button', { name: 'Add to cart' }).click();

    await expect(page.getByText('Added to cart')).toBeVisible();
    await expect(page.getByRole('button', { name: 'View cart' })).toBeVisible();
  });

  test('opens the cart page from the confirmation\'s "View cart" action', async ({ page }) => {
    await page.goto('/catalog/1');
    await page.getByRole('button', { name: 'Add to cart' }).click();

    await page.getByRole('button', { name: 'View cart' }).click();

    await expect(page).toHaveURL('/cart');
    await expect(
      page.getByRole('main').getByRole('listitem').filter({ hasText: mascara.title }),
    ).toBeVisible();
  });
});
