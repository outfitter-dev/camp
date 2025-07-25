import { Result, success, failure, isSuccess, isFailure } from '@outfitter/contracts';
import * as pc from 'picocolors';
import { readJSON, writeJSON, fileExists, ensureDir } from '../utils/file-system.js';
import path from 'node:path';

/**
 * Checks if VS Code directory exists
 */
export async function hasVSCode(): Promise<boolean> {
  const result = await fileExists('.vscode');
  return isSuccess(result) && result.data;
}

/**
 * Merges new VS Code settings with existing ones
 */
async function mergeVSCodeSettings(newSettings: any): Promise<Result<void, Error>> {
  const settingsPath = path.join('.vscode', 'settings.json');
  let existingSettings = {};
  
  const fileExistsResult = await fileExists(settingsPath);
  if (isSuccess(fileExistsResult) && fileExistsResult.data) {
    const readResult = await readJSON(settingsPath);
    if (isSuccess(readResult)) {
      existingSettings = readResult.data;
    }
  }
  
  const merged = {
    ...existingSettings,
    ...newSettings
  };
  
  const ensureDirResult = await ensureDir('.vscode');
  if (isFailure(ensureDirResult)) {
    return failure(ensureDirResult.error);
  }
  
  return writeJSON(settingsPath, merged);
}

/**
 * Merges new VS Code extensions with existing ones
 */
async function mergeVSCodeExtensions(newExtensions: any): Promise<Result<void, Error>> {
  const extensionsPath = path.join('.vscode', 'extensions.json');
  let existingExtensions = { recommendations: [] };
  
  const fileExistsResult = await fileExists(extensionsPath);
  if (isSuccess(fileExistsResult) && fileExistsResult.data) {
    const readResult = await readJSON(extensionsPath);
    if (isSuccess(readResult)) {
      existingExtensions = readResult.data;
    }
  }
  
  const merged = {
    ...existingExtensions,
    recommendations: [
      ...new Set([
        ...(existingExtensions.recommendations || []),
        ...(newExtensions.recommendations || [])
      ])
    ]
  };
  
  const ensureDirResult = await ensureDir('.vscode');
  if (isFailure(ensureDirResult)) {
    return failure(ensureDirResult.error);
  }
  
  return writeJSON(extensionsPath, merged);
}

/**
 * Sets up VS Code configuration
 */
export async function setupVSCode(): Promise<Result<void, Error>> {
  try {
    console.log(pc.blue('→ Setting up VS Code integration...'));
    
    const settings = {
      // Formatter assignments
      "[typescript]": { "editor.defaultFormatter": "biomejs.biome" },
      "[typescriptreact]": { "editor.defaultFormatter": "biomejs.biome" },
      "[javascript]": { "editor.defaultFormatter": "biomejs.biome" },
      "[javascriptreact]": { "editor.defaultFormatter": "biomejs.biome" },
      "[markdown]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
      "[css]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
      "[scss]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
      "[less]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
      "[json]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
      "[jsonc]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
      "[yaml]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
      "[html]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
      
      // Editor behavior
      "editor.formatOnSave": true,
      "editor.formatOnPaste": false,
      "editor.codeActionsOnSave": {
        "source.fixAll.oxlint": "explicit",
        "source.fixAll.stylelint": "explicit", 
        "source.organizeImports.biome": "explicit"
      },
      
      // File handling
      "files.eol": "\n",
      "files.trimTrailingWhitespace": true,
      "files.insertFinalNewline": true,
      "files.trimFinalNewlines": true,
      
      // Tool-specific settings
      "oxlint.enable": true,
      "oxlint.run": "onType",
      "css.validate": false, // Let Stylelint handle it
      "scss.validate": false,
      "less.validate": false,
      
      // Biome settings (Ultracite may have set some already)
      "biome.enabled": true,
      "editor.defaultFormatter": "biomejs.biome"
    };
    
    const extensions = {
      "recommendations": [
        "biomejs.biome",
        "esbenp.prettier-vscode",
        "oxlint.oxlint",
        "DavidAnson.vscode-markdownlint",
        "stylelint.vscode-stylelint",
        "streetsidesoftware.code-spell-checker",
        "editorconfig.editorconfig"
      ]
    };
    
    // Merge settings
    const settingsResult = await mergeVSCodeSettings(settings);
    if (isFailure(settingsResult)) {
      return failure(settingsResult.error);
    }
    
    // Merge extensions
    const extensionsResult = await mergeVSCodeExtensions(extensions);
    if (isFailure(extensionsResult)) {
      return failure(extensionsResult.error);
    }
    
    console.log(pc.green('✓ VS Code configured successfully'));
    return success(undefined);
  } catch (error) {
    return failure(error as Error);
  }
}

/**
 * Enhances VS Code settings after other tools have set up their configs
 * This is called after Ultracite init to ensure we don't override its settings
 */
export async function enhanceVSCodeSettings(): Promise<Result<void, Error>> {
  try {
    console.log(pc.blue('→ Enhancing VS Code settings...'));
    
    // Only add settings that Ultracite doesn't handle
    const additionalSettings = {
      // Additional language-specific formatters
      "[markdown]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
      "[css]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
      "[scss]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
      "[less]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
      "[yaml]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
      "[html]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
      
      // Additional code actions
      "editor.codeActionsOnSave": {
        "source.fixAll.oxlint": "explicit",
        "source.fixAll.stylelint": "explicit"
      },
      
      // Tool-specific settings
      "oxlint.enable": true,
      "oxlint.run": "onType",
      "css.validate": false,
      "scss.validate": false,
      "less.validate": false
    };
    
    const additionalExtensions = {
      "recommendations": [
        "oxlint.oxlint",
        "DavidAnson.vscode-markdownlint",
        "stylelint.vscode-stylelint",
        "editorconfig.editorconfig"
      ]
    };
    
    // Merge additional settings
    const settingsResult = await mergeVSCodeSettings(additionalSettings);
    if (isFailure(settingsResult)) {
      return failure(settingsResult.error);
    }
    
    // Merge additional extensions
    const extensionsResult = await mergeVSCodeExtensions(additionalExtensions);
    if (isFailure(extensionsResult)) {
      return failure(extensionsResult.error);
    }
    
    console.log(pc.green('✓ VS Code settings enhanced'));
    return success(undefined);
  } catch (error) {
    return failure(error as Error);
  }
}