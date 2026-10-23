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
    await expect(line.getByRole('img', { name: mascara.title })).toBeVisible();
    await expect(line).toContainText('$8.94');
    await expect(line.getByLabel('Quantity', { exact: true })).toHaveText('3');
    await expect(line).toContainText('$26.82');
    await expect(page.getByText('Cart total: $26.82')).toBeVisible();
  });

  test('increases a quantity, and cannot decrease it below 1', async ({ page }) => {
    await page.goto('/');
    await addToCart(page, mascara.title);
    await openCart(page);
    const line = cartLines(page).filter({ hasText: mascara.title });
    const decrease = line.getByRole('button', { name: 'Decrease quantity' });

    await expect(decrease).toBeDisabled();

    await line.getByRole('button', { name: 'Increase quantity' }).click();

    await expect(line.getByLabel('Quantity', { exact: true })).toHaveText('2');
    await expect(decrease).toBeEnabled();
  });

  test('removes a Cart line and keeps the others', async ({ page }) => {
    await page.goto('/');
    await addToCart(page, mascara.title);
    await addToCart(page, eyeshadow.title);
    await openCart(page);

    await cartLines(page)
      .filter({ hasText: mascara.title })
      .getByRole('button', { name: 'Remove' })
      .click();

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
});
