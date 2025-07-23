export interface InitOptions {
  yes?: boolean;
  dryRun?: boolean;
  keepExisting?: boolean;
  noStylelint?: boolean;
  noGitHooks?: boolean;
  monorepo?: boolean;
  keepPrettier?: boolean;
}

export interface CleanOptions {
  force?: boolean;
}

export interface DoctorOptions {
  // Currently no options, but keeping for future extensibility
}

export interface DetectedConfig {
  tool: string;
  path: string;
  content: string;
}

export interface DetectedTools {
  hasConfigs: boolean;
  configs: DetectedConfig[];
}

export interface DoctorIssue {
  description: string;
  severity: 'error' | 'warning' | 'info';
  fix?: string;
}

export interface DoctorReport {
  issues: DoctorIssue[];
}