import { BreakpointObserver } from '@angular/cdk/layout';
import {
  afterRenderEffect,
  Component,
  computed,
  type ElementRef,
  inject,
  linkedSignal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CartLink } from '@ngsample/cart/ui/header';
import { map } from 'rxjs';

export const WIDE_VIEWPORT_QUERY = '(min-width: 960px)';

@Component({
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatListModule,
    MatButtonModule,
    MatToolbarModule,
    CartLink,
  ],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly breakpoints = inject(BreakpointObserver);
  private readonly router = inject(Router);

  protected readonly navItems = [
    { path: '/catalog', label: 'Catalog' },
    { path: '/cart', label: 'Cart' },
  ];

  protected readonly wide = toSignal(
    this.breakpoints.observe(WIDE_VIEWPORT_QUERY).pipe(map((s) => s.matches)),
    {
      initialValue: this.breakpoints.isMatched(WIDE_VIEWPORT_QUERY),
    },
  );
  protected readonly mode = computed(() => (this.wide() ? 'side' : 'over'));
  /** Open when wide, closed when narrow; the shopper's toggle lasts until the next navigation. */
  protected readonly opened = linkedSignal({
    source: () => ({ wide: this.wide(), navigation: this.router.lastSuccessfulNavigation() }),
    computation: ({ wide }) => wide,
  });

  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');

  constructor() {
    // After an in-app navigation, start reading and tabbing from the new page's content.
    afterRenderEffect({
      write: () => {
        const navigation = this.router.lastSuccessfulNavigation();
        if (navigation?.previousNavigation) this.main().nativeElement.focus();
      },
    });
  }
}
