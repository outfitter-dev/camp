/**
 * Simplified types for the new formatting package
 */

export interface InitOptions {
  /**
   * Skip running ultracite init
   * @default false
   */
  skipUltracite?: boolean;

  /**
   * Skip installing dependencies
   * @default false
   */
  skipInstall?: boolean;

  /**
   * Include markdownlint-cli2 setup
   * @default true
   */
  includeMarkdownLint?: boolean;

  /**
   * Include EditorConfig
   * @default true
   */
  includeEditorConfig?: boolean;

  /**
   * Working directory
   * @default process.cwd()
   */
  cwd?: string;

  /**
   * Dry run - don't write files
   * @default false
   */
  dryRun?: boolean;
}

export interface GeneratedConfig {
  path: string;
  content: string;
  merge?: boolean;
}