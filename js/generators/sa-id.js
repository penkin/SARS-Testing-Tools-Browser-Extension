import { randomInt, padZero, randomDate } from '../utils/helpers.js';
import { luhnCheckDigit } from '../utils/luhn.js';

/**
 * SA ID: 13 digits — YYMMDDSSSSCAZ
 *   YYMMDD  = date of birth
 *   SSSS    = gender sequence (0000-4999 female, 5000-9999 male)
 *   C       = citizenship (0 = SA citizen, 1 = permanent resident)
 *   A       = 8 (obsolete, previously used for race)
 *   Z       = Luhn check digit over first 12
 */
export function generateSAID(options = {}) {
  const {
    yearFrom = 1950,
    yearTo = 2005,
    specificDate = null,
    gender = 'any',
    citizenship = 'citizen',
    count = 1,
  } = options;

  const results = [];
  for (let i = 0; i < count; i++) {
    let year, month, day;
    if (specificDate) {
      const d = new Date(specificDate);
      year = d.getFullYear();
      month = d.getMonth() + 1;
      day = d.getDate();
    } else {
      ({ year, month, day } = randomDate(yearFrom, yearTo));
    }

    const yy = padZero(year % 100, 2);
    const mm = padZero(month, 2);
    const dd = padZero(day, 2);

    let genderSeq;
    if (gender === 'female') {
      genderSeq = randomInt(0, 4999);
    } else if (gender === 'male') {
      genderSeq = randomInt(5000, 9999);
    } else {
      genderSeq = randomInt(0, 9999);
    }
    const ssss = padZero(genderSeq, 4);

    let c;
    if (citizenship === 'citizen') {
      c = '0';
    } else if (citizenship === 'resident') {
      c = '1';
    } else {
      c = randomInt(0, 1).toString();
    }

    const a = '8';

    const first12 = `${yy}${mm}${dd}${ssss}${c}${a}`;
    const checkDigit = luhnCheckDigit(first12);

    results.push(`${first12}${checkDigit}`);
  }
  return results;
}
