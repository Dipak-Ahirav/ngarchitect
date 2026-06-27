import { Component, input } from '@angular/core';
import { RuleSeverity } from '../../core/models/architecture.models';

@Component({
  selector: 'app-severity-badge',
  template: `<span class="severity-badge" [class]="'severity-badge severity-' + severity()"><span></span>{{ severity() }}</span>`
})
export class SeverityBadgeComponent { readonly severity = input.required<RuleSeverity>(); }
