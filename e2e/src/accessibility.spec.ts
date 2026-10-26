import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, eyeshadow, mascara, type ProductSource, test } from './support/fixtures';
import { productInList } from './support/shopper';

/** WCAG 2.2 level A and AA, without axe's best-practice rules. */
const WCAG_22_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

type Setup = {
  name: string;
  viewport: { width: number; height: number };
  colorScheme: 'light' | 'dark';
  narrow: boolean;
};

const widths = [
  { label: 'widest', viewport: { width: 1920, height: 1080 }, narrow: false },
  { label: 'wide', viewport: { width: 1280, height: 800 }, narrow: false },
  { label: 'narrow', viewport: { width: 390, height: 844 }, narrow: true },
  { label: 'reflow', viewport: { width: 320, height: 640 }, narrow: true },
];

/** Every width in both color schemes. */
const setups: Setup[] = widths.flatMap(({ label, viewport, narrow }) =>
  (['light', 'dark'] as const).map((colorScheme) => ({
    name: `${label} ${colorScheme} ${viewport.width}`,
    viewport,
    colorScheme,
    narrow,
  })),
);

type State = {
  name: string;
  narrowOnly?: boolean;
  /** Reaches the state by role, label and text, the way a shopper would. */
  reach: (page: Page, productSource: ProductSource) => Promise<void>;
};

const states: State[] = [
  {
    name: 'product list, loaded',
    reach: async (page) => {
      await page.goto('/catalog');
      await expect(productInList(page, mascara.title)).toBeVisible();
    },
  },
  {
    name: 'product list, loading',
    reach: async (page, productSource) => {
      productSource.hold();
      await page.goto('/catalog');
      await expect(
        page.getByRole('progressbar', { name: 'Chargement des produits' }),
      ).toBeVisible();
    },
  },
  {
    name: 'product list, failed',
    reach: async (page, productSource) => {
      productSource.fail();
      await page.goto('/catalog');
      await expect(page.getByRole('alert')).toBeVisible();
    },
  },
  {
    name: 'product list, no matches',
    reach: async (page) => {
      await page.goto('/catalog');
      await page.getByRole('searchbox', { name: 'Rechercher des produits' }).fill('zzzz');
      await expect(page.getByRole('main').getByRole('status')).toHaveText(
        'Aucun produit ne correspond à « zzzz »',
      );
    },
  },
  {
    name: 'product detail, loaded',
    reach: async (page) => {
      await page.goto('/catalog/1');
      await expect(page.getByRole('heading', { name: mascara.title })).toBeVisible();
    },
  },
  {
    name: 'product detail, loading',
    reach: async (page, productSource) => {
      productSource.hold();
      await page.goto('/catalog/1');
      await expect(page.getByRole('progressbar', { name: 'Chargement du produit' })).toBeVisible();
    },
  },
  {
    name: 'product detail, not found',
    reach: async (page) => {
      await page.goto('/catalog/abc');
      await expect(page.getByRole('heading', { name: 'Produit introuvable' })).toBeVisible();
    },
  },
  {
    name: 'product detail, failed',
    reach: async (page, productSource) => {
      productSource.fail();
      await page.goto('/catalog/1');
      await expect(page.getByRole('alert')).toBeVisible();
    },
  },
  {
    name: 'cart page, empty',
    reach: async (page) => {
      await page.goto('/cart');
      await expect(page.getByText('Votre panier est vide')).toBeVisible();
    },
  },
  {
    name: 'cart page, with Cart lines',
    reach: reachCartWithLines,
  },
  {
    name: 'navigation open',
    narrowOnly: true,
    reach: async (page) => {
      await page.goto('/catalog');
      await expect(productInList(page, mascara.title)).toBeVisible();
      await page.getByRole('button', { name: 'Ouvrir la navigation' }).click();
      await expect(
        page.getByRole('navigation').getByRole('link', { name: 'Panier', exact: true }),
      ).toBeVisible();
    },
  },
];

/**
 * Fills the in-memory Cart through in-page links only: on a narrow viewport the navigation is
 * closed, so the navigation-based shopper helpers can't be used.
 */
