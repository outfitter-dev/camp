import chalk from 'chalk';
import { execa } from 'execa';

export async function applyConfigurations(
  configs: Array<string>
): Promise<void> {
  // TODO: Implement actual configuration application
  // For each config package, we need to:
  // 1. Check if it has an init function or CLI
  // 2. Copy default config files if needed
  // 3. Update package.json scripts if needed

  console.log(chalk.gray('Applying configurations...'));

  // Placeholder for now
  for (const config of configs) {
    switch (config) {
      case '@outfitter/eslint-config':
        // TODO: Create .eslintrc.js
        break;
      case '@outfitter/typescript-config':
        // TODO: Create/update tsconfig.json
        break;
      case '@outfitter/prettier-config':
        // TODO: Create .prettierrc
        break;
      case '@outfitter/husky-config':
        // Will be handled separately by initializeHusky
        break;
      case '@outfitter/changeset-config':
        // TODO: Run changeset init
        break;
      default:
        console.warn(
          chalk.yellow(`⚠ Unknown configuration package: ${config}`)
        );
        break;
    }
  }
}

/**
 * Initializes Husky by running the installation command to set up Git hooks.
 *
 * @remark
 * This function executes `npx husky install` and inherits standard input/output streams for direct console interaction.
 */
export async function initializeHusky(): Promise<void> {
  // TODO: Actually initialize husky
  // This would typically run husky install and set up hooks
  await execa('husky', ['install'], { stdio: 'inherit' });
}
