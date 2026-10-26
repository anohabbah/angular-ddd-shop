import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationInitStatus, ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideCatalogInfrastructure } from '@ngsample/catalog/infrastructure';
import { provideLocalization } from '@ngsample/shared/infrastructure';
import { appRoutes } from './app.routes';

describe('appRoutes', () => {
  it('opens the catalog product list at the root path', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(appRoutes),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideCatalogInfrastructure(),
        provideLocalization({
          'fr-FR': () => import('./i18n/fr-FR.json'),
          'en-US': () => import('./i18n/en-US.json'),
        }),
      ],
    });
    await TestBed.inject(ApplicationInitStatus).donePromise;

    const harness = await RouterTestingHarness.create('/');
    TestBed.inject(HttpTestingController)
      .expectOne((r) => r.url === 'https://dummyjson.com/products')
      .flush({
        products: [
          {
            id: 1,
            title: 'Essence Mascara Lash Princess',
            description: 'A volumizing and lengthening mascara.',
            category: 'beauty',
            thumbnail: 'mascara.webp',
            price: 9.99,
            discountPercentage: 10.48,
          },
        ],
      });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(TestBed.inject(Router).url).toBe('/catalog');
    expect(harness.routeNativeElement?.textContent).toContain('Essence Mascara Lash Princess');
  });
});
