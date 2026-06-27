import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, HeaderComponent, SidebarComponent],
  template: `<div class="app-shell"><app-sidebar [open]="mobileNav()" (closed)="mobileNav.set(false)" /><div class="app-column min-w-0"><app-header (menu)="mobileNav.set(true)" /><main class="main-content min-w-0"><router-outlet /></main></div></div>`
})
export class ShellComponent { readonly mobileNav = signal(false); }
