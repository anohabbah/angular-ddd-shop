import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ProductSource } from '@ngsample/catalog/domain';
import { provideCatalogInfrastructure } from './provide-catalog-infrastructure';

const mascaraDto = {
  id: 1,
  title: 'Essence Mascara Lash Princess',
  description: 'A volumizing and lengthening mascara.',
  category: 'beauty',
  thumbnail: 'https://cdn.dummyjson.com/mascara/thumbnail.webp',
  price: 9.99,
  discountPercentage: 10.48,
};

const mascara = {
  id: 1,
  title: 'Essence Mascara Lash Princess',
  description: 'A volumizing and lengthening mascara.',
  category: 'beauty',
  thumbnail: 'https://cdn.dummyjson.com/mascara/thumbnail.webp',
  listPrice: { amountMinor: 999, currency: 'USD' },
  discount: 10.48,
};

describe('ProductSource (dummyjson)', () => {
  let source: ProductSource;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideCatalogInfrastructure()],
    });
    source = TestBed.inject(ProductSource);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('reads the first page of all products for the empty search term', async () => {
    const products = source.search('', new AbortController().signal);

    const req = http.expectOne((r) => r.url === 'https://dummyjson.com/products');
    expect(req.request.params.get('limit')).toBe('30');
    req.flush({ products: [mascaraDto], total: 1, skip: 0, limit: 30 });

    await expect(products).resolves.toEqual([mascara]);
  });

  it('asks for only the parsed product fields when reading the first page', () => {
    source.search('', new AbortController().signal).catch(() => undefined);

    const req = http.expectOne((r) => r.url === 'https://dummyjson.com/products');
    expect(req.request.params.get('select')).toBe(
      'id,title,description,category,thumbnail,price,discountPercentage',
    );
    req.flush({ products: [], total: 0, skip: 0, limit: 30 });
  });

  it('searches products matching a non-empty search term', async () => {
    const products = source.search('phone', new AbortController().signal);

    const req = http.expectOne((r) => r.url === 'https://dummyjson.com/products/search');
    expect(req.request.params.get('q')).toBe('phone');
    expect(req.request.params.get('limit')).toBe('30');
    req.flush({ products: [mascaraDto], total: 1, skip: 0, limit: 30 });

    await expect(products).resolves.toEqual([mascara]);
  });

  it('asks for only the parsed product fields when searching', () => {
    source.search('phone', new AbortController().signal).catch(() => undefined);

    const req = http.expectOne((r) => r.url === 'https://dummyjson.com/products/search');
    expect(req.request.params.get('select')).toBe(
      'id,title,description,category,thumbnail,price,discountPercentage',
    );
    req.flush({ products: [], total: 0, skip: 0, limit: 30 });
  });

  it('rejects a payload with a negative price', async () => {
    const products = source.search('', new AbortController().signal);

    http
      .expectOne((r) => r.url === 'https://dummyjson.com/products')
      .flush({ products: [{ ...mascaraDto, price: -1 }], total: 1, skip: 0, limit: 30 });

    await expect(products).rejects.toThrow();
  });

  it('rejects a payload with a product missing its title', async () => {
    const untitled: Partial<typeof mascaraDto> = { ...mascaraDto };
    delete untitled.title;
    const products = source.search('', new AbortController().signal);

    http
      .expectOne((r) => r.url === 'https://dummyjson.com/products')
      .flush({ products: [untitled], total: 1, skip: 0, limit: 30 });

    await expect(products).rejects.toThrow();
  });

  it('reads one product by id', async () => {
    const product = source.findById(1, new AbortController().signal);

    http.expectOne((r) => r.url === 'https://dummyjson.com/products/1').flush(mascaraDto);

    await expect(product).resolves.toEqual(mascara);
  });

  it('asks for only the parsed product fields when reading one product', () => {
    source.findById(1, new AbortController().signal).catch(() => undefined);

    const req = http.expectOne((r) => r.url === 'https://dummyjson.com/products/1');
    expect(req.request.params.get('select')).toBe(
      'id,title,description,category,thumbnail,price,discountPercentage',
    );
    req.flush(mascaraDto);
  });

  it('has no product for an id unknown to the product source', async () => {
    const product = source.findById(99999, new AbortController().signal);

    http
      .expectOne((r) => r.url === 'https://dummyjson.com/products/99999')
      .flush(
        { message: "Product with id '99999' not found" },
        { status: 404, statusText: 'Not Found' },
      );

    await expect(product).resolves.toBeUndefined();
  });

  it('fails when the product source has a server error', async () => {
    const product = source.findById(1, new AbortController().signal);

    http
      .expectOne((r) => r.url === 'https://dummyjson.com/products/1')
      .flush('boom', { status: 500, statusText: 'Internal Server Error' });

    await expect(product).rejects.toThrow();
  });

  it('cancels a pending search when aborted', () => {
    const controller = new AbortController();
    source.search('', controller.signal).catch(() => undefined);
    const req = http.expectOne((r) => r.url === 'https://dummyjson.com/products');

    controller.abort();

    expect(req.cancelled).toBe(true);
  });

  it('cancels a pending product read when aborted', () => {
    const controller = new AbortController();
    source.findById(1, controller.signal).catch(() => undefined);
    const req = http.expectOne((r) => r.url === 'https://dummyjson.com/products/1');

    controller.abort();

    expect(req.cancelled).toBe(true);
  });
});
