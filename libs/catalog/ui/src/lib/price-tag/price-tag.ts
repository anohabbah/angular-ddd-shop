import { Component, computed, inject, input, LOCALE_ID } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { priceDisplay, type Product } from '@ngsample/catalog/domain';
import { formatMoney, type Locale } from '@ngsample/shared/domain';

@Component({
  selector: 'app-price-tag',
  imports: [TranslocoDirective],
  templateUrl: './price-tag.html',
  styleUrl: './price-tag.css',
})
export class PriceTag {
  readonly product = input.required<Product>();

  readonly #locale = inject(LOCALE_ID) as Locale;
  readonly #display = computed(() => priceDisplay(this.product()));
  protected readonly final = computed(() => formatMoney(this.#display().final, this.#locale));
  protected readonly list = computed(() => {
    const list = this.#display().list;
    return list && formatMoney(list, this.#locale);
  });
}
