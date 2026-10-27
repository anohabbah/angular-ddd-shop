import type { Page } from '@playwright/test';
import { expect, eyeshadow, mascara, test } from './support/fixtures';
import { addToCart, openCart } from './support/shopper';

const cartLines = (page: Page) => page.getByRole('main').getByRole('listitem');

test.describe('Cart page', () => {
  test('says the Cart is empty and shows no Cart total', async ({ page }) => {
    await page.goto('/cart');

    await expect(page.getByText('Your cart is empty')).toBeVisible();
    await expect(page.getByText('Cart total')).toHaveCount(0);
  });

  test('shows each Cart line with its prices and quantity, and the Cart total', async ({
    page,
  }) => {
    await page.goto('/');
    await addToCart(page, mascara.title, 3);
    await openCart(page);

    const line = cartLines(page).filter({ hasText: mascara.title });
    await expect(line.getByRole('link', { name: mascara.title })).toHaveAttribute(
      'href',
      '/catalog/1',
    );
    await expect(line.getByRole('presentation')).toBeVisible();
    await expect(page.getByRole('main').getByRole('img')).toHaveCount(0);
    await expect(line).toContainText('$8.94');
    await expect(line.getByRole('status', { name: `Quantity of ${mascara.title}` })).toHaveText(
      '3',
    );
    await expect(line).toContainText('$26.82');
    await expect(page.getByText('Cart total: $26.82')).toBeVisible();
  });

  test('increases a quantity, and cannot decrease it below 1', async ({ page }) => {
    await page.goto('/');
    await addToCart(page, mascara.title);
    await openCart(page);
    const line = cartLines(page).filter({ hasText: mascara.title });
    const decrease = line.getByRole('button', { name: `Decrease quantity of ${mascara.title}` });

    await expect(decrease).toBeDisabled();

    await line.getByRole('button', { name: `Increase quantity of ${mascara.title}` }).click();

    await expect(line.getByRole('status', { name: `Quantity of ${mascara.title}` })).toHaveText(
      '2',
    );
    await expect(decrease).toBeEnabled();
  });

  test('removes a Cart line and keeps the others', async ({ page }) => {
    await page.goto('/');
    await addToCart(page, mascara.title);
    await addToCart(page, eyeshadow.title);
    await openCart(page);

    await page.getByRole('button', { name: `Remove ${mascara.title}` }).click();

    await expect(cartLines(page)).toHaveCount(1);
    await expect(cartLines(page)).toContainText(eyeshadow.title);
  });

  test('keeps the Cart while the shopper browses, and empties it on reload', async ({ page }) => {
    await page.goto('/');
    await addToCart(page, mascara.title);
    await page.getByRole('link', { name: 'Back to catalog' }).click();
    await expect(page).toHaveURL('/catalog');

    await openCart(page);
    await expect(cartLines(page).filter({ hasText: mascara.title })).toBeVisible();

    await page.reload();
    await expect(page.getByText('Your cart is empty')).toBeVisible();
  });

  test("names each Cart line's controls after its product", async ({ page }) => {
    await page.goto('/');
    await addToCart(page, mascara.title);
    await addToCart(page, eyeshadow.title);
    await openCart(page);

    const main = page.getByRole('main');
    await expect(main.getByRole('button', { name: `Remove ${mascara.title}` })).toBeVisible();
    await expect(main.getByRole('button', { name: `Remove ${eyeshadow.title}` })).toBeVisible();
    await expect(
      main.getByRole('button', { name: `Increase quantity of ${mascara.title}` }),
    ).toBeVisible();
    await expect(
      main.getByRole('button', { name: `Decrease quantity of ${eyeshadow.title}` }),
    ).toBeVisible();
    await expect(main.getByRole('button', { name: 'Remove', exact: true })).toHaveCount(0);
  });

  test('announces the new quantity and Cart total, keeping focus on the control', async ({
    page,
  }) => {
    await page.goto('/');
    await addToCart(page, mascara.title);
    await openCart(page);
    const main = page.getByRole('main');
    const increase = main.getByRole('button', { name: `Increase quantity of ${mascara.title}` });

    await increase.press('Enter');

    await expect(main.getByRole('status', { name: `Quantity of ${mascara.title}` })).toHaveText(
      '2',
    );
    await expect(main.getByRole('status').filter({ hasText: 'Cart total' })).toHaveText(
      'Cart total: $17.88',
    );
    await expect(increase).toBeFocused();
  });

  test('keeps focus on the Decrease control when the quantity it decreased reaches 1', async ({
    page,
  }) => {
    await page.goto('/');
    await addToCart(page, mascara.title, 2);
    await openCart(page);
    const main = page.getByRole('main');
    const decrease = main.getByRole('button', { name: `Decrease quantity of ${mascara.title}` });

    await decrease.press('Enter');

    await expect(main.getByRole('status', { name: `Quantity of ${mascara.title}` })).toHaveText(
      '1',
    );
    await expect(decrease).toBeDisabled();
    await expect(decrease).toBeFocused();
  });

  test.describe('focus after removing a Cart line', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await addToCart(page, mascara.title);
    });

    test('moves to the Remove button of the line that followed', async ({ page }) => {
      await addToCart(page, eyeshadow.title);
      await openCart(page);

      await page.getByRole('button', { name: `Remove ${mascara.title}` }).press('Enter');

      await expect(page.getByRole('button', { name: `Remove ${eyeshadow.title}` })).toBeFocused();
    });

    test('moves to the Remove button of the line before when the last line is removed', async ({
      page,
    }) => {
      await addToCart(page, eyeshadow.title);
      await openCart(page);

      await page.getByRole('button', { name: `Remove ${eyeshadow.title}` }).press('Enter');

      await expect(page.getByRole('button', { name: `Remove ${mascara.title}` })).toBeFocused();
    });

    test('moves to the empty-cart message when the only line is removed', async ({ page }) => {
      await openCart(page);

      await page.getByRole('button', { name: `Remove ${mascara.title}` }).press('Enter');

      await expect(page.getByText('Your cart is empty')).toBeFocused();
    });
  });
});
