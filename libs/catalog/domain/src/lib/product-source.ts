import type { ProductId } from '@ngsample/shared-domain';
import type { Product } from './product';

/**
 * Port to the external system the Catalog reads its products from. An abstract class so it can be
 * an Angular DI token without importing Angular here.
 */
export abstract class ProductSource {
  /** Products matching the settled search term; the first page of all products when it is empty. */
  abstract search(term: string, abortSignal: AbortSignal): Promise<readonly Product[]>;

  /** The product with that id; `undefined` when the product source has none. */
  abstract findById(id: ProductId, abortSignal: AbortSignal): Promise<Product | undefined>;
}
