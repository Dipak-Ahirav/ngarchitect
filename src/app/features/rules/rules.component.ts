import { Component, computed, signal } from '@angular/core';
import { ARCHITECTURE_RULES } from '../../core/constants/architecture-rules';
import { RuleCategory } from '../../core/models/architecture.models';
import { SeverityBadgeComponent } from '../../shared/components/severity-badge.component';

@Component({
  selector: 'app-rules',
  imports: [SeverityBadgeComponent],
  template: `
    <div class="page">
      <div class="page-heading rules-heading"><div><span class="page-kicker">Deterministic by design</span><h1>Architecture rules</h1><p>Transparent checks with no black box. Every finding explains the signal, its impact, and the next engineering move.</p></div><div class="rules-count"><strong>{{ rules.length }}</strong><span>active rules</span></div></div>
      <div class="filter-pills" role="list" aria-label="Filter rules by category">
        <button type="button" [class.active]="category() === 'All'" (click)="category.set('All')">All</button>
        @for (item of categories; track item) { <button type="button" [class.active]="category() === item" (click)="category.set(item)">{{ item }}</button> }
      </div>
      <div class="rules-grid">
        @for (rule of filteredRules(); track rule.id; let index = $index) {
          <article class="rule-card"><div class="rule-top"><span class="rule-number">{{ (index + 1).toString().padStart(2, '0') }}</span><app-severity-badge [severity]="rule.severity" /></div><span class="rule-category">{{ rule.category }}</span><h2>{{ rule.title }}</h2><p>{{ rule.description }}</p><div class="rule-detail"><strong>Why it matters</strong><span>{{ rule.whyItMatters }}</span></div><div class="rule-recommendation"><strong>Recommended approach</strong><span>{{ rule.recommendation }}</span></div></article>
        }
      </div>
    </div>
  `
})
export class RulesComponent {
  readonly rules = ARCHITECTURE_RULES;
  readonly category = signal<RuleCategory | 'All'>('All');
  readonly categories = [...new Set(this.rules.map((rule) => rule.category))];
  readonly filteredRules = computed(() => this.category() === 'All' ? this.rules : this.rules.filter((rule) => rule.category === this.category()));
}
