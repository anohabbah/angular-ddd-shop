import { type EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { ProductSource } from '@ngsample/catalog-domain';
import { DummyJsonProductSource } from './dummy-json-product-source';

export function provideCatalogInfrastructure(): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: ProductSource, useClass: DummyJsonProductSource }]);
}
