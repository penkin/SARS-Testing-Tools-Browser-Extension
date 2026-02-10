import { randomInt, randomChoice } from '../utils/helpers.js';
import { sarsModulus10CheckDigit } from '../utils/sars-modulus10.js';

/**
 * PAYE Reference Number: 10 digits
 *   Digit 1:   from {0, 1, 2, 3, 7, 9}
 *   Digits 2-9: random
 *   Digit 10:  SARS Modulus 10 check digit,
 *              computed with first digit replaced by 4
 */
const VALID_STARTS = [0, 1, 2, 3, 7, 9];

export function generatePAYE(options = {}) {
  const { startDigit = 'any', count = 1 } = options;

  const results = [];
  for (let i = 0; i < count; i++) {
    const first = startDigit === 'any'
      ? randomChoice(VALID_STARTS)
      : Number(startDigit);

    let middle = '';
    for (let j = 0; j < 8; j++) {
      middle += randomInt(0, 9);
    }

    // For check digit calculation, replace first digit with 4
    const checkPayload = '4' + middle;
    const checkDigit = sarsModulus10CheckDigit(checkPayload);

    results.push(`${first}${middle}${checkDigit}`);
  }
  return results;
}
