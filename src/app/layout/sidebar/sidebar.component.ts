import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar" [class.mobile-open]="open()">
      <div class="brand-row">
        <div class="brand-mark" aria-hidden="true">N</div>
        <div><strong>NgArchitect</strong><span>Architecture intelligence</span></div>
        <button class="icon-button close-mobile" type="button" aria-label="Close navigation" (click)="closed.emit()">×</button>
      </div>
      <nav aria-label="Primary navigation">
        @for (item of nav; track item.label) {
          <a [routerLink]="item.link" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: item.exact }" (click)="closed.emit()">
            <span class="nav-icon" aria-hidden="true">{{ item.icon }}</span>{{ item.label }}
          </a>
        }
      </nav>
      <div class="sidebar-foot"><div class="status-dot"></div><div><strong>Analyzer ready</strong><span>20 rules active</span></div></div>
    </aside>
    @if (open()) { <button class="sidebar-backdrop" type="button" aria-label="Close navigation" (click)="closed.emit()"></button> }
  `
})
export class SidebarComponent {
  readonly open = input(false);
  readonly closed = output<void>();
  readonly nav = [
    { label: 'Dashboard', icon: '⌂', link: '/', exact: true },
    { label: 'Analyze Project', icon: '↗', link: '/analyze', exact: false },
    { label: 'Reports', icon: '▤', link: '/reports', exact: false },
    { label: 'Rules', icon: '◇', link: '/rules', exact: false },
    { label: 'Settings', icon: '◉', link: '/settings', exact: false }
  ];
}
