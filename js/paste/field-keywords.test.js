import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FIELD_KEYWORDS } from './field-keywords.js';

test('FIELD_KEYWORDS lists labour-uif before uif so disambiguation works', () => {
  const types = FIELD_KEYWORDS.map(([type]) => type);
  assert.ok(
    types.indexOf('labour-uif') < types.indexOf('uif'),
    'labour-uif must come before uif',
  );
});

test('FIELD_KEYWORDS covers every generator type', () => {
  const types = new Set(FIELD_KEYWORDS.map(([type]) => type));
  for (const t of ['sa-id', 'income-tax', 'company-reg', 'paye', 'uif', 'sdl', 'labour-uif']) {
    assert.ok(types.has(t), `missing keyword entry for ${t}`);
  }
});

test('keyword entries are non-empty lowercase strings', () => {
  for (const [type, keywords] of FIELD_KEYWORDS) {
    assert.ok(keywords.length > 0, `${type} has no keywords`);
    for (const kw of keywords) {
      assert.equal(kw, kw.toLowerCase(), `${type} keyword "${kw}" must be lowercase`);
    }
  }
});
