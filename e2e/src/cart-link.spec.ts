import { expect, eyeshadow, mascara, test } from './support/fixtures';
import { addToCart } from './support/shopper';

test.describe('Cart link', () => {
  test('shows the item count, the sum of the quantities, and states it in its name', async ({
    page,
  }) => {
    await page.goto('/');
    await addToCart(page, mascara.title, 3);
    await addToCart(page, eyeshadow.title);

    const cartLink = page.getByRole('banner').getByRole('link', { name: 'Cart, 4 items' });
    await expect(cartLink).toBeVisible();
    await expect(cartLink.getByText('4', { exact: true })).toBeVisible();
  });

  test('states a single item in the singular', async ({ page }) => {
    await page.goto('/');
    await addToCart(page, mascara.title);

    await expect(
      page.getByRole('banner').getByRole('link', { name: 'Cart, 1 item', exact: true }),
    ).toBeVisible();
  });

  test('shows no item count when the Cart is empty, and still states it in its name', async ({
    page,
  }) => {
    await page.goto('/');

    const cartLink = page.getByRole('banner').getByRole('link', { name: 'Cart, 0 items' });
    await expect(cartLink).toBeVisible();
    await expect(cartLink.getByText('0', { exact: true })).toBeHidden();
  });

  test('opens the cart page from a product detail', async ({ page }) => {
    await page.goto('/catalog/1');

    await page.getByRole('banner').getByRole('link', { name: 'Cart, 0 items' }).click();

    await expect(page).toHaveURL('/cart');
  });
});
