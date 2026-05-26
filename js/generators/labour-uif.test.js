import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateLabourUIF } from './labour-uif.js';
import { validateLabourUif } from '../utils/labour-uif-checksum.js';

const FORMAT = /^\d{7}\/\d$/;

test('generateLabourUIF returns the requested count', () => {
  assert.equal(generateLabourUIF({ count: 5 }).length, 5);
});

test('generateLabourUIF defaults to count 1', () => {
  assert.equal(generateLabourUIF().length, 1);
});

test('generateLabourUIF emits NNNNNNN/N format with valid check digit', () => {
  for (const v of generateLabourUIF({ count: 100 })) {
    assert.match(v, FORMAT, `bad format: ${v}`);
    assert.equal(validateLabourUif(v), true, `bad check digit: ${v}`);
  }
});
