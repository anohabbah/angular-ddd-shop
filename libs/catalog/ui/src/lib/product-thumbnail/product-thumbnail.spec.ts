import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Product } from '@ngsample/catalog-domain';
import { ProductThumbnail } from './product-thumbnail';

const product = (thumbnail: string): Product => ({
  id: 1,
  title: 'Essence Mascara Lash Princess',
  description: '',
  category: 'beauty',
  thumbnail,
  listPrice: { amountMinor: 999, currency: 'USD' },
  discount: 0,
});

describe('ProductThumbnail', () => {
  async function render(p: Product): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(ProductThumbnail);
    fixture.componentRef.setInput('product', p);
    fixture.componentRef.setInput('size', 96);
    await fixture.whenStable();
    return fixture.nativeElement;
  }

  it('shows a placeholder when the thumbnail fails to load', async () => {
    const element = await render(product('https://cdn.example/missing.webp'));

    element.querySelector('img')?.dispatchEvent(new Event('error'));
    await TestBed.inject(ApplicationRef).whenStable();

    expect(element.querySelector('img')).toBeNull();
    expect(element.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe(
      'Essence Mascara Lash Princess',
    );
  });

  it("shows the product's thumbnail, described by its title", async () => {
    const element = await render(product('https://cdn.example/mascara.webp'));

    const img = element.querySelector('img');
    expect(img?.getAttribute('src')).toBe('https://cdn.example/mascara.webp');
    expect(img?.getAttribute('alt')).toBe('Essence Mascara Lash Princess');
  });

  it('shows a placeholder, described by the title, when the product has no thumbnail', async () => {
    const element = await render(product(''));

    expect(element.querySelector('img')).toBeNull();
    expect(element.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe(
      'Essence Mascara Lash Princess',
    );
  });
});
