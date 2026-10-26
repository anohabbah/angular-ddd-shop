import { test as base, type Route } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { collectCoverage, coverageReport } from './coverage';

/** A product as dummyjson.com serves it: the external contract the app's adapter parses. */
export type ProductDto = {
  id: number;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  price: number;
  discountPercentage: number;
};

export const mascara: ProductDto = {
  id: 1,
  title: 'Essence Mascara Lash Princess',
  description: 'A volumizing and lengthening mascara.',
  category: 'beauty',
  thumbnail: 'https://cdn.dummyjson.com/mascara/thumbnail.webp',
  price: 9.99,
  discountPercentage: 10.48,
};

export const eyeshadow: ProductDto = {
  id: 2,
  title: 'Eyeshadow Palette with Mirror',
  description: 'A palette with a built-in mirror.',
  category: 'beauty',
  thumbnail: 'https://cdn.dummyjson.com/eyeshadow/thumbnail.webp',
  price: 19.99,
  discountPercentage: 0,
};

export const iphone: ProductDto = {
  id: 3,
  title: 'iPhone 9',
  description: 'An apple mobile which is nothing like apple.',
  category: 'smartphones',
  thumbnail: 'https://cdn.dummyjson.com/iphone/thumbnail.webp',
  price: 549,
  discountPercentage: 0,
};

/** A thumbnail URL the image CDN answers with a 404. */
export const missingThumbnail = 'https://cdn.dummyjson.com/missing/thumbnail.webp';

// 1×1 PNG, served for every other thumbnail.
const image = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
  'base64',
);

// The icon font Google Fonts serves, from the material-symbols package. Its stylesheet's relative
// font URL resolves against the Google Fonts origin, so both files are served from there.
const iconFontDir = dirname(require.resolve('material-symbols/outlined.css'));
const iconFontCss = readFileSync(join(iconFontDir, 'outlined.css'));
const iconFont = readFileSync(join(iconFontDir, 'material-symbols-outlined.woff2'));

export class ProductSource {
  /** What the product source serves, for the product list, the search and by id. */
  products: ProductDto[] = [mascara, eyeshadow, iphone];
  /** Path and query of each request made to the product source, in order. */
  readonly requests: string[] = [];

  #failing = false;
  #held: Promise<void> = Promise.resolve();
  #release = () => undefined as void;

  /** Answers every request with a 500 until `recover()`. */
  fail(): void {
    this.#failing = true;
  }

  recover(): void {
    this.#failing = false;
  }

  /** Keeps requests pending until `release()`, to observe loading states. */
  hold(): void {
    this.#held = new Promise((resolve) => (this.#release = resolve));
  }

  release(): void {
    this.#release();
  }

  async handle(route: Route): Promise<void> {
    const url = new URL(route.request().url());
    this.requests.push(url.pathname + url.search);
    await this.#held;
    if (this.#failing) return route.fulfill({ status: 500, headers: cors, body: 'boom' });

    const byId = url.pathname.match(/^\/products\/(\d+)$/);
    if (byId) {
      const product = this.products.find((p) => p.id === Number(byId[1]));
      return product
        ? json(route, product)
        : json(route, { message: `Product with id '${byId[1]}' not found` }, 404);
    }
    const q = url.pathname === '/products/search' ? (url.searchParams.get('q') ?? '') : '';
    const products = this.products.filter((p) => p.title.toLowerCase().includes(q.toLowerCase()));
    return json(route, { products, total: products.length, skip: 0, limit: 30 });
  }
}

const cors = { 'access-control-allow-origin': '*' };

function json(route: Route, body: unknown, status = 200): Promise<void> {
  return route.fulfill({ status, headers: cors, json: body });
}

/**
 * Every test runs against a stubbed product source, image CDN and icon font, so icons render as
 * glyphs as they do in production. Any other cross-origin request is aborted, so tests never use
 * the network. With `COVERAGE=1`, every test also records the app code it ran.
 */
export const test = base.extend<{ productSource: ProductSource; coverage: void }>({
  productSource: [
    async ({ page, baseURL }, use) => {
      const source = new ProductSource();
      const appOrigin = new URL(baseURL ?? 'http://localhost:4200').origin;
      await page.route(
        (url) => url.origin !== appOrigin,
        (route) => {
          const url = new URL(route.request().url());
          if (url.origin === 'https://dummyjson.com') return source.handle(route);
          if (url.origin === 'https://cdn.dummyjson.com') {
            return url.href === missingThumbnail
              ? route.fulfill({ status: 404 })
              : route.fulfill({ contentType: 'image/png', body: image });
          }
          if (url.origin === 'https://fonts.googleapis.com') {
            return url.pathname === '/css2'
              ? route.fulfill({ contentType: 'text/css', body: iconFontCss })
              : route.fulfill({ contentType: 'font/woff2', headers: cors, body: iconFont });
          }
          return route.abort();
        },
      );
      await use(source);
    },
    { auto: true },
  ],
  coverage: [
    async ({ page }, use) => {
      if (!collectCoverage) return use();
      await page.coverage.startJSCoverage({ resetOnNavigation: false });
      await use();
      await coverageReport().add(await page.coverage.stopJSCoverage());
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
