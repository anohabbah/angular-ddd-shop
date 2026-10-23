import type { Locator } from '@playwright/test';
import { box } from './support/box';
import { expect, eyeshadow, iphone, mascara, missingThumbnail, test } from './support/fixtures';

/** Expects the media to start at the entry's top edge, span its width, and be square, within 2px. */
async function expectSpansEntry(media: Locator, entry: Locator) {
  await expect(media).toBeVisible();
  const mediaBox = await box(media);
  const entryBox = await box(entry);
  expect(Math.abs(mediaBox.y - entryBox.y)).toBeLessThanOrEqual(2);
  expect(Math.abs(mediaBox.width - entryBox.width)).toBeLessThanOrEqual(2);
  expect(Math.abs(mediaBox.height - mediaBox.width)).toBeLessThanOrEqual(2);
}

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
    await expect(discounted.getByRole('presentation')).toBeVisible();
    await expect(discounted).toContainText('$8.94');
    await expect(discounted.getByRole('deletion')).toHaveText('$9.99');

    const full = product(page, eyeshadow.title);
    await expect(full.getByRole('heading', { name: eyeshadow.title })).toBeVisible();
    await expect(full.getByRole('presentation')).toBeVisible();
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

  test('shows a placeholder when its thumbnail fails to load or is missing', async ({
    page,
    productSource,
  }) => {
    productSource.products = [
      { ...mascara, thumbnail: missingThumbnail },
      { ...eyeshadow, thumbnail: '' },
    ];
    await page.goto('/catalog');

    for (const title of [mascara.title, eyeshadow.title]) {
      // The placeholder is decorative, hidden from assistive technologies like the thumbnail.
      const placeholder = product(page, title).getByRole('img', { includeHidden: true });
      await expect(placeholder).toBeVisible();
      await expect(placeholder).not.toHaveJSProperty('naturalWidth', 0);
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

  test('has the level-one heading "Catalog" while loading, once loaded and when the product source fails', async ({
    page,
    productSource,
  }) => {
    const heading = page.getByRole('main').getByRole('heading', { level: 1 });

    productSource.hold();
    await page.goto('/catalog');
    await expect(page.getByRole('progressbar', { name: 'Loading products' })).toBeVisible();
    await expect(heading).toHaveText('Catalog');

    productSource.release();
    await expect(product(page, mascara.title)).toBeVisible();
    await expect(heading).toHaveText('Catalog');

    productSource.fail();
    await page.reload();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(heading).toHaveText('Catalog');
  });

  test('says in text which price is the final price and which the list price', async ({ page }) => {
    await page.goto('/catalog');

    const discounted = product(page, mascara.title);
    await expect(discounted).toContainText('Final price $8.94');
    await expect(discounted).toContainText('List price $9.99');
    await expect(discounted.getByRole('deletion')).toHaveText('$9.99');

    const full = product(page, eyeshadow.title);
    await expect(full).toContainText('Final price $19.99');
    await expect(full).not.toContainText('List price');
  });

  test("names each product's link after its title once, followed by its prices, and gives thumbnails no text alternative", async ({
    page,
  }) => {
    await page.goto('/catalog');

    await expect(product(page, mascara.title).getByRole('link')).toHaveAccessibleName(
      new RegExp(`^${mascara.title} Final price`),
    );
    await expect(product(page, eyeshadow.title).getByRole('presentation')).toBeVisible();
    await expect(page.getByRole('main').getByRole('img')).toHaveCount(0);
  });

  test('states the outcome of each settled search term in a status message, keeping focus in the search field', async ({
    page,
  }) => {
    await page.goto('/catalog');
    const status = page.getByRole('main').getByRole('status');
    const searchBox = page.getByRole('searchbox', { name: 'Search products' });

    await expect(status).toHaveText('3 products');

    await searchBox.fill('iphone');
    await expect(status).toHaveText('1 product');

    await searchBox.fill('zzzz');
    await expect(status).toHaveText('No products match "zzzz"');
    await expect(searchBox).toBeFocused();
  });

  test.describe('entry layout on a wide viewport', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('spans the entry with its thumbnail', async ({ page }) => {
      await page.goto('/catalog');

      const entry = product(page, mascara.title);
      await expectSpansEntry(entry.getByRole('presentation'), entry);
    });

    test("fills the thumbnail's square with the placeholder", async ({ page, productSource }) => {
      productSource.products = [{ ...mascara, thumbnail: missingThumbnail }, eyeshadow, iphone];
      await page.goto('/catalog');

      const entry = product(page, mascara.title);
      await expectSpansEntry(entry.getByRole('img', { includeHidden: true }), entry);
    });

    test('lines up the Final prices across a row', async ({ page }) => {
      await page.goto('/catalog');
      const wrapping = product(page, mascara.title);
      const oneLine = product(page, iphone.title);

      // Preconditions: the entries share a row, and their titles differ in height,
      // or the prices line up trivially.
      expect((await box(wrapping)).y).toBe((await box(oneLine)).y);
      const wrappingTitle = await box(wrapping.getByRole('heading', { name: mascara.title }));
      const oneLineTitle = await box(oneLine.getByRole('heading', { name: iphone.title }));
      expect(wrappingTitle.height).toBeGreaterThan(oneLineTitle.height);

      const wrappingPrice = await box(wrapping.getByText('Final price'));
      const oneLinePrice = await box(oneLine.getByText('Final price'));
      expect(Math.abs(wrappingPrice.y - oneLinePrice.y)).toBeLessThanOrEqual(1);
    });
  });

  test.describe('entry layout on a narrow viewport', () => {
    test.use({ viewport: { width: 320, height: 640 } });

    test('spans the entry with its thumbnail', async ({ page }) => {
      await page.goto('/catalog');

      const entry = product(page, mascara.title);
      await expectSpansEntry(entry.getByRole('presentation'), entry);
    });
  });
});
