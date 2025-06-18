import type { Config } from './config.js';

export const presets: Record<string, Config> = {
  strict: {
    rules: {
      // Line length
      'line-length': 80,
      
      // Headings
      'heading-style': 'atx',
      'no-trailing-punctuation': true,
      
      // Lists
      'list-marker-space': true,
      
      // HTML
      'no-inline-html': true,
      
      // Custom rules
      'no-dead-links': true,
      'consistent-terminology': true,
      'frontmatter-required': true,
      'toc-required': { minHeadings: 5 },
      'code-block-language': true,
      
      // Standard markdownlint rules
      'MD001': true, // heading levels should only increment by one
      'MD003': { style: 'atx' }, // heading style
      'MD004': { style: 'dash' }, // unordered list style
      'MD005': true, // list indentation
      'MD007': { indent: 2 }, // unordered list indentation
      'MD009': true, // no trailing spaces
      'MD010': true, // no hard tabs
      'MD011': true, // reversed link syntax
      'MD012': true, // no multiple blank lines
      'MD013': { line_length: 80 }, // line length
      'MD014': true, // dollar before command
      'MD018': true, // no space after hash on atx heading
      'MD019': true, // multiple spaces after hash
      'MD022': true, // headings surrounded by blank lines
      'MD023': true, // headings must start at beginning of line
      'MD024': true, // no duplicate headings
      'MD025': true, // single h1
      'MD026': true, // no trailing punctuation in headings
      'MD027': true, // multiple spaces after blockquote
      'MD028': true, // blank line inside blockquote
      'MD029': { style: 'ordered' }, // ordered list prefix
      'MD030': true, // spaces after list markers
      'MD031': true, // fenced code blocks surrounded by blank lines
      'MD032': true, // lists surrounded by blank lines
      'MD034': true, // no bare URLs
      'MD035': { style: '---' }, // horizontal rule style
      'MD036': true, // emphasis instead of headings
      'MD037': true, // no space in emphasis
      'MD038': true, // no space in code
      'MD039': true, // no space in links
      'MD040': true, // fenced code language
      'MD041': true, // first line should be top level heading
      'MD042': true, // no empty links
      'MD043': false, // required heading structure
      'MD044': false, // proper names should have correct capitalization
      'MD045': true, // no alt text on images
    },
    ignore: [
      'node_modules/**',
      '.git/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'CHANGELOG.md'
    ]
  },
  
  standard: {
    rules: {
      // Line length
      'line-length': 100,
      
      // Headings
      'heading-style': 'atx',
      'no-trailing-punctuation': true,
      
      // Lists
      'list-marker-space': true,
      
      // HTML (limited)
      'no-inline-html': false,
      
      // Custom rules
      'no-dead-links': true,
      'consistent-terminology': true,
      'code-block-language': true,
      
      // Standard markdownlint rules (subset)
      'MD001': true,
      'MD003': { style: 'atx' },
      'MD004': { style: 'dash' },
      'MD005': true,
      'MD007': { indent: 2 },
      'MD009': true,
      'MD010': true,
      'MD011': true,
      'MD012': { maximum: 2 },
      'MD013': false, // line length handled by custom rule
      'MD022': true,
      'MD023': true,
      'MD025': true,
      'MD026': true,
      'MD030': true,
      'MD031': true,
      'MD032': true,
      'MD034': true,
      'MD040': true,
      'MD042': true,
    },
    ignore: [
      'node_modules/**',
      '.git/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'CHANGELOG.md',
      '*.min.md'
    ]
  },
  
  relaxed: {
    rules: {
      // No line length limit
      'line-length': false,
      
      // Flexible headings
      'heading-style': 'atx',
      
      // HTML allowed
      'no-inline-html': false,
      
      // Custom rules (minimal)
      'no-dead-links': true,
      'code-block-language': true,
      
      // Minimal markdownlint rules
      'MD001': true,
      'MD009': true,
      'MD010': true,
      'MD011': true,
      'MD042': true,
    },
    ignore: [
      'node_modules/**',
      '.git/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'vendor/**',
      'third_party/**',
      '*.generated.md'
    ]
  }
};