import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { appConfig } from './app.config';

const mascara = {
  id: 1,
  title: 'Essence Mascara Lash Princess',
  description: 'A volumizing and lengthening mascara.',
  category: 'beauty',
  thumbnail: 'mascara.webp',
  price: 9.99,
  discountPercentage: 10.48,
};

describe('appConfig', () => {
  afterEach(() => vi.useRealTimers());

  it('keeps the search term when the shopper opens a product and goes back to the catalog', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpTestingController);
    const stable = () => TestBed.inject(ApplicationRef).whenStable();

    const harness = await RouterTestingHarness.create('/catalog');
    http.expectOne((r) => r.url === 'https://dummyjson.com/products').flush({ products: [] });
    await stable();

    const searchBox = () =>
      harness.routeNativeElement?.querySelector('input[type="search"]') as HTMLInputElement;
    searchBox().value = 'mascara';
    searchBox().dispatchEvent(new Event('input'));
    TestBed.tick();
    await vi.advanceTimersByTimeAsync(300);
    TestBed.tick();
    await vi.advanceTimersByTimeAsync(0);
    http
      .expectOne((r) => r.url === 'https://dummyjson.com/products/search')
      .flush({ products: [mascara] });
    await stable();

    (harness.routeNativeElement?.querySelector('li a') as HTMLAnchorElement).click();
    await vi.advanceTimersByTimeAsync(0);
    TestBed.tick();
    http.expectOne('https://dummyjson.com/products/1').flush(mascara);
    await stable();
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent?.trim()).toBe(
      'Essence Mascara Lash Princess',
    );

    const back = [...(harness.routeNativeElement?.querySelectorAll('a') ?? [])].find((a) =>
      a.textContent?.includes('Back to catalog'),
    ) as HTMLAnchorElement;
    back.click();
    await stable();

    http.verify();
    expect(searchBox().value).toBe('mascara');
    expect(harness.routeNativeElement?.querySelector('li h2')?.textContent?.trim()).toBe(
      'Essence Mascara Lash Princess',
    );
  });
});
