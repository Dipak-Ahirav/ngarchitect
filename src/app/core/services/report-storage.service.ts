import { Injectable, computed, signal } from '@angular/core';
import { ArchitectureReport } from '../models/architecture.models';

@Injectable({ providedIn: 'root' })
export class ReportStorageService {
  private readonly storageKey = 'ngarchitect.reports.v1';
  readonly reports = signal<ArchitectureReport[]>(this.read());
  readonly averageScore = computed(() => {
    const reports = this.reports();
    return reports.length ? Math.round(reports.reduce((total, report) => total + report.score.overall, 0) / reports.length) : 0;
  });

  save(report: ArchitectureReport): void {
    const next = [report, ...this.reports().filter((item) => item.id !== report.id)].slice(0, 12);
    this.reports.set(next);
    localStorage.setItem(this.storageKey, JSON.stringify(next));
  }

  find(id: string): ArchitectureReport | undefined {
    return this.reports().find((report) => report.id === id);
  }

  clear(): void {
    this.reports.set([]);
    localStorage.removeItem(this.storageKey);
  }

  private read(): ArchitectureReport[] {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey) ?? '[]') as ArchitectureReport[];
    } catch {
      return [];
    }
  }
}
