# NgArchitect

> Architecture insights for serious Angular teams.

NgArchitect is a browser-only Angular architecture review dashboard. It reads an Angular project ZIP, applies transparent deterministic rules, scores architecture health, and turns findings into an actionable report. No source code or report data leaves the browser.

## Product surfaces

- Responsive dashboard with report history and architecture KPIs
- ZIP upload and a realistic built-in demo project
- Scoring across maintainability, performance, scalability, testability, and accessibility
- Searchable findings with severity and category filters
- Metrics, recommendations, file inventory, and JSON export
- Complete rule catalog and persisted strictness/threshold settings
- Dark, light, and system themes

## Stack

- Angular 21 standalone components, signals, router, and reactive forms
- TypeScript strict mode and modern Angular template control flow
- Spartan UI headless button and tooltip primitives
- Tailwind CSS 4 with a project-level token system
- JSZip for local archive parsing
- LocalStorage for settings and report history

Angular 21.2.17 is used because it is the newest stable Angular release compatible with the workspace's Node 20.19.5 runtime. Angular 22 requires Node 22.22.3 or newer.

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:4200`. Production build:

```bash
npm run build
```

## Architecture

```text
src/app/
├── core/       # typed models, analyzer, settings, ZIP and persistence services
├── features/   # lazy dashboard, analyze, report, rules and settings routes
├── layout/     # responsive application shell, header and sidebar
└── shared/     # reusable presentation primitives
```

The analyzer receives normalized `ProjectFile` records plus persisted thresholds and returns a complete report model. View components consume reports through a small LocalStorage-backed signal service.

## Analyzer rules

1. Feature-oriented folder structure
2. Component size
3. Service size and responsibility
4. Component and service naming
5. Standalone component adoption
6. Lazy-loaded routes and route files
7. Nested subscriptions and teardown
8. Signals adoption and state ownership
9. Hardcoded secrets and console logging
10. Explicit `any` usage and debt markers
11. Test coverage signal
12. Template loop tracking
13. Legacy NgModule weight
14. Excessive barrel exports

The application exposes 20 discrete checks across these groups; see the Rules page for the full descriptions and recommendations.

## Roadmap

- AST-backed parsing and dependency graph visualization
- Custom organization rule packs
- CI mode with thresholds and SARIF output
- Report comparison and architecture trends
- Optional team workspace synchronization

## Author

Dipak Ahirav
