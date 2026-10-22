import { Component, computed, input } from '@angular/core';
import { priceDisplay, type Product } from '@ngsample/catalog-domain';
import type { Money } from '@ngsample/shared-domain';

function formatMoney(money: Money): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: money.currency }).format(
    money.amountMinor / 100,
  );
}

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
