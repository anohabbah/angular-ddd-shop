import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CartStore } from '@ngsample/cart-application';
import type { CartItem } from '@ngsample/cart-domain';
import { CartLink } from './cart-link';

const item = (productId: number): CartItem => ({
  productId,
  title: `Product ${productId}`,
  thumbnail: 'thumbnail.webp',
  unitPrice: { amountMinor: 100, currency: 'USD' },
});

describe('CartLink', () => {
  let cart: CartStore;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    cart = TestBed.inject(CartStore);
  });

  async function render(): Promise<HTMLAnchorElement> {
    const fixture = TestBed.createComponent(CartLink);
    await fixture.whenStable();
    return fixture.nativeElement.querySelector('a');
  }

  it('links to the cart page with an item count of 0 when the Cart is empty', async () => {
    const link = await render();

    expect(link.getAttribute('href')).toBe('/cart');
    expect(link.textContent?.trim()).toBe('Cart (0)');
  });

  it('shows the sum of the quantities as the item count', async () => {
    cart.add(item(1));
    cart.add(item(1));
    cart.add(item(1));
    cart.add(item(2));

    const link = await render();

    expect(link.textContent?.trim()).toBe('Cart (4)');
  });
});
