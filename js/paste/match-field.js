import { FIELD_KEYWORDS } from './field-keywords.js';

// This is the unit-tested mirror of the matching logic inlined inside
// `injectFill` in js/paste/paste-in-form.js. The two must stay in sync —
// the inlined copy exists because chrome.scripting.executeScript serializes
// the injected function and runs it in the page world, where extension
// module imports are unreachable.
export function matchFieldType(haystack) {
  if (!haystack) return null;
  const hay = haystack.toLowerCase();
  for (const [type, keywords] of FIELD_KEYWORDS) {
    for (const kw of keywords) {
      if (hay.includes(kw)) return type;
    }
  }
  return null;
}
