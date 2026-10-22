import { ProductId } from '@ngsample/shared/domain';

/** Reads a product id from a URL segment; `undefined` when the segment is not a product id. */
export function parseProductId(raw: string): ProductId | undefined {
  if (!/^[1-9]\d*$/.test(raw)) return undefined;
  const parsed = ProductId.safeParse(Number(raw));
  return parsed.success ? parsed.data : undefined;
}
