import { test } from 'node:test';
import assert from 'node:assert/strict';
import { labourUifCheckDigit, validateLabourUif } from './labour-uif-checksum.js';

test('labourUifCheckDigit matches worked example 1234567 -> 4', () => {
  assert.equal(labourUifCheckDigit('1234567'), 4);
});

test('labourUifCheckDigit handles all-zero payload', () => {
  assert.equal(labourUifCheckDigit('0000000'), 0);
});

test('labourUifCheckDigit is a single digit 0-9 for many random payloads', () => {
  for (let i = 0; i < 200; i++) {
    const payload = String(Math.floor(Math.random() * 10_000_000)).padStart(7, '0');
    const d = labourUifCheckDigit(payload);
    assert.ok(Number.isInteger(d) && d >= 0 && d <= 9, `bad check digit for ${payload}: ${d}`);
  }
});

test('validateLabourUif accepts 1234567/4 and rejects 1234567/5', () => {
  assert.equal(validateLabourUif('1234567/4'), true);
  assert.equal(validateLabourUif('1234567/5'), false);
});

test('validateLabourUif rejects malformed input', () => {
  assert.equal(validateLabourUif('12345674'), false);
  assert.equal(validateLabourUif('12345/4'), false);
  assert.equal(validateLabourUif('abcdefg/0'), false);
  assert.equal(validateLabourUif(''), false);
});
