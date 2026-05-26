const WEIGHTS = [1, 2, 4, 5, 7, 8, 2];

export function labourUifCheckDigit(sevenDigits) {
  const nums = sevenDigits.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < WEIGHTS.length; i++) {
    sum += (nums[i] * WEIGHTS[i]) % 11;
  }
  return sum % 10;
}

export function validateLabourUif(value) {
  const m = /^(\d{7})\/(\d)$/.exec(value);
  if (!m) return false;
  return labourUifCheckDigit(m[1]) === Number(m[2]);
}
