import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { CartStore } from '@ngsample/cart/application';
import type { CartItem } from '@ngsample/cart/domain';
import { cartRoutes } from '../cart.routes';

const mascara: CartItem = {
  productId: 1,
  title: 'Essence Mascara Lash Princess',
  thumbnail: 'https://cdn.dummyjson.com/mascara.webp',
  unitPrice: { amountMinor: 894, currency: 'USD' },
};

const eyeshadow: CartItem = {
  productId: 2,
  title: 'Eyeshadow Palette with Mirror',
  thumbnail: 'https://cdn.dummyjson.com/eyeshadow.webp',
  unitPrice: { amountMinor: 1999, currency: 'USD' },
};

describe('CartPage', () => {
  let cart: CartStore;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter(cartRoutes)] });
    cart = TestBed.inject(CartStore);
  });

  async function open(): Promise<HTMLElement> {
    const harness = await RouterTestingHarness.create('/');
    await TestBed.inject(ApplicationRef).whenStable();
    return harness.routeNativeElement as HTMLElement;
  }

  const button = (line: Element, name: string) =>
    line.querySelector(`button[aria-label="${name}"]`) as HTMLButtonElement;
  const settle = () => TestBed.inject(ApplicationRef).whenStable();

  it('says the Cart is empty and shows no Cart total', async () => {
    const element = await open();

    expect(element.textContent).toContain('Your cart is empty');
    expect(element.textContent).not.toContain('Cart total');
  });

  it('shows each Cart line with its prices and quantity, and the Cart total', async () => {
    cart.add(mascara);
    cart.add(mascara);
    cart.add(mascara);

    const element = await open();
    const line = element.querySelector('li') as HTMLElement;

    const title = line.querySelector('a');
    expect(title?.textContent?.trim()).toBe('Essence Mascara Lash Princess');
    expect(title?.getAttribute('href')).toBe('/catalog/1');
    expect(line.querySelector('img')?.getAttribute('src')).toBe(
      'https://cdn.dummyjson.com/mascara.webp',
    );
    expect(line.textContent).toContain('$8.94');
    expect(line.querySelector('[aria-label="Quantity"]')?.textContent?.trim()).toBe('3');
    expect(line.textContent).toContain('$26.82');
    expect(element.textContent).toContain('Cart total: $26.82');
  });

  it('increases a quantity, and cannot decrease it below 1', async () => {
    cart.add(mascara);
    const element = await open();
    const line = element.querySelector('li') as HTMLElement;

    expect(button(line, 'Decrease quantity').disabled).toBe(true);

    button(line, 'Increase quantity').click();
    await settle();

    expect(line.querySelector('[aria-label="Quantity"]')?.textContent?.trim()).toBe('2');
    expect(button(line, 'Decrease quantity').disabled).toBe(false);
  });

  it('removes a Cart line and keeps the others', async () => {
    cart.add(mascara);
    cart.add(eyeshadow);
    const element = await open();

    button(element.querySelector('li') as HTMLElement, 'Remove').click();
    await settle();

    const lines = element.querySelectorAll('li');
    expect(lines).toHaveLength(1);
    expect(lines[0].textContent).toContain('Eyeshadow Palette with Mirror');
  });
});
