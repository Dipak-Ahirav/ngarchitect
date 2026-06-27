import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BrnButton } from '@spartan-ng/brain/button';
import { AppSettings } from '../../core/models/architecture.models';
import { ReportStorageService } from '../../core/services/report-storage.service';
import { SettingsService } from '../../core/services/settings.service';

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule, BrnButton],
  template: `
    <div class="page settings-page">
      <div class="page-heading"><div><span class="page-kicker">Workspace preferences</span><h1>Settings</h1><p>Control the review strictness, source thresholds, and appearance of this browser.</p></div></div>
      <form [formGroup]="form" (ngSubmit)="save()">
        <section class="settings-section panel"><div class="settings-copy"><h2>Appearance</h2><p>Choose how NgArchitect renders the review workspace.</p></div><div class="settings-control"><label for="theme">Theme mode</label><select id="theme" formControlName="theme"><option value="dark">Dark</option><option value="light">Light</option><option value="system">System</option></select><small>System follows your operating system preference.</small></div></section>
        <section class="settings-section panel"><div class="settings-copy"><h2>Scoring strictness</h2><p>Adjust thresholds globally without changing which rules are evaluated.</p></div><div class="settings-control"><div class="segmented-control">
          @for (mode of strictnessOptions; track mode.value) { <button type="button" [class.active]="form.controls.strictness.value === mode.value" (click)="form.controls.strictness.setValue(mode.value)"><strong>{{ mode.label }}</strong><span>{{ mode.detail }}</span></button> }
        </div></div></section>
        <section class="settings-section panel"><div class="settings-copy"><h2>Source thresholds</h2><p>Set the point where maintainability rules create a finding.</p></div><div class="settings-control threshold-grid">
          <label>Large component <span>Lines</span><input type="number" min="80" max="1000" formControlName="largeComponentLines" /></label>
          <label>Large service <span>Lines</span><input type="number" min="100" max="1500" formControlName="largeServiceLines" /></label>
          <label>Maximum any usage <span>Count / file</span><input type="number" min="0" max="50" formControlName="maxAnyUsage" /></label>
        </div></section>
        <div class="settings-actions"><span [class.saved-visible]="saved()">Settings saved locally.</span><button brnButton class="primary-button" type="submit" [disabled]="form.invalid">Save settings</button></div>
      </form>
      <section class="danger-zone"><div><h2>Local report history</h2><p>Remove all saved reports from this browser. This cannot be undone.</p></div><button brnButton class="danger-button" type="button" (click)="clearReports()">Clear report history</button></section>
    </div>
  `
})
export class SettingsComponent {
  private readonly settings = inject(SettingsService);
  private readonly reports = inject(ReportStorageService);
  readonly saved = signal(false);
  readonly strictnessOptions: { value: AppSettings['strictness']; label: string; detail: string }[] = [
    { value: 'relaxed', label: 'Relaxed', detail: 'Established codebases' }, { value: 'balanced', label: 'Balanced', detail: 'Recommended default' }, { value: 'strict', label: 'Strict', detail: 'High-growth teams' }
  ];
  readonly form = new FormGroup({
    theme: new FormControl<AppSettings['theme']>(this.settings.settings().theme, { nonNullable: true }),
    strictness: new FormControl<AppSettings['strictness']>(this.settings.settings().strictness, { nonNullable: true }),
    largeComponentLines: new FormControl(this.settings.settings().largeComponentLines, { nonNullable: true, validators: [Validators.min(80), Validators.max(1000)] }),
    largeServiceLines: new FormControl(this.settings.settings().largeServiceLines, { nonNullable: true, validators: [Validators.min(100), Validators.max(1500)] }),
    maxAnyUsage: new FormControl(this.settings.settings().maxAnyUsage, { nonNullable: true, validators: [Validators.min(0), Validators.max(50)] })
  });
  save(): void { if (this.form.valid) { this.settings.update(this.form.getRawValue()); this.saved.set(true); setTimeout(() => this.saved.set(false), 2200); } }
  clearReports(): void { if (confirm('Clear all locally saved architecture reports?')) this.reports.clear(); }
}
