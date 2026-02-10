export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function padZero(num, length) {
  return String(num).padStart(length, '0');
}

export function randomDate(yearFrom, yearTo) {
  const year = randomInt(yearFrom, yearTo);
  const month = randomInt(1, 12);
  const maxDay = new Date(year, month, 0).getDate();
  const day = randomInt(1, maxDay);
  return { year, month, day };
}

export function copyToClipboard(text) {
  return navigator.clipboard.writeText(text);
}

export function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
