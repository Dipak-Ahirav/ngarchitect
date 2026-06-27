import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BrnButton } from '@spartan-ng/brain/button';
import { ARCHITECTURE_RULES } from '../../core/constants/architecture-rules';
import { ReportStorageService } from '../../core/services/report-storage.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DatePipe, BrnButton],
  template: `
    <div class="page dashboard-page">
      <section class="hero-panel">
        <div class="hero-copy">
          <h1>Review Angular architecture before complexity becomes technical debt.</h1>
          <p>Run deterministic architecture checks across structure, reactive patterns, routing, security, performance, and testability—entirely in your browser.</p>
          <div class="button-row"><a brnButton class="primary-button" routerLink="/analyze">Analyze Project <span aria-hidden="true">→</span></a><a brnButton class="text-button" routerLink="/rules">Explore all rules</a></div>
        </div>
        <div class="hero-signal" aria-label="Architecture analysis preview">
          <div class="signal-header"><span>Architecture signal</span><span class="live-label"><i></i> Ready</span></div>
          <div class="signal-score"><strong>{{ storage.reports()[0]?.score?.overall ?? '—' }}</strong><span>/100</span></div>
          <div class="signal-bars">
            @for (bar of categories; track bar.label) {
              <div><span>{{ bar.label }}</span><div class="mini-bar"><i [style.width.%]="scoreFor(bar.key)"></i></div><b>{{ scoreFor(bar.key) }}</b></div>
            }
          </div>
        </div>
      </section>

      <section class="kpi-grid" aria-label="Workspace metrics">
        <article><span>Recent reports</span><strong>{{ storage.reports().length }}</strong><small>Saved locally</small></article>
        <article><span>Average score</span><strong>{{ storage.averageScore() || '—' }}</strong><small>Across all reviews</small></article>
        <article><span>Critical findings</span><strong class="danger-text">{{ criticalCount }}</strong><small>Requires immediate action</small></article>
        <article><span>Rules available</span><strong>{{ rules.length }}</strong><small>11 architecture categories</small></article>
      </section>

      <div class="dashboard-grid">
        <section class="panel reports-panel" id="recent-reports">
          <div class="section-heading"><div><h2>Recent reports</h2><p>Architecture reviews stored in this browser.</p></div><a routerLink="/analyze">New analysis <span>→</span></a></div>
          @if (storage.reports().length) {
            <div class="table-wrap"><table><thead><tr><th>Project</th><th>Score</th><th>Findings</th><th>Reviewed</th><th></th></tr></thead><tbody>
              @for (report of storage.reports().slice(0, 5); track report.id) {
                <tr><td><div class="project-cell"><span>{{ report.projectName.slice(0, 1).toUpperCase() }}</span><div><strong>{{ report.projectName }}</strong><small>{{ report.summary.fileCount }} files analyzed</small></div></div></td><td><span class="score-chip" [class.score-risk]="report.score.overall < 60">{{ report.score.overall }}</span></td><td>{{ report.findings.length }}</td><td>{{ report.createdAt | date:'mediumDate' }}</td><td><a [routerLink]="['/reports', report.id]" aria-label="Open report">→</a></td></tr>
              }
            </tbody></table></div>
          } @else {
            <div class="empty-state"><div class="empty-mark">N</div><h3>No reports yet</h3><p>Run the built-in demo or upload an Angular project to establish your first architecture baseline.</p><a class="secondary-button" routerLink="/analyze">Start an analysis</a></div>
          }
        </section>
        <section class="panel categories-panel">
          <div class="section-heading"><div><h2>Review coverage</h2><p>Signals grouped by engineering concern.</p></div></div>
          <div class="category-list">
            @for (item of coverage; track item.name) { <div class="category-row"><div><span class="category-icon">{{ item.icon }}</span><strong>{{ item.name }}</strong></div><span>{{ item.rules }} rules</span></div> }
          </div>
        </section>
      </div>
    </div>
  `
})
export class DashboardComponent {
  protected readonly storage = inject(ReportStorageService);
  protected readonly rules = ARCHITECTURE_RULES;
  protected readonly categories = [
    { label: 'Maintainability', key: 'maintainability' }, { label: 'Performance', key: 'performance' }, { label: 'Scalability', key: 'scalability' }
  ] as const;
  protected readonly coverage = [
    { name: 'Structure & boundaries', icon: '⌘', rules: 4 }, { name: 'Components & signals', icon: '◈', rules: 4 },
    { name: 'RxJS & performance', icon: '↯', rules: 4 }, { name: 'Security & quality', icon: '◇', rules: 4 }, { name: 'Routing & testing', icon: '↗', rules: 4 }
  ];
  get criticalCount(): number { return this.storage.reports().reduce((sum, report) => sum + report.summary.severity.critical, 0); }
  scoreFor(key: typeof this.categories[number]['key']): number { return this.storage.reports()[0]?.score[key] ?? 0; }
}
