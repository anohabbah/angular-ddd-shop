import { Money, ProductId } from '@ngsample/shared-domain';
import * as z from 'zod/mini';

/** Percentage taken off the list price. */
export const Discount = z.number().check(z.gte(0), z.lte(100));
export type Discount = z.infer<typeof Discount>;

export const Product = z.object({
  id: ProductId,
  title: z.string(),
  description: z.string(),
  category: z.string(),
  thumbnail: z.string(),
  listPrice: Money,
  discount: Discount,
});
export type Product = z.infer<typeof Product>;
