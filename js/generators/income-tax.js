import { randomInt, padZero, randomChoice } from '../utils/helpers.js';
import { sarsModulus10CheckDigit } from '../utils/sars-modulus10.js';

/**
 * Income Tax Number: 10 digits
 *   Digit 1:   from {0, 1, 2, 3, 9}
 *   Digits 2-9: random
 *   Digit 10:  SARS Modulus 10 check digit
 */
const VALID_STARTS = [0, 1, 2, 3, 9];

export function generateIncomeTax(options = {}) {
  const { startDigit = 'any', count = 1 } = options;

  const results = [];
  for (let i = 0; i < count; i++) {
    const first = startDigit === 'any'
      ? randomChoice(VALID_STARTS)
      : Number(startDigit);

    let digits = String(first);
    for (let j = 0; j < 8; j++) {
      digits += randomInt(0, 9);
    }

    const checkDigit = sarsModulus10CheckDigit(digits);
    results.push(`${digits}${checkDigit}`);
  }
  return results;
}
