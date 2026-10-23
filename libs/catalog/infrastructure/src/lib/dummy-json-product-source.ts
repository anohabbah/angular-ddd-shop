import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Product, ProductSource } from '@ngsample/catalog/domain';
import type { ProductId } from '@ngsample/shared/domain';
import { firstValueFrom, fromEvent, type Observable, takeUntil } from 'rxjs';
import * as z from 'zod/mini';

const API_URL = 'https://dummyjson.com';
const PAGE_SIZE = 30;

const DummyProductDto = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  thumbnail: z.string(),
  price: z.number(),
  discountPercentage: z.number(),
});
type DummyProductDto = z.infer<typeof DummyProductDto>;

/** Asks dummyjson for only the fields the DTO parses. */
const SELECT = Object.keys(DummyProductDto.shape).join(',');

const DummyProductPageDto = z.object({ products: z.array(DummyProductDto) });

function toProduct(dto: DummyProductDto): Product {
  return Product.parse({
    id: dto.id,
    title: dto.title,
    description: dto.description,
    category: dto.category,
    thumbnail: dto.thumbnail,
    listPrice: { amountMinor: Math.round(dto.price * 100), currency: 'USD' },
    discount: dto.discountPercentage,
  });
}

/** Resolves the request's response; aborting the signal unsubscribes, which cancels the request. */
function untilAborted<T>(request: Observable<T>, abortSignal: AbortSignal): Promise<T> {
  return firstValueFrom(request.pipe(takeUntil(fromEvent(abortSignal, 'abort'))));
}

@Injectable()
export class DummyJsonProductSource extends ProductSource {
  readonly #http = inject(HttpClient);

  async search(term: string, abortSignal: AbortSignal): Promise<readonly Product[]> {
    const request = term
      ? this.#http.get(`${API_URL}/products/search`, {
          params: { q: term, limit: PAGE_SIZE, select: SELECT },
        })
      : this.#http.get(`${API_URL}/products`, { params: { limit: PAGE_SIZE, select: SELECT } });
    const body = await untilAborted(request, abortSignal);
    return DummyProductPageDto.parse(body).products.map(toProduct);
  }

  async findById(id: ProductId, abortSignal: AbortSignal): Promise<Product | undefined> {
    try {
      const body = await untilAborted(
        this.#http.get(`${API_URL}/products/${id}`, { params: { select: SELECT } }),
        abortSignal,
      );
      return toProduct(DummyProductDto.parse(body));
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) return undefined;
      throw error;
    }
  }
}
