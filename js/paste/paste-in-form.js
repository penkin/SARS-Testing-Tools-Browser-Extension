import { FIELD_KEYWORDS } from './field-keywords.js';

// Firefox exposes promise-based `browser.*`; Chrome exposes promise-based
// `chrome.*` (MV3) and no `browser`. Prefer `browser`, fall back to `chrome`.
const ext = globalThis.browser ?? globalThis.chrome;

/**
 * Pastes the supplied generated values into matching inputs on the active tab.
 *
 * @param {Object} values  Map of type-id (e.g. 'sa-id') to value string.
 * @returns {Promise<{matched: string[], missed: string[]}>}
 */
export async function pasteIntoActiveTab(values) {
  const [tab] = await ext.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return { matched: [], missed: Object.keys(values) };

  const [{ result } = {}] = await ext.scripting.executeScript({
    target: { tabId: tab.id },
    func: injectFill,
    args: [values, FIELD_KEYWORDS],
  });
  return result ?? { matched: [], missed: Object.keys(values) };
}

// Runs inside the target page. Must be self-contained — no imports.
// `matchType` below mirrors `matchFieldType` in ./match-field.js — the two
// implementations must stay in sync. The duplication is forced because
// chrome.scripting.executeScript serializes this function into the page,
// where extension module imports are unreachable.
function injectFill(values, fieldKeywords) {
  function haystackFor(input) {
    const bits = [];
    if (input.id) {
      const lab = document.querySelector(`label[for="${CSS.escape(input.id)}"]`);
      if (lab) bits.push(lab.innerText);
    }
    const wrappingLabel = input.closest('label');
    if (wrappingLabel) bits.push(wrappingLabel.innerText);
    if (input.getAttribute('aria-label')) bits.push(input.getAttribute('aria-label'));
    if (input.placeholder) bits.push(input.placeholder);
    if (input.name) bits.push(input.name);
    if (input.id) bits.push(input.id);
    return bits.join(' ').toLowerCase();
  }

  function matchType(haystack) {
    for (const [type, keywords] of fieldKeywords) {
      for (const kw of keywords) {
        if (haystack.includes(kw)) return type;
      }
    }
    return null;
  }

  function setValue(el, v) {
    const proto = el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    setter.call(el, v);
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  const inputs = Array.from(document.querySelectorAll('input, textarea'));
  const used = new Set();
  const matched = [];
  const missed = [];

  for (const [type, value] of Object.entries(values)) {
    const target = inputs.find(el => {
      if (used.has(el)) return false;
      if (el.disabled || el.readOnly) return false;
      if (el.value && el.value.trim() !== '') return false; // never clobber existing input
      return matchType(haystackFor(el)) === type;
    });
    if (target) {
      setValue(target, value);
      used.add(target);
      matched.push(type);
    } else {
      missed.push(type);
    }
  }
  return { matched, missed };
}
