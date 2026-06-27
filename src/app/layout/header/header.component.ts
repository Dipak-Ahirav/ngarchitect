import { Component, inject, output } from '@angular/core';
import { BrnButton } from '@spartan-ng/brain/button';
import { BrnTooltip } from '@spartan-ng/brain/tooltip';
import { SettingsService } from '../../core/services/settings.service';

@Component({
  selector: 'app-header',
  imports: [BrnButton, BrnTooltip],
  template: `
    <header class="topbar">
      <button brnButton class="icon-button menu-button" type="button" aria-label="Open navigation" (click)="menu.emit()">☰</button>
      <div class="topbar-title"><strong>NgArchitect</strong><span class="product-badge">Angular Architecture Review</span></div>
      <div class="topbar-actions">
        <button brnButton class="icon-button" type="button" [brnTooltip]="'Change color theme'" (click)="cycleTheme()" [attr.aria-label]="'Theme: ' + settings.settings().theme">{{ settings.settings().theme === 'light' ? '☀' : settings.settings().theme === 'system' ? '◐' : '☾' }}</button>
        <a brnButton class="secondary-button github-button" href="https://github.com/" target="_blank" rel="noopener noreferrer">GitHub <span aria-hidden="true">↗</span></a>
      </div>
    </header>
  `
})
export class HeaderComponent {
  protected readonly settings = inject(SettingsService);
  readonly menu = output<void>();
  cycleTheme(): void {
    const current = this.settings.settings();
    const theme = current.theme === 'dark' ? 'light' : current.theme === 'light' ? 'system' : 'dark';
    this.settings.update({ ...current, theme });
  }
}
