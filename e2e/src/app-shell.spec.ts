import type { Locator } from '@playwright/test';
import { box } from './support/box';
import { expect, iphone, mascara, test } from './support/fixtures';
import { productInList } from './support/shopper';

/** The computed style of the element's first ancestor, itself included, that paints a background. */
function paintedBox(locator: Locator) {
  return locator.evaluate((element) => {
    let box: Element | null = element;
    while (box && getComputedStyle(box).backgroundColor === 'rgba(0, 0, 0, 0)') {
      box = box.parentElement;
    }
    const style = getComputedStyle(box ?? document.documentElement);
    return {
      backgroundColor: style.backgroundColor,
      topRightRadius: style.borderTopRightRadius,
      bottomRightRadius: style.borderBottomRightRadius,
    };
  });
}

test.describe('App shell', () => {
  test.describe('on a wide viewport', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('has one navigation landmark, named "Main", holding the Catalog and Cart links', async ({
      page,
    }) => {
      await page.goto('/catalog');

      const navigation = page.getByRole('navigation');
      await expect(navigation).toHaveCount(1);
      await expect(navigation).toHaveAccessibleName('Main');
      await expect(navigation.getByRole('link', { name: 'Catalog', exact: true })).toBeVisible();
      await expect(navigation.getByRole('link', { name: 'Cart', exact: true })).toBeVisible();
    });

    test('marks the Cart navigation link as the current page on the cart page', async ({
      page,
    }) => {
      await page.goto('/cart');

      const navigation = page.getByRole('navigation');
      await expect(navigation.getByRole('link', { name: 'Cart', exact: true })).toHaveAttribute(
        'aria-current',
        'page',
      );
      await expect(
        navigation.getByRole('link', { name: 'Catalog', exact: true }),
      ).not.toHaveAttribute('aria-current');
    });

    test('marks the Catalog navigation link as the current page on a product detail', async ({
      page,
    }) => {
      await page.goto('/catalog/1');

      await expect(
        page.getByRole('navigation').getByRole('link', { name: 'Catalog', exact: true }),
      ).toHaveAttribute('aria-current', 'page');
    });
  });

  for (const colorScheme of ['light', 'dark'] as const) {
    test.describe(`on a wide viewport, ${colorScheme}`, () => {
      test.use({ viewport: { width: 1280, height: 800 }, colorScheme });

      test('sets the navigation apart from the main content by its background', async ({
        page,
      }) => {
        await page.goto('/catalog');

        const navigation = await paintedBox(page.getByRole('navigation', { name: 'Main' }));
        const main = await paintedBox(page.getByRole('main'));

        expect(navigation.backgroundColor).not.toBe(main.backgroundColor);
        if (colorScheme === 'light') {
          expect(navigation.topRightRadius).toBe('0px');
          expect(navigation.bottomRightRadius).toBe('0px');
        }
      });
    });
  }

  test.describe('on a narrow viewport with the navigation open', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('keeps the navigation’s rounded outer corner', async ({ page }) => {
      await page.goto('/catalog');
      await page.getByRole('button', { name: 'Open navigation' }).click();

      const navigation = await paintedBox(page.getByRole('navigation', { name: 'Main' }));

      expect(navigation.topRightRadius).toBe('16px');
      expect(navigation.bottomRightRadius).toBe('16px');
    });

    test('keeps the navigation open when opened while the shop is still starting', async ({
      page,
    }) => {
      // Hold the lazy Catalog chunk, so the shop's first navigation is still pending.
      let release = () => undefined as void;
      const held = new Promise<void>((resolve) => (release = resolve));
      await page.route('**/*.js', async (route) => {
        const response = await route.fetch();
        const body = await response.text();
        if (body.includes('Search products')) await held;
        await route.fulfill({ response, body });
      });
      await page.goto('/catalog');
      const navigation = page.getByRole('navigation', { name: 'Main' });
      const toggle = page.getByRole('button', { name: 'Open navigation' });

      await toggle.click();
      await expect(navigation).toBeVisible();
      release();
      await expect(page.getByRole('heading', { name: 'Catalog', level: 1 })).toBeVisible();

      // A closing drawer still shows while it slides out, unlike the toggle's state.
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
      await expect(navigation).toBeVisible();
    });

    test('closes the navigation once a link in it is followed', async ({ page }) => {
      await page.goto('/catalog');
      await expect(page.getByRole('heading', { name: 'Catalog', level: 1 })).toBeVisible();
      const navigation = page.getByRole('navigation', { name: 'Main' });
      const toggle = page.getByRole('button', { name: 'Open navigation' });
      await toggle.click();

      await navigation.getByRole('link', { name: 'Cart', exact: true }).click();

      await expect(page).toHaveURL('/cart');
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await expect(navigation).toBeHidden();
    });

    test('closes the navigation once the link for the page already shown is selected', async ({
      page,
    }) => {
      await page.goto('/catalog');
      await expect(page.getByRole('heading', { name: 'Catalog', level: 1 })).toBeVisible();
      const navigation = page.getByRole('navigation', { name: 'Main' });
      const toggle = page.getByRole('button', { name: 'Open navigation' });
      await toggle.click();

      await navigation.getByRole('link', { name: 'Catalog', exact: true }).click();

      await expect(page).toHaveURL('/catalog');
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await expect(navigation).toBeHidden();
    });
  });

  for (const { width, height, narrow } of [
    { width: 1280, height: 800, narrow: false },
    { width: 390, height: 844, narrow: true },
  ]) {
    test.describe(`at ${width}px${narrow ? ' with the navigation open' : ''}`, () => {
      test.use({ viewport: { width, height } });

      test('insets the Catalog navigation link 12px from both edges of the navigation', async ({
        page,
      }) => {
        await page.goto('/catalog');
        if (narrow) {
          await page.getByRole('button', { name: 'Open navigation' }).click();
        }

        const navigation = page.getByRole('navigation', { name: 'Main' });
        const link = navigation.getByRole('link', { name: 'Catalog', exact: true });
        // Both boxes in one frame, since the narrow drawer may still be sliding in.
        const inset = await link.evaluate(
          (linkElement, navigationElement) => {
            if (!navigationElement) throw new Error('The navigation is not rendered');
            const outer = navigationElement.getBoundingClientRect();
            const inner = linkElement.getBoundingClientRect();
            return { left: inner.left - outer.left, right: outer.right - inner.right };
          },
          await navigation.elementHandle(),
        );

        // Mid-slide, the drawer's fractional transform leaves sub-pixel float error (11.9999995).
        expect(inset.left).toBeGreaterThanOrEqual(11.99);
        expect(inset.right).toBeGreaterThanOrEqual(11.99);
      });
    });
  }

  for (const viewport of [
    { width: 1920, height: 1080 },
    { width: 1280, height: 800 },
  ]) {
    test.describe(`at ${viewport.width}px`, () => {
      test.use({ viewport });

      test('lines the toolbar up with the main content column', async ({ page }) => {
        await page.goto('/catalog');
        await expect(productInList(page, mascara.title)).toBeVisible();

        const banner = page.getByRole('banner');
        const shopName = await box(banner.getByText('ngsample'));
        const cartLink = await box(banner.getByRole('link', { name: /^Cart/ }));
        const heading = await box(page.getByRole('heading', { level: 1, name: 'Catalog' }));
        const column = await box(page.getByRole('main').getByRole('list'));

        expect(shopName.x).toBeCloseTo(heading.x, 0);
        expect(cartLink.x + cartLink.width).toBeCloseTo(column.x + column.width, 0);
      });
    });
  }

  test.describe('while the product list scrolls', () => {
    // Short enough for the three stubbed products to overflow.
    test.use({ viewport: { width: 390, height: 500 } });

    test('shows a toolbar bottom line only away from the top', async ({ page }) => {
      await page.goto('/catalog');
      await expect(productInList(page, mascara.title)).toBeVisible();
      const banner = page.getByRole('banner');
      // An absent ::after still reports opacity 1, so a line also needs content, height and colour.
      const lineShown = () =>
        banner.evaluate((header) => {
          const line = getComputedStyle(header, '::after');
          return (
            line.content !== 'none' &&
            line.opacity === '1' &&
            parseFloat(line.height) > 0 &&
            line.backgroundColor !== 'rgba(0, 0, 0, 0)'
          );
        });
      const main = await box(page.getByRole('main'));
      // The middle of main's visible part: main itself runs past the bottom of the viewport.
      const visibleBottom = Math.min(main.y + main.height, await page.evaluate(() => innerHeight));
      await page.mouse.move(main.x + main.width / 2, (main.y + visibleBottom) / 2);

      expect(await lineShown()).toBe(false);

      await page.mouse.wheel(0, 400);
      await expect.poll(lineShown).toBe(true);

      await page.mouse.wheel(0, -400);
      await expect.poll(lineShown).toBe(false);
    });
  });

  test.describe('focus after navigating', () => {
    test('following a product link with Enter focuses the main content, so the next Tab reaches "Back to catalog"', async ({
      page,
    }) => {
      await page.goto('/catalog');

      await productInList(page, mascara.title).getByRole('link').press('Enter');

      await expect(page.getByRole('heading', { name: mascara.title })).toBeVisible();
      await expect(page.getByRole('main')).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(page.getByRole('link', { name: 'Back to catalog' })).toBeFocused();
    });

    test('selecting the Cart navigation link with the keyboard focuses the main content', async ({
      page,
    }) => {
      await page.goto('/catalog');
      // The link works as a plain link, reloading the shop, until the app has started.
      await expect(page.getByRole('heading', { name: 'Catalog', level: 1 })).toBeVisible();

      await page
        .getByRole('navigation')
        .getByRole('link', { name: 'Cart', exact: true })
        .press('Enter');

      await expect(page).toHaveURL('/cart');
      await expect(page.getByRole('main')).toBeFocused();
    });

    test('opening the shop leaves focus on the document', async ({ page }) => {
      await page.goto('/catalog');
      await expect(page.getByRole('heading', { name: 'Catalog', level: 1 })).toBeVisible();

      expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
    });
  });

  test.describe('on a short narrow viewport', () => {
    test.use({ viewport: { width: 390, height: 500 } });

    test('moving focus backwards to the first product shows it entirely below the page header', async ({
      page,
    }) => {
      await page.goto('/catalog');
      await productInList(page, iphone.title).getByRole('link').focus();

      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Shift+Tab');

      const first = productInList(page, mascara.title).getByRole('link');
      await expect(first).toBeFocused();
      const headerBottom = await page
        .getByRole('banner')
        .evaluate((header) => header.getBoundingClientRect().bottom);
      const focusedTop = await first.evaluate((link) => link.getBoundingClientRect().top);
      expect(focusedTop).toBeGreaterThanOrEqual(headerBottom);
    });
  });
});