async function reachCartWithLines(page: Page): Promise<void> {
  await page.goto('/catalog');
  await productInList(page, mascara.title).getByRole('link').click();
  await page.getByRole('button', { name: 'Ajouter au panier' }).click();
  await page.getByRole('link', { name: 'Retour au catalogue' }).click();
  await productInList(page, eyeshadow.title).getByRole('link').click();
  await page.getByRole('button', { name: 'Ajouter au panier' }).click();
  await page.getByRole('link', { name: 'Voir le panier' }).click();
  await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(2);
}

/** Rule id and failing elements of each WCAG 2.2 A or AA violation, so a failure names the rule. */
async function wcagViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_22_AA).analyze();
  return violations.map((v) => ({ rule: v.id, help: v.help, nodes: v.nodes.map((n) => n.target) }));
}

/** Any element, the page included, that the shopper would have to scroll sideways. */
function horizontalScrollers(page: Page) {
  return page.evaluate(() =>
    [document.documentElement, ...document.body.querySelectorAll('*')]
      .filter((el) => {
        const overflowX = getComputedStyle(el).overflowX;
        const scrolls =
          el === document.documentElement || overflowX === 'auto' || overflowX === 'scroll';
        return scrolls && el.scrollWidth > el.clientWidth + 1;
      })
      .map((el) => el.outerHTML.slice(0, 80)),
  );
}

/** WCAG 1.4.12's text spacing, applied as a user stylesheet would. */
const TEXT_SPACING = `
  * { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }
  p { margin-bottom: 2em !important; }
`;

/** Elements whose exposed text no longer fits a box that hides overflow. */
function clippedText(page: Page) {
  return page.evaluate(() =>
    [...document.body.querySelectorAll('*')]
      .filter((el) => {
        if (el.closest('[aria-hidden="true"]') || !el.textContent?.trim()) return false;
        const style = getComputedStyle(el);
        const hides = (o: string) => o === 'hidden' || o === 'clip';
        if (!hides(style.overflowX) && !hides(style.overflowY)) return false;
        // Visually hidden text (sr-only) is meant to be clipped.
        if (el.clientWidth <= 1 || el.clientHeight <= 1) return false;
        return el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1;
      })
      .map((el) => el.outerHTML.slice(0, 80)),
  );
}

test.describe('Accessibility', () => {
  /* The conformance matrix is checked in the default Locale. */
  test.use({ locale: 'fr-FR' });

  for (const setup of setups) {
    test.describe(setup.name, () => {
      test.use({ viewport: setup.viewport, colorScheme: setup.colorScheme });

      for (const state of states.filter((s) => setup.narrow || !s.narrowOnly)) {
        test(`${state.name}, ${setup.name}: conforms to WCAG 2.2 AA`, async ({
          page,
          productSource,
        }) => {
          await state.reach(page, productSource);

          await expect(page.locator('html')).toHaveAttribute('lang', 'fr-FR');
          expect(await wcagViolations(page)).toEqual([]);
          if (!state.narrowOnly) {
            await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
          }
          if (setup.viewport.width === 320) expect(await horizontalScrollers(page)).toEqual([]);
        });
      }
    });
  }

  test.describe('at 320 CSS px with increased text spacing', () => {
    test.use({ viewport: { width: 320, height: 640 } });

    const pages = states.filter((s) =>
      ['product list, loaded', 'product detail, loaded', 'cart page, with Cart lines'].includes(
        s.name,
      ),
    );
    for (const state of pages) {
      test(`${state.name}: no sideways scrolling and no clipped text`, async ({
        page,
        productSource,
      }) => {
        await state.reach(page, productSource);

        await page.addStyleTag({ content: TEXT_SPACING });

        expect(await horizontalScrollers(page)).toEqual([]);
        expect(await clippedText(page)).toEqual([]);
      });
    }
  });

  test('cart line controls are at least 24 × 24 CSS px', async ({ page }) => {
    await reachCartWithLines(page);

    const controls = page.getByRole('main').getByRole('button');
    await expect(controls).toHaveCount(6);
    for (const control of await controls.all()) {
      const size = await control.evaluate((el) => {
        const { width, height } = el.getBoundingClientRect();
        return { width, height };
      });
      expect(size.width).toBeGreaterThanOrEqual(24);
      expect(size.height).toBeGreaterThanOrEqual(24);
    }
  });
});
