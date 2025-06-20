'use strict';

// src/utils/validation.ts
function isTerminologyConfig(value) {
  if (!Array.isArray(value)) {
    return false;
  }
  return value.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      'incorrect' in item &&
      'correct' in item &&
      typeof item.incorrect === 'string' &&
      typeof item.correct === 'string',
  );
}
function parseTerminologyConfig(value) {
  if (!value) {
    return [];
  }
  if (!isTerminologyConfig(value)) {
    console.warn('Invalid terminology configuration provided to consistent-terminology rule');
    return [];
  }
  return value;
}

// src/rules/consistent-terminology.ts
var consistentTerminology = {
  names: ['MD100', 'consistent-terminology'],
  description: 'Terminology should be consistent',
  tags: ['terminology'],
  function: (params, onError) => {
    console.log('consistent-terminology rule called');
    console.log('Config:', params.config);
    const config = parseTerminologyConfig(params.config.terminology);
    console.log('Parsed terminology config:', config);
    if (!config.length) return;
    const lines = params.lines;
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const lineNumber = lineIndex + 1;
      for (const term of config) {
        const regex = new RegExp(`\\b${escapeRegex(term.incorrect)}\\b`, 'gi');
        let match;
        while ((match = regex.exec(line)) !== null) {
          const matchedText = line.substring(match.index, match.index + match[0].length);
          if (matchedText === term.correct) continue;
          const errorInfo = {
            lineNumber,
            detail: `Use "${term.correct}" instead of "${matchedText}"`,
            context: line.trim(),
            range: [match.index + 1, matchedText.length],
            fixInfo: {
              editColumn: match.index + 1,
              deleteCount: matchedText.length,
              insertText: preserveCase(matchedText, term.correct),
            },
          };
          onError(errorInfo);
        }
      }
    }
  },
};
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function preserveCase(original, replacement) {
  if (original === original.toUpperCase()) {
    return replacement.toUpperCase();
  } else if (original[0] === original[0].toUpperCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1).toLowerCase();
  }
  return replacement;
}
module.exports = consistentTerminology;
