import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BrnButton } from '@spartan-ng/brain/button';
import { RuleCategory, RuleSeverity } from '../../core/models/architecture.models';
import { ReportStorageService } from '../../core/services/report-storage.service';
import { SeverityBadgeComponent } from '../../shared/components/severity-badge.component';

type ReportTab = 'overview' | 'findings' | 'metrics' | 'recommendations' | 'files';

@Component({
  selector: 'app-report',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, BrnButton, SeverityBadgeComponent],
  template: `
    @if (report(); as report) {
      <div class="page report-page">
        <div class="report-heading"><div><span class="page-kicker">Architecture report</span><h1>{{ report.projectName }}</h1><p>Reviewed {{ report.createdAt | date:'medium' }} · {{ report.summary.fileCount }} files analyzed</p></div><div class="button-row"><button brnButton class="secondary-button" type="button" (click)="exportReport()">Export JSON <span>↓</span></button><a brnButton class="primary-button" routerLink="/analyze">Run new analysis</a></div></div>
        <section class="report-summary panel">
          <div class="score-overview">
            <div class="score-ring" [style.background]="scoreGradient(report.score.overall)"><div><strong>{{ report.score.overall }}</strong><span>/100</span></div></div>
            <div><span class="grade-label" [class.grade-risk]="report.score.overall < 60">{{ report.score.grade }}</span><h2>Overall architecture health</h2><p>{{ scoreSummary(report.score.overall) }}</p></div>
          </div>
          <div class="score-breakdown">
            @for (item of dimensions(report); track item.label) { <div><span>{{ item.label }}</span><div class="metric-bar"><i [style.width.%]="item.value"></i></div><strong>{{ item.value }}</strong></div> }
          </div>
        </section>
        <section class="severity-grid" aria-label="Findings by severity">
          @for (item of severitySummary(report); track item.severity) { <button type="button" (click)="showSeverity(item.severity)"><app-severity-badge [severity]="item.severity" /><strong>{{ item.count }}</strong><span>finding{{ item.count === 1 ? '' : 's' }}</span></button> }
        </section>
        <div class="tabs" role="tablist" aria-label="Report sections">
          @for (item of tabs; track item.id) { <button type="button" role="tab" [attr.aria-selected]="tab() === item.id" [class.active]="tab() === item.id" (click)="tab.set(item.id)">{{ item.label }} @if (item.id === 'findings') { <span>{{ report.findings.length }}</span> }</button> }
        </div>

        @switch (tab()) {
          @case ('overview') {
            <div class="report-content-grid">
              <section class="panel"><div class="section-heading"><div><h2>Priority findings</h2><p>The highest-impact signals from this review.</p></div><button type="button" (click)="tab.set('findings')">View all →</button></div><div class="finding-list compact-list">
                @for (finding of priorityFindings(report); track finding.id) { <article><app-severity-badge [severity]="finding.severity" /><div><strong>{{ finding.title }}</strong><span>{{ finding.filePath || finding.category }}</span><p>{{ finding.description }}</p></div></article> }
              </div></section>
              <section class="panel"><div class="section-heading"><div><h2>Top recommendations</h2><p>Ordered by architecture impact.</p></div></div><ol class="recommendation-list compact-recommendations">
                @for (recommendation of report.recommendations.slice(0, 5); track recommendation; let index = $index) { <li><span>{{ index + 1 }}</span><p>{{ recommendation }}</p></li> }
              </ol></section>
            </div>
          }
          @case ('findings') {
            <section class="panel findings-panel">
              <div class="findings-toolbar" [formGroup]="filters"><label class="search-field"><span aria-hidden="true">⌕</span><input type="search" formControlName="search" placeholder="Search rule, title, or file path" /></label><select formControlName="severity" aria-label="Filter severity"><option value="all">All severities</option>@for (severity of severities; track severity) { <option [value]="severity">{{ titleCase(severity) }}</option> }</select><select formControlName="category" aria-label="Filter category"><option value="all">All categories</option>@for (category of categories(report); track category) { <option [value]="category">{{ category }}</option> }</select></div>
              <div class="finding-count"><strong>{{ filteredFindings().length }}</strong> findings match the current filters</div>
              <div class="finding-list">
                @for (finding of filteredFindings(); track finding.id) { <article><app-severity-badge [severity]="finding.severity" /><div class="finding-body"><div class="finding-meta"><span>{{ finding.category }}</span><span>{{ finding.ruleId }}</span></div><h3>{{ finding.title }}</h3><p>{{ finding.description }}</p>@if (finding.filePath) { <code>{{ finding.filePath }}@if (finding.line) { :{{ finding.line }} }</code> }@if (finding.codeSnippet) { <pre>{{ finding.codeSnippet }}</pre> }<div class="recommendation-box"><strong>Recommendation</strong><span>{{ finding.recommendation }}</span></div></div></article> } @empty { <div class="empty-state small-empty"><h3>No matching findings</h3><p>Adjust the severity, category, or search filters.</p></div> }
              </div>
            </section>
          }
          @case ('metrics') {
            <section class="metrics-grid">@for (metric of report.metrics; track metric.label) { <article class="panel metric-card"><span>{{ metric.label }}</span><strong>{{ metric.value }}<small>{{ metric.unit }}</small></strong><p>{{ metric.description }}</p></article> }</section>
          }
          @case ('recommendations') {
            <section class="panel recommendation-panel"><div class="section-heading"><div><h2>Action plan</h2><p>Prioritized moves to improve the next architecture score.</p></div></div><ol class="recommendation-list">@for (recommendation of report.recommendations; track recommendation; let index = $index) { <li><span>{{ index + 1 }}</span><div><small>{{ index < 2 ? 'High priority' : index < 5 ? 'Medium priority' : 'Improvement' }}</small><p>{{ recommendation }}</p></div></li> }</ol></section>
          }
          @case ('files') {
            <section class="panel files-panel"><div class="section-heading"><div><h2>Analyzed files</h2><p>{{ report.files.length }} source files contributed to this report.</p></div></div><div class="file-list">@for (file of report.files; track file.path) { <div><span class="file-type">{{ file.extension.replace('.', '').toUpperCase() }}</span><code>{{ file.path }}</code><span>{{ formatSize(file.size) }}</span></div> }</div></section>
          }
        }
      </div>
    } @else {
      <div class="page"><section class="panel empty-state report-missing"><div class="empty-mark">?</div><h1>Report not found</h1><p>This report may have been cleared from local storage or created in another browser.</p><a class="primary-button" routerLink="/analyze">Run a new analysis</a></section></div>
    }
  `
})
export class ReportComponent {
  private readonly storage = inject(ReportStorageService);
  private readonly route = inject(ActivatedRoute);
  readonly report = computed(() => this.storage.find(this.route.snapshot.paramMap.get('id') ?? ''));
  readonly tab = signal<ReportTab>('overview');
  readonly tabs: { id: ReportTab; label: string }[] = [{ id: 'overview', label: 'Overview' }, { id: 'findings', label: 'Findings' }, { id: 'metrics', label: 'Metrics' }, { id: 'recommendations', label: 'Recommendations' }, { id: 'files', label: 'Files' }];
  readonly severities: RuleSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];
  readonly filters = new FormGroup({ search: new FormControl('', { nonNullable: true }), severity: new FormControl<RuleSeverity | 'all'>('all', { nonNullable: true }), category: new FormControl<RuleCategory | 'all'>('all', { nonNullable: true }) });
  private readonly filterValue = toSignal(this.filters.valueChanges, { initialValue: this.filters.getRawValue() });
  readonly filteredFindings = computed(() => {
    const report = this.report(); const filters = this.filterValue(); if (!report) return [];
    const query = (filters.search ?? '').toLowerCase().trim();
    return report.findings.filter((finding) => (filters.severity === 'all' || finding.severity === filters.severity) && (filters.category === 'all' || finding.category === filters.category) && (!query || `${finding.title} ${finding.ruleId} ${finding.filePath ?? ''}`.toLowerCase().includes(query)));
  });
  dimensions(report: NonNullable<ReturnType<typeof this.report>>): { label: string; value: number }[] { return [{ label: 'Maintainability', value: report.score.maintainability }, { label: 'Performance', value: report.score.performance }, { label: 'Scalability', value: report.score.scalability }, { label: 'Testability', value: report.score.testability }, { label: 'Accessibility', value: report.score.accessibility }]; }
  severitySummary(report: NonNullable<ReturnType<typeof this.report>>): { severity: RuleSeverity; count: number }[] { return this.severities.map((severity) => ({ severity, count: report.summary.severity[severity] })); }
  categories(report: NonNullable<ReturnType<typeof this.report>>): RuleCategory[] { return [...new Set(report.findings.map((finding) => finding.category))]; }
  priorityFindings(report: NonNullable<ReturnType<typeof this.report>>) { return report.findings.filter((finding) => ['critical', 'high'].includes(finding.severity)).slice(0, 5); }
  showSeverity(severity: RuleSeverity): void { this.filters.controls.severity.setValue(severity); this.tab.set('findings'); }
  titleCase(value: string): string { return value.charAt(0).toUpperCase() + value.slice(1); }
  scoreGradient(score: number): string { return `conic-gradient(var(--accent) ${score * 3.6}deg, var(--surface-3) 0deg)`; }
  scoreSummary(score: number): string { return score >= 90 ? 'The project demonstrates strong, scalable Angular boundaries.' : score >= 75 ? 'The foundation is healthy with several focused improvements available.' : score >= 60 ? 'The architecture is workable, but priority issues will compound as the project grows.' : 'Critical architecture risks should be addressed before expanding the codebase.'; }
  formatSize(size: number): string { return size < 1024 ? `${size} B` : `${(size / 1024).toFixed(1)} KB`; }
  exportReport(): void { const report = this.report(); if (!report) return; const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${report.projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-architecture-report.json`; document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
}
