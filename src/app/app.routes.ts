import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', title: 'Dashboard · NgArchitect', loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent) },
      { path: 'analyze', title: 'Analyze Project · NgArchitect', loadComponent: () => import('./features/analyze/analyze.component').then((m) => m.AnalyzeComponent) },
      { path: 'reports/:id', title: 'Architecture Report · NgArchitect', loadComponent: () => import('./features/reports/report.component').then((m) => m.ReportComponent) },
      { path: 'reports', redirectTo: '', pathMatch: 'full' },
      { path: 'rules', title: 'Analyzer Rules · NgArchitect', loadComponent: () => import('./features/rules/rules.component').then((m) => m.RulesComponent) },
      { path: 'settings', title: 'Settings · NgArchitect', loadComponent: () => import('./features/settings/settings.component').then((m) => m.SettingsComponent) }
    ]
  },
  { path: '**', redirectTo: '' }
];
