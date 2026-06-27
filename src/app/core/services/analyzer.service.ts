import { Injectable } from '@angular/core';
import { AppSettings, ArchitectureFinding, ArchitectureMetric, ArchitectureReport, ProjectFile, RuleCategory, RuleSeverity } from '../models/architecture.models';

const severityWeight: Record<RuleSeverity, number> = { critical: 20, high: 12, medium: 6, low: 3, info: 0 };
const categoryDimension: Partial<Record<RuleCategory, keyof ArchitectureReport['score']>> = {
  Maintainability: 'maintainability', Components: 'maintainability', Security: 'maintainability',
  Services: 'scalability', Structure: 'scalability', Signals: 'scalability', 'State Management': 'scalability',
  Routing: 'performance', Performance: 'performance', RxJS: 'performance', Testing: 'testability'
};

@Injectable({ providedIn: 'root' })
export class AnalyzerService {
  analyze(files: readonly ProjectFile[], projectName: string, settings: AppSettings): ArchitectureReport {
    const findings: ArchitectureFinding[] = [];
    const sourceFiles = files.filter((item) => item.path.endsWith('.ts') && !item.path.endsWith('.spec.ts'));
    const components = sourceFiles.filter((item) => item.content.includes('@Component'));
    const services = sourceFiles.filter((item) => item.content.includes('@Injectable'));
    const routeFiles = files.filter((item) => /routes?\.ts$|routing/.test(item.path));
    const testFiles = files.filter((item) => item.path.endsWith('.spec.ts'));
    const strictFactor = settings.strictness === 'strict' ? 0.82 : settings.strictness === 'relaxed' ? 1.2 : 1;
    const componentLimit = Math.round(settings.largeComponentLines * strictFactor);
    const serviceLimit = Math.round(settings.largeServiceLines * strictFactor);
    let sequence = 0;

    const add = (ruleId: string, title: string, description: string, severity: RuleSeverity, category: RuleCategory, recommendation: string, file?: ProjectFile, match?: string): void => {
      const line = file && match ? this.lineOf(file.content, match) : undefined;
      findings.push({ id: `${ruleId}-${++sequence}`, ruleId, title, description, severity, category, recommendation, filePath: file?.path, line, codeSnippet: file && line ? file.content.split('\n')[line - 1]?.trim().slice(0, 180) : undefined });
    };

    const hasFeatureFolders = files.some((item) => /src\/app\/(features?|domains?)\//.test(item.path));
    if (!hasFeatureFolders || components.filter((item) => /^src\/app\/[^/]+$/.test(item.path)).length > 3) {
      add('structure-feature-folders', 'Feature boundaries are unclear', 'The project has limited feature-oriented folder boundaries.', 'high', 'Structure', 'Introduce a clear core/shared/features boundary.');
    }

    for (const component of components) {
      const lines = component.content.split('\n').length;
      if (lines > componentLimit) add('component-size', `Large component (${lines} lines)`, 'This component exceeds the configured size threshold.', 'high', 'Components', 'Move API orchestration out of components and extract cohesive view sections.', component);
      if (!component.path.endsWith('.component.ts')) add('component-naming', 'Non-standard component filename', 'A decorated component does not use the .component.ts suffix.', 'low', 'Components', 'Adopt conventional Angular component filenames.', component);
      if (!/standalone\s*:\s*true/.test(component.content)) add('standalone-components', 'Component is not standalone', 'No standalone: true metadata was detected.', 'medium', 'Components', 'Migrate this component to standalone APIs.', component);
    }

    for (const service of services) {
      const lines = service.content.split('\n').length;
      if (lines > serviceLimit) add('service-size', 'Service has too many responsibilities', `The service spans ${lines} lines and is likely acting as a dependency hub.`, 'high', 'Services', 'Split feature-specific services from cross-cutting services.', service);
      if (!service.path.endsWith('.service.ts')) add('service-naming', 'Non-standard service filename', 'An injectable does not use the .service.ts suffix.', 'low', 'Services', 'Adopt conventional Angular service filenames.', service);
    }

    if (!routeFiles.length) add('route-file', 'Dedicated route file not found', 'No app.routes.ts or routing configuration was detected.', 'medium', 'Routing', 'Create a dedicated typed route configuration.');
    for (const routes of routeFiles) {
      const eagerRoutes = (routes.content.match(/component\s*:/g) ?? []).length;
      if (eagerRoutes) add('lazy-routes', 'Route configuration contains eager feature routes', `${eagerRoutes} route(s) use component instead of loadComponent/loadChildren.`, 'high', 'Routing', 'Prefer route-level lazy loading for feature areas.', routes, 'component:');
    }

    for (const source of sourceFiles) {
      const nested = /subscribe\s*\([^)]*=>\s*\{?[\s\S]{0,320}?subscribe\s*\(/.test(source.content);
      if (nested) add('nested-subscribe', 'Nested subscription detected', 'A subscribe call appears inside another subscription callback.', 'high', 'RxJS', 'Replace nested subscriptions with switchMap, combineLatest, or signal-based state.', source, 'subscribe');
      const subscribeCount = (source.content.match(/\.subscribe\s*\(/g) ?? []).length;
      if (subscribeCount > 2 && !/takeUntilDestroyed|toSignal|async\s*\|/.test(source.content)) add('manual-subscriptions', 'Manual subscriptions lack a teardown pattern', `${subscribeCount} manual subscriptions were found without a recognized lifecycle helper.`, 'medium', 'RxJS', 'Use takeUntilDestroyed, async pipe, or toSignal.', source, 'subscribe');
      const secret = source.content.match(/(?:api[_-]?key|token|password|secret)\s*[:=]\s*['"][^'"]{8,}['"]/i)?.[0];
      if (secret) add('hardcoded-secrets', 'Hardcoded credential-like value detected', 'Client-side source contains a likely credential or secret.', 'critical', 'Security', 'Remove the value from client code and rotate it immediately.', source, secret);
      if (source.content.includes('console.log')) add('console-log', 'Console log found in production source', 'Debug logging remains in an application source file.', 'low', 'Maintainability', 'Remove it or use an environment-aware structured logger.', source, 'console.log');
      const anyCount = (source.content.match(/\bany\b/g) ?? []).length;
      if (anyCount > settings.maxAnyUsage) add('any-usage', 'Excessive any usage', `${anyCount} explicit any usages weaken compiler guarantees.`, 'medium', 'Maintainability', 'Replace any with domain types or unknown plus validation.', source, 'any');
      const debtCount = (source.content.match(/TODO|FIXME|HACK/g) ?? []).length;
      if (debtCount) add('todo-comments', 'Untracked technical-debt comments', `${debtCount} TODO/FIXME/HACK marker(s) were found.`, 'low', 'Maintainability', 'Move actionable debt to owned work items.', source, source.content.match(/TODO|FIXME|HACK/)?.[0]);
    }

    const signalCount = sourceFiles.reduce((sum, item) => sum + (item.content.match(/\b(?:signal|computed|effect|input|output|model)\s*\(/g) ?? []).length, 0);
    if (components.length >= 3 && signalCount < components.length) add('signals-adoption', 'Signals adoption is low', `Only ${signalCount} signal API usage(s) were detected across ${components.length} components.`, 'low', 'Signals', 'Use signals for local state and computed view models.');
    if (services.length > 5 && services.filter((item) => /(?:state|subject|signal)\s*[=:]/i.test(item.content)).length > 3) add('state-scattering', 'State is scattered across services', 'Several services appear to own mutable application state.', 'medium', 'State Management', 'Consolidate state ownership behind feature facades.');

    const testRatio = sourceFiles.length ? testFiles.length / sourceFiles.length : 0;
    if (testRatio < 0.45) add('testing-ratio', 'Low test coverage signal', `Only ${testFiles.length} spec files were found for ${sourceFiles.length} source files.`, 'high', 'Testing', 'Add focused tests at services, routes, and behavior-heavy components.');
    for (const template of files.filter((item) => item.path.endsWith('.html') || item.content.includes('template:'))) {
      if (/\*ngFor/.test(template.content) && !/trackBy|;\s*track\s+/.test(template.content)) add('template-tracking', 'Template loop may be missing tracking', 'A repeated template does not expose a stable tracking expression.', 'medium', 'Performance', 'Add track or trackBy using a stable entity identifier.', template, '*ngFor');
    }
    const moduleFiles = sourceFiles.filter((item) => item.content.includes('@NgModule'));
    if (moduleFiles.length) add('legacy-ngmodules', 'Legacy NgModule architecture detected', `${moduleFiles.length} NgModule file(s) remain in the application graph.`, 'medium', 'Structure', 'Migrate modules incrementally by feature.', moduleFiles[0], '@NgModule');
    const barrels = files.filter((item) => item.name === 'index.ts');
    if (barrels.length > 1) add('barrel-exports', 'Excessive barrel exports', `${barrels.length} index.ts files may obscure dependency direction.`, 'low', 'Maintainability', 'Prefer explicit imports at architectural boundaries.', barrels[0]);

    const scoreBase = { maintainability: 100, performance: 100, scalability: 100, testability: 100, accessibility: 100 };
    for (const finding of findings) {
      const dimension = categoryDimension[finding.category];
      if (dimension && dimension !== 'overall' && dimension !== 'grade') scoreBase[dimension] = Math.max(20, scoreBase[dimension] - severityWeight[finding.severity]);
      if (finding.category === 'Components' && finding.title.toLowerCase().includes('component')) scoreBase.accessibility = Math.max(40, scoreBase.accessibility - 2);
    }
    const overall = Math.round(Object.values(scoreBase).reduce((sum, value) => sum + value, 0) / 5);
    const grade = overall >= 90 ? 'Excellent' : overall >= 75 ? 'Good' : overall >= 60 ? 'Needs Improvement' : 'Risky';
    const severity = { critical: 0, high: 0, medium: 0, low: 0, info: 0 } satisfies Record<RuleSeverity, number>;
    findings.forEach((finding) => severity[finding.severity]++);
    const metrics: ArchitectureMetric[] = [
      { label: 'Files analyzed', value: files.length, description: 'Relevant project files parsed' },
      { label: 'Components', value: components.length, description: 'Angular component declarations' },
      { label: 'Services', value: services.length, description: 'Injectable service declarations' },
      { label: 'Routes', value: routeFiles.reduce((sum, item) => sum + (item.content.match(/path\s*:/g) ?? []).length, 0), description: 'Configured application routes' },
      { label: 'Tests', value: testFiles.length, description: 'Specification files found' },
      { label: 'Test signal', value: Math.round(testRatio * 100), unit: '%', description: 'Tests relative to TypeScript source files' },
      { label: 'Signal APIs', value: signalCount, description: 'Modern Angular reactive primitives' },
      { label: 'Source size', value: Math.round(files.reduce((sum, item) => sum + item.size, 0) / 1024), unit: 'KB', description: 'Analyzed source payload' }
    ];
    const recommendations = [...new Set(findings.sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity]).map((finding) => finding.recommendation))].slice(0, 8);
    return {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      projectName,
      createdAt: new Date().toISOString(),
      score: { overall, ...scoreBase, grade },
      findings,
      metrics,
      recommendations,
      files: [...files],
      summary: { fileCount: files.length, components: components.length, services: services.length, routes: metrics[3].value, tests: testFiles.length, severity }
    };
  }

  private lineOf(content: string, match: string): number | undefined {
    const index = content.indexOf(match);
    return index >= 0 ? content.slice(0, index).split('\n').length : undefined;
  }
}
