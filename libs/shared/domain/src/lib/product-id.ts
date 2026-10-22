import * as z from 'zod/mini';

export const ProductId = z.int().check(z.positive());
export type ProductId = z.infer<typeof ProductId>;
