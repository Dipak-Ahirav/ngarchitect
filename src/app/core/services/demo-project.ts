import { ProjectFile } from '../models/architecture.models';

const file = (path: string, content: string): ProjectFile => ({
  path,
  name: path.split('/').at(-1) ?? path,
  extension: path.includes('.') ? `.${path.split('.').at(-1)}` : '',
  content,
  size: new Blob([content]).size
});

const repeatedMethods = Array.from({ length: 280 }, (_, index) => `  helper${index}(): number { return ${index}; }`).join('\n');
const serviceMethods = Array.from({ length: 350 }, (_, index) => `  operation${index}(): void { console.log('operation ${index}'); }`).join('\n');

export const DEMO_FILES: readonly ProjectFile[] = [
  file('src/app/app.component.ts', `import { Component, signal } from '@angular/core';\n@Component({ selector: 'app-root', standalone: true, template: '<router-outlet />' })\nexport class AppComponent { readonly ready = signal(true); }`),
  file('src/app/app.routes.ts', `import { Routes } from '@angular/router';\nimport { AdminComponent } from './admin/admin.component';\nexport const routes: Routes = [\n { path: 'users', loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent) },\n { path: 'admin', component: AdminComponent }\n];`),
  file('src/app/features/users/user.component.ts', `import { Component } from '@angular/core';\n@Component({ selector: 'app-user', standalone: true, templateUrl: './user.component.html' })\nexport class UserComponent {\n data: any; selected: any; payload: any; formValue: any;\n load() { this.userService.get().subscribe(user => { this.auditService.get(user.id).subscribe(audit => { this.data = audit; }); }); console.log('loaded'); }\n${repeatedMethods}\n}`),
  file('src/app/features/users/user.component.html', `<section><h1>Users</h1>@for (user of users; track user.id) { <article>{{ user.name }}</article> }</section>`),
  file('src/app/features/users/users.component.ts', `import { Component, computed, signal } from '@angular/core';\n@Component({ selector: 'app-users', standalone: true, template: '@for (item of filtered(); track item.id) { {{item.name}} }' })\nexport class UsersComponent { items = signal([{ id: 1, name: 'Ada' }]); filtered = computed(() => this.items()); }`),
  file('src/app/core/services/user.service.ts', `import { Injectable } from '@angular/core';\n@Injectable({ providedIn: 'root' })\nexport class UserService {\n private apiKey = 'sk_live_51EXAMPLE_HARDCODED_KEY';\n${serviceMethods}\n}`),
  file('src/app/core/services/session.service.ts', `import { Injectable, signal } from '@angular/core';\n@Injectable({ providedIn: 'root' }) export class SessionService { user = signal(null); }`),
  file('src/app/core/services/preferences.service.ts', `import { Injectable } from '@angular/core';\n@Injectable({ providedIn: 'root' }) export class PreferencesService { state = {}; }`),
  file('src/app/core/services/cart.service.ts', `import { Injectable } from '@angular/core';\n@Injectable({ providedIn: 'root' }) export class CartService { state = []; }`),
  file('src/app/admin/admin.component.ts', `import { Component } from '@angular/core';\n@Component({ selector: 'app-admin', standalone: true, template: '<p>Admin</p>' }) export class AdminComponent {}`),
  file('src/app/shared/legacy.module.ts', `import { NgModule } from '@angular/core';\n@NgModule({ declarations: [], imports: [] }) export class LegacyModule {}`),
  file('src/app/shared/table.ts', `import { Component } from '@angular/core';\n@Component({ selector: 'app-table', standalone: true, template: '<div *ngFor="let row of rows">{{row}}</div>' }) export class Table { rows: any[] = []; }`),
  file('src/app/shared/index.ts', `export * from './table';`),
  file('src/app/core/index.ts', `export * from './services/user.service';`),
  file('src/environments/environment.ts', `export const environment = { production: true, password: 'admin-secret-123', apiUrl: 'https://api.example.dev' };`),
  file('src/app/features/users/user.component.spec.ts', `describe('UserComponent', () => { it('creates', () => expect(true).toBe(true)); });`),
  file('src/app/core/services/session.service.spec.ts', `describe('SessionService', () => { it('creates', () => expect(true).toBe(true)); });`),
  file('src/styles.scss', `:root { color-scheme: dark; }`)
];
