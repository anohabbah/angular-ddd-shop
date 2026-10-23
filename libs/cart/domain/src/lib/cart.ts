import { Money, ProductId } from '@ngsample/shared/domain';
import * as z from 'zod/mini';

export const Quantity = z.int().check(z.gte(1));
export type Quantity = z.infer<typeof Quantity>;

/** Snapshot of a product taken when it is first added to the Cart. */
export const CartItem = z.object({
  productId: ProductId,
  title: z.string(),
  thumbnail: z.string(),
  unitPrice: Money,
});
export type CartItem = z.infer<typeof CartItem>;

export const CartLine = z.object({ item: CartItem, quantity: Quantity });
export type CartLine = z.infer<typeof CartLine>;

/** All Cart lines share one currency. */
export class CurrencyMismatchError extends Error {
  constructor(cartCurrency: string, itemCurrency: string) {
    super(`Cannot add a ${itemCurrency} item to a ${cartCurrency} Cart`);
    this.name = 'CurrencyMismatchError';
  }
}

export function addItem(lines: readonly CartLine[], item: CartItem): CartLine[] {
  const cartCurrency = lines[0]?.item.unitPrice.currency;
  if (cartCurrency !== undefined && cartCurrency !== item.unitPrice.currency) {
    throw new CurrencyMismatchError(cartCurrency, item.unitPrice.currency);
  }
  if (!lines.some((line) => line.item.productId === item.productId)) {
    return [...lines, { item, quantity: 1 }];
  }
  // The line keeps the snapshot it was first added with.
  return increaseQuantity(lines, item.productId);
}

export function increaseQuantity(lines: readonly CartLine[], productId: ProductId): CartLine[] {
  return lines.map((line) =>
    line.item.productId === productId ? { ...line, quantity: line.quantity + 1 } : line,
  );
}

/** Never takes a quantity below 1: removing a line is a separate action. */
export function decreaseQuantity(lines: readonly CartLine[], productId: ProductId): CartLine[] {
  return lines.map((line) =>
    line.item.productId === productId
      ? { ...line, quantity: Math.max(1, line.quantity - 1) }
      : line,
  );
}

export function removeLine(lines: readonly CartLine[], productId: ProductId): CartLine[] {
  return lines.filter((line) => line.item.productId !== productId);
}

export function lineTotal(line: CartLine): Money {
  return { ...line.item.unitPrice, amountMinor: line.item.unitPrice.amountMinor * line.quantity };
}

/** `undefined` for an empty Cart. Relies on all Cart lines sharing one currency. */
export function cartTotal(lines: readonly CartLine[]): Money | undefined {
  const [first, ...rest] = lines.map(lineTotal);
  if (first === undefined) return undefined;
  return rest.reduce(
    (total, line) => ({ ...total, amountMinor: total.amountMinor + line.amountMinor }),
    first,
  );
}

export function itemCount(lines: readonly CartLine[]): number {
  return lines.reduce((count, line) => count + line.quantity, 0);
}

/** `undefined` when the product has no Cart line. */
export function lineQuantity(
  lines: readonly CartLine[],
  productId: ProductId,
): Quantity | undefined {
  return lines.find((line) => line.item.productId === productId)?.quantity;
}

/**
 * The product whose Cart line receives focus once `productId`'s line is removed:
 * the next line, else the previous one, else `undefined` for a Cart left empty.
 */
export function focusAfterRemoval(
  lines: readonly CartLine[],
  productId: ProductId,
): ProductId | undefined {
  const index = lines.findIndex((line) => line.item.productId === productId);
  return (lines[index + 1] ?? lines[index - 1])?.item.productId;
}
