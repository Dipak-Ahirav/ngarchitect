import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { AppSettings } from '../models/architecture.models';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  strictness: 'balanced',
  largeComponentLines: 260,
  largeServiceLines: 320,
  maxAnyUsage: 3
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly document = inject(DOCUMENT);
  private readonly storageKey = 'ngarchitect.settings.v1';
  readonly settings = signal<AppSettings>(this.read());

  constructor() {
    this.applyTheme(this.settings().theme);
  }

  update(settings: AppSettings): void {
    this.settings.set(settings);
    localStorage.setItem(this.storageKey, JSON.stringify(settings));
    this.applyTheme(settings.theme);
  }

  private read(): AppSettings {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(this.storageKey) ?? '{}') as Partial<AppSettings> };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  private applyTheme(theme: AppSettings['theme']): void {
    const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
    this.document.documentElement.dataset['theme'] = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
  }
}
