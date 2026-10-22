import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { appConfig } from './app.config';

const mascara = {
  id: 1,
  title: 'Essence Mascara Lash Princess',
  description: 'A volumizing and lengthening mascara.',
  category: 'beauty',
  thumbnail: 'https://cdn.dummyjson.com/mascara.webp',
  price: 9.99,
  discountPercentage: 10.48,
};

describe('App', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
    expect(TestBed.createComponent(App).componentInstance).toBeTruthy();
  });

  it('keeps the Cart while the shopper adds a product, goes back and opens the cart page', async () => {
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(App);
    const element: HTMLElement = fixture.nativeElement;
    const link = (text: string) =>
      [...element.querySelectorAll('a')].find((a) => a.textContent?.includes(text)) as HTMLElement;
    const cartLink = () => element.querySelector('header a') as HTMLAnchorElement;

    await TestBed.inject(Router).navigateByUrl('/catalog');
    TestBed.tick();
    http
      .expectOne((r) => r.url === 'https://dummyjson.com/products')
      .flush({ products: [mascara] });
    await fixture.whenStable();
    expect(cartLink().textContent?.trim()).toBe('Cart (0)');

    link('Essence Mascara Lash Princess').click();
    // The product detail is not stable until its request is answered.
    await vi.waitFor(() => {
      TestBed.tick();
      http.expectOne('https://dummyjson.com/products/1').flush(mascara);
    });
    await fixture.whenStable();
    const addToCart = [...element.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Add to cart'),
    ) as HTMLButtonElement;
    addToCart.click();

    link('Back to catalog').click();
    await fixture.whenStable();
    cartLink().click();
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/cart');
    expect(element.querySelector('li')?.textContent).toContain('Essence Mascara Lash Princess');
    expect(cartLink().textContent?.trim()).toBe('Cart (1)');
    http.verify();
  });
});
