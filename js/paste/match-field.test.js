import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchFieldType } from './match-field.js';

test('matches SA ID from a clean label', () => {
  assert.equal(matchFieldType('ID number'), 'sa-id');
});

test('matches Labour UIF over plain UIF when both keywords could apply', () => {
  assert.equal(matchFieldType('Labour UIF number'), 'labour-uif');
});

test('matches plain UIF reference', () => {
  assert.equal(matchFieldType('UIF reference (UNNNNNNNNN)'), 'uif');
});

test('returns null when nothing matches', () => {
  assert.equal(matchFieldType('Email address'), null);
  assert.equal(matchFieldType(''), null);
});

test('is case-insensitive and ignores surrounding whitespace', () => {
  assert.equal(matchFieldType('  PAYE Reference  '), 'paye');
  assert.equal(matchFieldType('sdl'), 'sdl');
});
