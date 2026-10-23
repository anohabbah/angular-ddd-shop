import type { Page } from '@playwright/test';
import { expect, mascara, test } from './support/fixtures';
import { addToCart, openCart } from './support/shopper';

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

    await expect(
      page.getByRole('main').getByRole('heading', { level: 1, name: 'Product not found' }),
    ).toBeVisible();
    expect(productSource.requests).toEqual([]);
  });

  test('says the product is not found when the product source has no product with that id', async ({
    page,
  }) => {
    await page.goto('/catalog/99999');

    await expect(
      page.getByRole('main').getByRole('heading', { level: 1, name: 'Product not found' }),
    ).toBeVisible();
  });

  test('shows an error under the heading "Product", and no product, when the product source fails', async ({
    page,
    productSource,
  }) => {
    productSource.fail();
    await page.goto('/catalog/1');

    await expect(page.getByRole('alert')).toHaveText(
      'Product could not be loaded. Please try again later.',
    );
    await expect(page.getByRole('main').getByRole('heading')).toHaveText(['Product']);
    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveText('Product');
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
    await expect(lines.getByRole('status', { name: `Quantity of ${mascara.title}` })).toHaveText(
      '2',
    );
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

  test.describe('add-to-cart confirmation', () => {
    const inCart = (page: Page) => page.getByRole('main').getByRole('status');

    test('states the quantity in the Cart with a "View cart" link, keeping focus on "Add to cart"', async ({
      page,
    }) => {
      await page.goto('/catalog/1');
      const addToCart = page.getByRole('button', { name: 'Add to cart' });

      await addToCart.press('Enter');

      await expect(inCart(page)).toContainText('Quantity in cart: 1');
      await expect(inCart(page).getByRole('link', { name: 'View cart' })).toBeVisible();
      await expect(addToCart).toBeFocused();

      await addToCart.press('Enter');
      await expect(inCart(page)).toContainText('Quantity in cart: 2');
    });

    test('stays shown without the shopper acting', async ({ page }) => {
      await page.clock.install();
      await page.goto('/catalog/1');
      await page.getByRole('button', { name: 'Add to cart' }).click();

      await page.clock.fastForward(10_000);

      await expect(inCart(page)).toContainText('Quantity in cart: 1');
      await expect(inCart(page).getByRole('link', { name: 'View cart' })).toBeVisible();
    });

    test('states the quantity of a product already in the Cart', async ({ page }) => {
      await page.goto('/');
      await addToCart(page, mascara.title, 3);
      await openCart(page);

      await addToCart(page, mascara.title, 0);

      await expect(inCart(page)).toContainText('Quantity in cart: 3');
      await expect(inCart(page).getByRole('link', { name: 'View cart' })).toBeVisible();
    });

    test('opens the cart page from its "View cart" link', async ({ page }) => {
      await page.goto('/catalog/1');
      await page.getByRole('button', { name: 'Add to cart' }).click();

      await inCart(page).getByRole('link', { name: 'View cart' }).click();

      await expect(page).toHaveURL('/cart');
      await expect(
        page.getByRole('main').getByRole('listitem').filter({ hasText: mascara.title }),
      ).toBeVisible();
    });
  });
});
