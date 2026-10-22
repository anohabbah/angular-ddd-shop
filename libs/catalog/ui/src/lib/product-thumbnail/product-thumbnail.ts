import { NgOptimizedImage } from '@angular/common';
import { Component, computed, input, linkedSignal } from '@angular/core';
import type { Product } from '@ngsample/catalog-domain';

@Component({
  selector: 'app-product-thumbnail',
  imports: [NgOptimizedImage],
  templateUrl: './product-thumbnail.html',
  styleUrl: './product-thumbnail.css',
})
export class ProductThumbnail {
  readonly product = input.required<Product>();
  readonly size = input.required<number>();

  // Resets when a different product comes in.
  readonly #loadFailed = linkedSignal({ source: this.product, computation: () => false });
  protected readonly showImage = computed(() => !!this.product().thumbnail && !this.#loadFailed());

  protected onLoadError(): void {
    this.#loadFailed.set(true);
  }
}
