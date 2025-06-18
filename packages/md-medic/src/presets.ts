export type PresetName = 'strict' | 'standard' | 'relaxed';

const strictConfig = `# Markdown Medic - Strict Preset
# Enforces the strictest markdown standards

# Extend base markdownlint rules
extends: null

# Default state for all rules
default: true

# Rule overrides
MD003:
  style: atx
MD004:
  style: dash
MD007:
  indent: 2
MD013:
  line_length: 80
  code_blocks: false
  tables: false
MD024:
  siblings_only: true
MD029:
  style: ordered
MD035:
  style: "---"
MD046:
  style: fenced
MD048:
  style: backtick
MD049:
  style: underscore
MD050:
  style: asterisk

# Custom rules can be added here
# customRules:
#   - rules/consistent-terminology.js

# Ignore patterns
ignores:
  - node_modules/**
  - .git/**
  - dist/**
  - build/**
  - coverage/**
  - "*.min.md"
`;

const standardConfig = `# Markdown Medic - Standard Preset
# Balanced rules for technical documentation

# Extend base markdownlint rules
extends: null

# Default state for all rules
default: true

# Rule overrides
MD003:
  style: atx
MD004:
  style: dash
MD007:
  indent: 2
MD013: false # Line length handled by prettier
MD024:
  siblings_only: true
MD029:
  style: ordered
MD033: false # Allow inline HTML
MD041: false # First line doesn't need to be heading
MD043: false # Required heading structure
MD046:
  style: fenced

# Ignore patterns
ignores:
  - node_modules/**
  - .git/**
  - dist/**
  - build/**
  - coverage/**
  - CHANGELOG.md
  - "*.min.md"
`;

const relaxedConfig = `# Markdown Medic - Relaxed Preset
# Minimal rules focusing on consistency

# Extend base markdownlint rules
extends: null

# Default state for all rules
default: false

# Enable specific rules
MD001: true # Heading levels increment
MD003: # Heading style
  style: atx
MD009: true # No trailing spaces
MD010: true # No hard tabs
MD011: true # Reversed link syntax
MD018: true # Space after hash on atx headings
MD022: true # Headings surrounded by blank lines
MD023: true # Headings start at beginning of line
MD025: true # Single top level heading
MD031: true # Fenced code blocks surrounded by blank lines
MD032: true # Lists surrounded by blank lines
MD040: true # Code blocks have language
MD042: true # No empty links
MD045: true # Images have alt text

# Ignore patterns
ignores:
  - node_modules/**
  - .git/**
  - dist/**
  - build/**
  - coverage/**
  - vendor/**
  - third_party/**
  - "*.generated.md"
`;

const presetConfigs: Record<PresetName, string> = {
  strict: strictConfig,
  standard: standardConfig,
  relaxed: relaxedConfig,
};

export function getPresetConfig(preset: PresetName): string {
  return presetConfigs[preset] || presetConfigs.standard;
}

// For backwards compatibility
export const presets = {
  strict: { name: 'strict', description: 'Strictest markdown standards' },
  standard: {
    name: 'standard',
    description: 'Balanced rules for technical docs',
  },
  relaxed: {
    name: 'relaxed',
    description: 'Minimal rules focusing on consistency',
  },
};
