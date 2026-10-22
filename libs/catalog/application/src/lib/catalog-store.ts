import { computed, inject, Injectable, resource, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { normalizeSearchTerm, ProductSource } from '@ngsample/catalog/domain';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';

const SETTLE_TIME_MS = 300;

@Injectable()
export class CatalogStore {
  readonly #source = inject(ProductSource);

  readonly #searchTerm = signal('');
  readonly searchTerm = this.#searchTerm.asReadonly();

  readonly settledSearchTerm = toSignal(
    toObservable(this.#searchTerm).pipe(
      debounceTime(SETTLE_TIME_MS),
      map(normalizeSearchTerm),
      distinctUntilChanged(),
    ),
    { initialValue: '' },
  );

  readonly #products = resource({
    params: () => ({ term: this.settledSearchTerm() }),
    loader: ({ params, abortSignal }) => this.#source.search(params.term, abortSignal),
  });
  readonly products = this.#products.asReadonly();

  readonly hasNoMatches = computed(
    () => this.products.hasValue() && this.products.value().length === 0,
  );

  setSearchTerm(term: string): void {
    this.#searchTerm.set(term);
  }

  reload(): void {
    this.#products.reload();
  }
}
