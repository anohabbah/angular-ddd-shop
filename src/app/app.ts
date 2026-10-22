import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CartLink } from '@ngsample/cart-ui-header';

@Component({
  imports: [RouterOutlet, CartLink],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
