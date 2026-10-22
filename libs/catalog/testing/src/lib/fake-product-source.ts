import { type Product, ProductSource } from '@ngsample/catalog/domain';
import type { ProductId } from '@ngsample/shared/domain';

/** Test double for the product source port. */
export class FakeProductSource extends ProductSource {
  readonly searchedTerms: string[] = [];
  readonly requestedIds: ProductId[] = [];
  productsByTerm: Record<string, Product[]> = {};
  productsById: Record<ProductId, Product> = {};
  unavailable = false;
  /** When true, searches and lookups never settle, so the product list or detail stays loading. */
  hold = false;

  async search(term: string): Promise<readonly Product[]> {
    this.searchedTerms.push(term);
    if (this.unavailable) throw new Error('Product source unavailable');
    if (this.hold) return new Promise(() => undefined);
    return this.productsByTerm[term] ?? [];
  }

  async findById(id: ProductId): Promise<Product | undefined> {
    this.requestedIds.push(id);
    if (this.unavailable) throw new Error('Product source unavailable');
    if (this.hold) return new Promise(() => undefined);
    return this.productsById[id];
  }
}

export const product = (id: ProductId, title: string): Product => ({
  id,
  title,
  description: '',
  category: 'beauty',
  thumbnail: '',
  listPrice: { amountMinor: 999, currency: 'USD' },
  discount: 10.48,
});
