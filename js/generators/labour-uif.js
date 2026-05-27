import { randomInt, padZero } from '../utils/helpers.js';
import { labourUifCheckDigit } from '../utils/labour-uif-checksum.js';

/**
 * Labour UIF number: NNNNNNN/N
 *   7-digit payload + slash + weighted mod-11/mod-10 check digit.
 */
export function generateLabourUIF(options = {}) {
  const { count = 1 } = options;
  const results = [];
  for (let i = 0; i < count; i++) {
    const payload = padZero(randomInt(0, 9_999_999), 7);
    const check = labourUifCheckDigit(payload);
    results.push(`${payload}/${check}`);
  }
  return results;
}
