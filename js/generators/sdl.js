import { randomInt } from '../utils/helpers.js';
import { sarsModulus10CheckDigit } from '../utils/sars-modulus10.js';

/**
 * SDL Reference Number: L + 9 digits
 *   Prefix 'L' is treated as digit 4 for check digit calculation
 *   Digits 2-9: random
 *   Digit 10: SARS Modulus 10 check digit
 */
export function generateSDL(options = {}) {
  const { count = 1 } = options;

  const results = [];
  for (let i = 0; i < count; i++) {
    let middle = '';
    for (let j = 0; j < 8; j++) {
      middle += randomInt(0, 9);
    }

    // 'L' prefix is treated as digit 4 for check digit
    const checkPayload = '4' + middle;
    const checkDigit = sarsModulus10CheckDigit(checkPayload);

    results.push(`L${middle}${checkDigit}`);
  }
  return results;
}
