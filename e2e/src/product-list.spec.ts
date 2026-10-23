import { expect, eyeshadow, iphone, mascara, missingThumbnail, test } from './support/fixtures';

test.describe('Product list', () => {
  const products = (page: import('@playwright/test').Page) =>
    page.getByRole('main').getByRole('listitem');
  const product = (page: import('@playwright/test').Page, title: string) =>
    products(page).filter({ hasText: title });

  test('opening / shows the product list at /catalog', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL('/catalog');
    await expect(product(page, mascara.title)).toBeVisible();
  });

  test('shows each product with its title, thumbnail and price, striking through the list price of a discounted product', async ({
    page,
  }) => {
    await page.goto('/catalog');

    const discounted = product(page, mascara.title);
    await expect(discounted.getByRole('heading', { name: mascara.title })).toBeVisible();
    await expect(discounted.getByRole('img', { name: mascara.title })).toBeVisible();
    await expect(discounted).toContainText('$8.94');
    await expect(discounted.getByRole('deletion')).toHaveText('$9.99');

    const full = product(page, eyeshadow.title);
    await expect(full.getByRole('heading', { name: eyeshadow.title })).toBeVisible();
    await expect(full.getByRole('img', { name: eyeshadow.title })).toBeVisible();
    await expect(full).toContainText('$19.99');
    await expect(full.getByRole('deletion')).toHaveCount(0);
  });

  test('selecting a product opens its product detail', async ({ page }) => {
    await page.goto('/catalog');

    await product(page, mascara.title).getByRole('link').click();

    await expect(page).toHaveURL('/catalog/1');
  });

  test('shows the products matching the search term, or says that none match', async ({ page }) => {
    await page.goto('/catalog');
    const searchBox = page.getByRole('searchbox', { name: 'Search products' });

    await searchBox.fill('phone');
    await expect(products(page)).toHaveCount(1);
    await expect(product(page, iphone.title)).toBeVisible();

    await searchBox.fill('zzzz');
    await expect(page.getByText('No products match "zzzz"')).toBeVisible();
    await expect(products(page)).toHaveCount(0);
  });

  test('says the products could not be loaded when the product source fails, and shows them on retry once it recovers', async ({
    page,
    productSource,
  }) => {
    productSource.fail();
    await page.goto('/catalog');

    await expect(page.getByRole('alert')).toContainText('Products could not be loaded');
    await expect(products(page)).toHaveCount(0);

    productSource.recover();
    await page.getByRole('button', { name: 'Try again' }).click();

    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(product(page, mascara.title)).toBeVisible();
  });

  test('shows a placeholder named after the product when its thumbnail fails to load or is missing', async ({
    page,
    productSource,
  }) => {
    productSource.products = [
      { ...mascara, thumbnail: missingThumbnail },
      { ...eyeshadow, thumbnail: '' },
    ];
    await page.goto('/catalog');

    for (const title of [mascara.title, eyeshadow.title]) {
      const thumbnail = product(page, title).getByRole('img', { name: title });
      await expect(thumbnail).toBeVisible();
      await expect(thumbnail).not.toHaveJSProperty('naturalWidth', 0);
    }
  });

  test('shows a loading indicator while products are loading', async ({ page, productSource }) => {
    productSource.hold();
    await page.goto('/catalog');

    await expect(page.getByRole('progressbar', { name: 'Loading products' })).toBeVisible();

    productSource.release();
    await expect(page.getByRole('progressbar')).toHaveCount(0);
    await expect(product(page, mascara.title)).toBeVisible();
  });
});
