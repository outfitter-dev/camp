// Custom markdownlint rule for consistent terminology
// This is a CommonJS module for compatibility with markdownlint

module.exports = {
  names: ['MD100', 'consistent-terminology'],
  description: 'Terminology should be consistent',
  tags: ['terminology'],
  function: function rule(params, onError) {
    // Get terminology from config
    const config = params.config.terminology || [];
    if (!config.length) return;

    const lines = params.lines;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const lineNumber = lineIndex + 1;

      for (const term of config) {
        const regex = new RegExp(`\\b${escapeRegex(term.incorrect)}\\b`, 'gi');
        let match;

        while ((match = regex.exec(line)) !== null) {
          const matchedText = line.substring(
            match.index,
            match.index + match[0].length
          );

          // Skip if it's already correct
          if (matchedText === term.correct) continue;

          onError({
            lineNumber: lineNumber,
            detail: `Use "${term.correct}" instead of "${matchedText}"`,
            context: line.trim(),
            range: [match.index + 1, matchedText.length],
            fixInfo: {
              editColumn: match.index + 1,
              deleteCount: matchedText.length,
              insertText: preserveCase(matchedText, term.correct),
            },
          });
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
