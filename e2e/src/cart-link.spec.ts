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

  test('is in the toolbar as soon as the navigation is, however late its texts load', async ({
    page,
  }) => {
    // Delay the script carrying the Cart link's texts.
    await page.route('**/*.js', async (route) => {
      const response = await route.fetch();
      if ((await response.text()).includes('Cart, {count, plural')) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      await route.fulfill({ response });
    });

    // Wide enough for the navigation to show without opening it.
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await expect(page.getByRole('navigation').getByRole('link', { name: 'Catalog' })).toBeVisible();
    const cartLinkShown = await page
      .getByRole('banner')
      .getByRole('link', { name: 'Cart, 0 items' })
      .isVisible();
    await page.unrouteAll({ behavior: 'wait' });

    expect(cartLinkShown).toBe(true);
  });

  test('opens the cart page from a product detail', async ({ page }) => {
    await page.goto('/catalog/1');

    await page.getByRole('banner').getByRole('link', { name: 'Cart, 0 items' }).click();

    await expect(page).toHaveURL('/cart');
  });
});
