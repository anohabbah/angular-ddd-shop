import type { Locator } from '@playwright/test';

/** The element's box, failing the test when the element isn't rendered. */
export async function box(locator: Locator) {
  const rendered = await locator.boundingBox();
  if (!rendered) throw new Error(`${locator} is not rendered`);
  return rendered;
}
