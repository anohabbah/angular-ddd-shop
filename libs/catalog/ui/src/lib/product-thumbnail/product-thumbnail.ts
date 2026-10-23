import { NgOptimizedImage } from '@angular/common';
import { booleanAttribute, Component, computed, input, linkedSignal } from '@angular/core';
import type { Product } from '@ngsample/catalog/domain';

@Component({
  selector: 'app-product-thumbnail',
  imports: [NgOptimizedImage],
  templateUrl: './product-thumbnail.html',
  styleUrl: './product-thumbnail.css',
})
export class ProductThumbnail {
  readonly product = input.required<Product>();
  /** Loads the image first, for a thumbnail that may be the page's largest contentful paint. */
  readonly priority = input(false, { transform: booleanAttribute });

  // Resets when a different product comes in.
  readonly #loadFailed = linkedSignal({ source: this.product, computation: () => false });
  protected readonly showImage = computed(() => !!this.product().thumbnail && !this.#loadFailed());

  protected onLoadError(): void {
    this.#loadFailed.set(true);
  }
}
