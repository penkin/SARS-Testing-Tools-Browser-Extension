/**
 * SARS Modulus 10 check digit algorithm.
 * Matches the logic from Ejm.Application/Validation/TaxNumberAttribute.cs
 *
 * For a 9-digit payload, produces the 10th check digit.
 * Even-indexed positions (0-based) are doubled; if result > 9, subtract 9.
 * Sum all digits, check digit = (10 - sum % 10) % 10.
 */
export function sarsModulus10CheckDigit(digits) {
  const nums = digits.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < nums.length; i++) {
    let d = nums[i];
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return (10 - (sum % 10)) % 10;
}

export function validateSarsMod10(number) {
  const digits = String(number);
  const payload = digits.slice(0, -1);
  const check = Number(digits.slice(-1));
  return sarsModulus10CheckDigit(payload) === check;
}
