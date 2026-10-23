import { MediaMatcher } from '@angular/cdk/layout';
import { TestKey } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { MatNavListHarness } from '@angular/material/list/testing';
import { MatSidenavHarness } from '@angular/material/sidenav/testing';
import { provideRouter, Router } from '@angular/router';
import { App, WIDE_VIEWPORT_QUERY } from './app';

type Listener = (e: { matches: boolean }) => void;

/** Viewport whose width the test controls; jsdom has no matchMedia. */
class FakeMediaMatcher {
  private readonly listeners = new Set<Listener>();

  constructor(private wide: boolean) {}

  matchMedia(query: string) {
    const isWideQuery = query === WIDE_VIEWPORT_QUERY;
    const matches = () => isWideQuery && this.wide;
    return {
      get matches() {
        return matches();
      },
      addListener: (l: Listener) => isWideQuery && this.listeners.add(l),
      removeListener: (l: Listener) => this.listeners.delete(l),
    } as unknown as MediaQueryList;
  }

  resize(wide: boolean) {
    this.wide = wide;
    this.listeners.forEach((l) => l({ matches: wide }));
  }
}

@Component({ selector: 'app-catalog-stub', template: 'Catalog page' })
class CatalogStub {}

@Component({ selector: 'app-cart-stub', template: 'Cart page' })
class CartStub {}

