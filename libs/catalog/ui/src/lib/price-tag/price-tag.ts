import { Component, computed, input } from '@angular/core';
import { priceDisplay, type Product } from '@ngsample/catalog-domain';
import { formatMoney } from '@ngsample/shared-domain';

@Component({
  selector: 'app-price-tag',
  templateUrl: './price-tag.html',
  styleUrl: './price-tag.css',
})
export class PriceTag {
  readonly product = input.required<Product>();

  readonly #display = computed(() => priceDisplay(this.product()));
  protected readonly final = computed(() => formatMoney(this.#display().final));
  protected readonly list = computed(() => {
    const list = this.#display().list;
    return list && formatMoney(list);
  });
}
