export function luhnCheckDigit(digits) {
  const nums = digits.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < nums.length; i++) {
    let d = nums[nums.length - 1 - i];
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return (10 - (sum % 10)) % 10;
}

export function validateLuhn(number) {
  const digits = String(number);
  const payload = digits.slice(0, -1);
  const check = Number(digits.slice(-1));
  return luhnCheckDigit(payload) === check;
}