async function setupShell({ wide = false } = {}) {
  const viewport = new FakeMediaMatcher(wide);
  TestBed.configureTestingModule({
    providers: [
      provideRouter([
        { path: 'catalog', component: CatalogStub },
        { path: 'catalog/:productId', component: CatalogStub },
        { path: 'cart', component: CartStub },
      ]),
      { provide: MediaMatcher, useValue: viewport },
      { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
    ],
  });
  const fixture = TestBed.createComponent(App);
  const router = TestBed.inject(Router);
  await router.navigateByUrl('/catalog');
  await fixture.whenStable();
  return { fixture, router, viewport, loader: TestbedHarnessEnvironment.loader(fixture) };
}

const menuButton = (fixture: ComponentFixture<App>) =>
  [...(fixture.nativeElement as HTMLElement).querySelectorAll('header button')].find(
    (b) => b.getAttribute('aria-label') === 'Open navigation',
  ) as HTMLButtonElement | undefined;

async function pressMenuButton(fixture: ComponentFixture<App>) {
  menuButton(fixture)?.click();
  await fixture.whenStable();
}

const navLink = (fixture: ComponentFixture<App>, text: string) =>
  [...(fixture.nativeElement as HTMLElement).querySelectorAll('nav a')].find(
    (a) => a.textContent?.trim() === text,
  );

/** Lets the drawer and BreakpointObserver deliver what they report after a macrotask. */
async function settle(fixture: ComponentFixture<App>) {
  await new Promise((resolve) => setTimeout(resolve));
  await fixture.whenStable();
}

describe('App shell', () => {
  it('offers the Catalog then the Cart in the navigation, and the Cart link opens the cart page', async () => {
    const { loader, router } = await setupShell();

    const items = await (await loader.getHarness(MatNavListHarness)).getItems();
    const links = await Promise.all(
      items.map(async (item) => [await item.getFullText(), await item.getHref()]),
    );
    expect(links).toEqual([
      ['Catalog', '/catalog'],
      ['Cart', '/cart'],
    ]);

    await items[1].click();
    expect(router.url).toBe('/cart');
  });

  it('marks the Cart link as the current page on the cart page', async () => {
    const { fixture, router } = await setupShell();

    await router.navigateByUrl('/cart');
    await fixture.whenStable();

    expect(navLink(fixture, 'Cart')?.getAttribute('aria-current')).toBe('page');
    expect(navLink(fixture, 'Catalog')?.hasAttribute('aria-current')).toBe(false);
  });

  it('marks the Catalog link as the current page on a product detail', async () => {
    const { fixture, router } = await setupShell();

    await router.navigateByUrl('/catalog/1');
    await fixture.whenStable();

    expect(navLink(fixture, 'Catalog')?.getAttribute('aria-current')).toBe('page');
  });

  it('shows the navigation beside the content, without a menu button, on a wide viewport', async () => {
    const { fixture, loader } = await setupShell({ wide: true });

    const sidenav = await loader.getHarness(MatSidenavHarness);
    expect(await sidenav.getMode()).toBe('side');
    expect(await sidenav.isOpen()).toBe(true);
    expect(menuButton(fixture)).toBeUndefined();
  });

  it('keeps the navigation open when the shopper presses Escape on a wide viewport', async () => {
    const { fixture, loader } = await setupShell({ wide: true });
    const sidenav = await loader.getHarness(MatSidenavHarness);

    await (await sidenav.host()).sendKeys(TestKey.ESCAPE);
    await settle(fixture);

    expect(await sidenav.isOpen()).toBe(true);
  });

  it('keeps the navigation visible after navigating on a wide viewport', async () => {
    const { loader, router } = await setupShell({ wide: true });

    const items = await (await loader.getHarness(MatNavListHarness)).getItems();
    await items[1].click();

    expect(router.url).toBe('/cart');
    expect(await (await loader.getHarness(MatSidenavHarness)).isOpen()).toBe(true);
  });

  it('keeps the navigation closed on a narrow viewport until the shopper opens it from the menu button', async () => {
    const { fixture, loader } = await setupShell({ wide: false });

    const sidenav = await loader.getHarness(MatSidenavHarness);
    expect(await sidenav.getMode()).toBe('over');
    expect(await sidenav.isOpen()).toBe(false);

    await pressMenuButton(fixture);
    expect(await sidenav.isOpen()).toBe(true);
  });

  it('reports on the menu button whether the navigation is open', async () => {
    const { fixture } = await setupShell({ wide: false });
    expect(menuButton(fixture)?.getAttribute('aria-expanded')).toBe('false');

    await pressMenuButton(fixture);

    expect(menuButton(fixture)?.getAttribute('aria-expanded')).toBe('true');
  });

  it('closes the open navigation when the shopper selects outside it on a narrow viewport', async () => {
    const { fixture, loader } = await setupShell({ wide: false });
    const sidenav = await loader.getHarness(MatSidenavHarness);
    await pressMenuButton(fixture);

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLElement>('.mat-drawer-backdrop')
      ?.click();
    await fixture.whenStable();

    expect(await sidenav.isOpen()).toBe(false);

    // The menu button reopens it in one press: the shell saw the close.
    await pressMenuButton(fixture);
    expect(await sidenav.isOpen()).toBe(true);
  });

  it('closes the navigation after the shopper navigates on a narrow viewport', async () => {
    const { fixture, loader, router } = await setupShell({ wide: false });
    const sidenav = await loader.getHarness(MatSidenavHarness);

    await pressMenuButton(fixture);
    expect(await sidenav.isOpen()).toBe(true);
    const items = await (await loader.getHarness(MatNavListHarness)).getItems();
    await items[1].click();
    expect(router.url).toBe('/cart');
    expect(await sidenav.isOpen()).toBe(false);

    await router.navigateByUrl('/catalog');
    await fixture.whenStable();
    await pressMenuButton(fixture);
    expect(await sidenav.isOpen()).toBe(true);
    (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>('header a')?.click();
    await fixture.whenStable();
    expect(router.url).toBe('/cart');
    expect(await sidenav.isOpen()).toBe(false);
  });

  it('takes the default state for the new width when the viewport changes', async () => {
    const { fixture, loader, viewport } = await setupShell({ wide: true });
    const sidenav = await loader.getHarness(MatSidenavHarness);

    viewport.resize(false);
    await settle(fixture);
    expect(await sidenav.isOpen()).toBe(false);
    expect(menuButton(fixture)).toBeDefined();

    await pressMenuButton(fixture);
    viewport.resize(true);
    await settle(fixture);
    expect(await sidenav.getMode()).toBe('side');
    expect(await sidenav.isOpen()).toBe(true);
    expect(menuButton(fixture)).toBeUndefined();
  });

  it('shows a toolbar in the header with the shop name and the cart link', async () => {
    const { fixture } = await setupShell();

    const toolbar = (fixture.nativeElement as HTMLElement).querySelector('header mat-toolbar');
    expect(toolbar?.textContent).toContain('ngsample');
    // The shop name is text, so the cart link is the first link in the header.
    const firstLink = toolbar?.querySelector('a');
    expect(firstLink?.getAttribute('href')).toBe('/cart');
    expect(firstLink?.getAttribute('aria-label')).toBe('Cart, 0 items');
  });
});

describe('App', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
    expect(TestBed.createComponent(App).componentInstance).toBeTruthy();
  });
});
