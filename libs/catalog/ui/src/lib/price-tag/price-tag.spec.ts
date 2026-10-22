import { TestBed } from '@angular/core/testing';
import type { Product } from '@ngsample/catalog/domain';
import { PriceTag } from './price-tag';

const product = (listPriceMinor: number, discount: number): Product => ({
  id: 1,
  title: 'Any product',
  description: '',
  category: 'beauty',
  thumbnail: '',
  listPrice: { amountMinor: listPriceMinor, currency: 'USD' },
  discount,
});

describe('PriceTag', () => {
  async function render(p: Product): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(PriceTag);
    fixture.componentRef.setInput('product', p);
    await fixture.whenStable();
    return fixture.nativeElement;
  }

  it('shows the final price and the struck-through list price of a discounted product', async () => {
    const element = await render(product(999, 10.48));

    expect(element.textContent).toContain('$8.94');
    expect(element.querySelector('s')?.textContent).toBe('$9.99');
  });

  it('shows only the final price when there is no discount', async () => {
    const element = await render(product(1999, 0));

    expect(element.textContent?.trim()).toBe('$19.99');
    expect(element.querySelector('s')).toBeNull();
  });
});
