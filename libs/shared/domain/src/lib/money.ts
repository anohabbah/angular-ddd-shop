import * as z from 'zod/mini';

export const Money = z.object({
  amountMinor: z.int().check(z.nonnegative()),
  currency: z.string().check(z.regex(/^[A-Z]{3}$/)),
});
export type Money = z.infer<typeof Money>;
