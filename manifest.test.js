import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync(new URL('./manifest.json', import.meta.url)));

test('manifest is MV3', () => {
  assert.equal(manifest.manifest_version, 3);
});

test('manifest declares the Firefox gecko block for AMO', () => {
  const gecko = manifest.browser_specific_settings?.gecko;
  assert.ok(gecko, 'browser_specific_settings.gecko must exist');
  assert.equal(gecko.id, 'sars-testing-tools@penkin.me');
  assert.equal(gecko.strict_min_version, '115.0');
  assert.deepEqual(gecko.data_collection_permissions, { required: ['none'] });
});
