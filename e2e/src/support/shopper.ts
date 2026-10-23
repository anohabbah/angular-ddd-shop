import { expect, type Locator, type Page } from '@playwright/test';

/** A product's entry in the product list, found by its title. */
export function productInList(page: Page, title: string): Locator {
  return page.getByRole('main').getByRole('listitem').filter({ hasText: title });
}

/**
 * Adds a product from its product detail, `times` times, reaching it through the app's navigation:
 * the Cart lives in memory, so the app must not reload.
 */
export async function addToCart(page: Page, title: string, times = 1): Promise<void> {
  await page.getByRole('navigation').getByRole('link', { name: 'Catalog', exact: true }).click();
  await productInList(page, title).getByRole('link').click();
  const addToCart = page.getByRole('button', { name: 'Add to cart' });
  for (let i = 0; i < times; i++) await addToCart.click();
}

/** Opens the cart page from the navigation, keeping the in-memory Cart. */
export async function openCart(page: Page): Promise<void> {
  await page.getByRole('navigation').getByRole('link', { name: 'Cart', exact: true }).click();
  await expect(page).toHaveURL('/cart');
}
