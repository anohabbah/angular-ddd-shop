import { computed, inject, resource, type Resource, type Signal } from '@angular/core';
import { type Product, ProductSource } from '@ngsample/catalog-domain';
import type { ProductId } from '@ngsample/shared-domain';

export interface ProductDetail {
  product: Resource<Product | undefined>;
  notFound: Signal<boolean>;
}

/**
 * The product a product id points to. Call in an injection context; `productId` is usually a
 * route input, so it is passed in rather than held as store state.
 */
export function productDetail(productId: () => ProductId | undefined): ProductDetail {
  const source = inject(ProductSource);

  const product = resource({
    params: () => {
      const id = productId();
      return id === undefined ? undefined : { id };
    },
    loader: ({ params, abortSignal }) => source.findById(params.id, abortSignal),
  }).asReadonly();

  const notFound = computed(
    () =>
      productId() === undefined ||
      (product.status() === 'resolved' && product.value() === undefined),
  );

  return { product, notFound };
}
