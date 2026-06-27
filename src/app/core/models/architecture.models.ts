export type RuleSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type RuleCategory =
  | 'Structure'
  | 'Components'
  | 'Services'
  | 'State Management'
  | 'Routing'
  | 'RxJS'
  | 'Signals'
  | 'Performance'
  | 'Security'
  | 'Testing'
  | 'Maintainability';

export interface ProjectFile {
  path: string;
  name: string;
  extension: string;
  content: string;
  size: number;
}

export interface ArchitectureRule {
  id: string;
  title: string;
  description: string;
  whyItMatters: string;
  severity: RuleSeverity;
  category: RuleCategory;
  recommendation: string;
}

export interface ArchitectureFinding {
  id: string;
  ruleId: string;
  title: string;
  description: string;
  severity: RuleSeverity;
  category: RuleCategory;
  filePath?: string;
  line?: number;
  recommendation: string;
  codeSnippet?: string;
}

export interface ArchitectureScore {
  overall: number;
  maintainability: number;
  performance: number;
  scalability: number;
  testability: number;
  accessibility: number;
  grade: 'Excellent' | 'Good' | 'Needs Improvement' | 'Risky';
}

export interface ArchitectureMetric {
  label: string;
  value: number;
  unit?: string;
  description: string;
}

export interface ArchitectureReport {
  id: string;
  projectName: string;
  createdAt: string;
  score: ArchitectureScore;
  findings: ArchitectureFinding[];
  metrics: ArchitectureMetric[];
  recommendations: string[];
  files: ProjectFile[];
  summary: {
    fileCount: number;
    components: number;
    services: number;
    routes: number;
    tests: number;
    severity: Record<RuleSeverity, number>;
  };
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  strictness: 'relaxed' | 'balanced' | 'strict';
  largeComponentLines: number;
  largeServiceLines: number;
  maxAnyUsage: number;
}
