import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BrnButton } from '@spartan-ng/brain/button';
import { ProjectFile } from '../../core/models/architecture.models';
import { AnalyzerService } from '../../core/services/analyzer.service';
import { DEMO_FILES } from '../../core/services/demo-project';
import { ReportStorageService } from '../../core/services/report-storage.service';
import { SettingsService } from '../../core/services/settings.service';
import { ZipProjectService } from '../../core/services/zip-project.service';

@Component({
  selector: 'app-analyze',
  imports: [BrnButton],
  template: `
    <div class="page narrow-page">
      <div class="page-heading"><div><span class="page-kicker">New architecture review</span><h1>Analyze an Angular project</h1><p>Source code stays on this device. NgArchitect parses only relevant project files in your browser.</p></div></div>
      <div class="analyze-grid">
        <section class="panel upload-panel" [class.drop-active]="dragging()" (dragover)="onDrag($event, true)" (dragleave)="onDrag($event, false)" (drop)="onDrop($event)">
          <div class="choice-icon">⇧</div><h2>Upload project ZIP</h2><p>Analyze TypeScript, templates, styles, and JSON configuration. Build artifacts and dependencies are ignored.</p>
          <label class="secondary-button file-button"><input type="file" accept=".zip,application/zip" (change)="chooseFile($event)" />Choose ZIP file</label>
          <small>Maximum recommended size: 25 MB</small>
        </section>
        <section class="panel demo-panel"><div class="choice-icon angular-choice">N</div><h2>Use demo project</h2><p>Explore a realistic Angular project with nested subscriptions, a large service, exposed secrets, eager routes, and sparse tests.</p><button brnButton class="primary-button" type="button" [disabled]="running()" (click)="runDemo()">Run demo analysis <span>→</span></button><small>18 files · intentional architecture issues</small></section>
      </div>
      @if (selectedFile()) {
        <section class="panel selected-project"><div class="file-summary"><span class="file-mark">ZIP</span><div><strong>{{ selectedFile()?.name }}</strong><small>{{ selectedFiles().length }} relevant files · {{ fileSize }}</small></div></div><button brnButton class="primary-button" type="button" [disabled]="running() || !selectedFiles().length" (click)="runUpload()">Analyze project</button></section>
      }
      <section class="process-section">
        <div class="section-heading"><div><h2>Analysis pipeline</h2><p>A deterministic pass from source ingestion to prioritized findings.</p></div><span class="progress-label">{{ progress() }}%</span></div>
        <div class="progress-track"><i [style.width.%]="progress()"></i></div>
        <div class="stepper">
          @for (step of steps; track step.label; let index = $index) {
            <div [class.active]="activeStep() >= index" [class.current]="activeStep() === index"><span>{{ activeStep() > index ? '✓' : index + 1 }}</span><div><strong>{{ step.label }}</strong><small>{{ step.detail }}</small></div></div>
          }
        </div>
        @if (error()) { <div class="alert error-alert"><strong>Analysis could not start.</strong><span>{{ error() }}</span></div> }
      </section>
    </div>
  `
})
export class AnalyzeComponent {
  private readonly analyzer = inject(AnalyzerService);
  private readonly reports = inject(ReportStorageService);
  private readonly settings = inject(SettingsService);
  private readonly zip = inject(ZipProjectService);
  private readonly router = inject(Router);
  readonly selectedFile = signal<File | null>(null);
  readonly selectedFiles = signal<ProjectFile[]>([]);
  readonly running = signal(false);
  readonly dragging = signal(false);
  readonly activeStep = signal(-1);
  readonly progress = signal(0);
  readonly error = signal('');
  readonly steps = [
    { label: 'Load files', detail: 'Read source safely in browser' }, { label: 'Parse structure', detail: 'Map Angular architecture' },
    { label: 'Run rules', detail: 'Evaluate 20 deterministic checks' }, { label: 'Generate report', detail: 'Score and prioritize findings' }
  ];
  get fileSize(): string { return `${((this.selectedFile()?.size ?? 0) / 1024 / 1024).toFixed(2)} MB`; }

  async chooseFile(event: Event): Promise<void> { const input = event.target as HTMLInputElement; if (input.files?.[0]) await this.loadZip(input.files[0]); }
  onDrag(event: DragEvent, active: boolean): void { event.preventDefault(); this.dragging.set(active); }
  async onDrop(event: DragEvent): Promise<void> { event.preventDefault(); this.dragging.set(false); const file = event.dataTransfer?.files[0]; if (file) await this.loadZip(file); }
  async runDemo(): Promise<void> { await this.run([...DEMO_FILES], 'NgArchitect Demo'); }
  async runUpload(): Promise<void> { const name = this.selectedFile()?.name.replace(/\.zip$/i, '') ?? 'Angular Project'; await this.run(this.selectedFiles(), name); }

  private async loadZip(file: File): Promise<void> {
    this.error.set('');
    if (!file.name.toLowerCase().endsWith('.zip')) { this.error.set('Choose a valid .zip archive.'); return; }
    this.selectedFile.set(file); this.progress.set(0); this.activeStep.set(0);
    try { this.selectedFiles.set(await this.zip.read(file, (progress) => this.progress.set(progress))); }
    catch { this.error.set('The archive could not be read. Confirm it is a valid, unencrypted ZIP file.'); this.selectedFiles.set([]); }
  }

  private async run(files: ProjectFile[], projectName: string): Promise<void> {
    this.running.set(true); this.error.set('');
    for (let index = 0; index < this.steps.length; index++) { this.activeStep.set(index); this.progress.set((index + 1) * 22); await new Promise((resolve) => setTimeout(resolve, index === 2 ? 450 : 240)); }
    const report = this.analyzer.analyze(files, projectName, this.settings.settings());
    this.reports.save(report); this.progress.set(100); await new Promise((resolve) => setTimeout(resolve, 180));
    await this.router.navigate(['/reports', report.id]); this.running.set(false);
  }
}
