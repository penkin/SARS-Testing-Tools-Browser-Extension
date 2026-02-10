import { randomInt, padZero, randomChoice } from '../utils/helpers.js';

/**
 * Company Registration Number: YYYY/NNNNNN/XX
 *   YYYY   = registration year
 *   NNNNNN = 6-digit sequence number
 *   XX     = type code
 * No check digit.
 */
export const TYPE_CODES = [
  { code: '06', label: '06 - External Company' },
  { code: '07', label: '07 - Pty Ltd' },
  { code: '08', label: '08 - Ltd (Public)' },
  { code: '09', label: '09 - Assoc. Not for Gain (S21)' },
  { code: '10', label: '10 - Close Corporation' },
  { code: '11', label: '11 - Foreign External Co.' },
  { code: '21', label: '21 - Inc. (S21 Co.)' },
  { code: '22', label: '22 - State-Owned' },
  { code: '23', label: '23 - Personal Liability (Inc)' },
  { code: '24', label: '24 - Co-operative' },
  { code: '25', label: '25 - Primary Co-operative' },
  { code: '26', label: '26 - Secondary Co-operative' },
  { code: '30', label: '30 - Conversion' },
  { code: '31', label: '31 - Domesticated' },
];

export function generateCompanyReg(options = {}) {
  const {
    yearFrom = 2000,
    yearTo = 2024,
    typeCode = 'any',
    count = 1,
  } = options;

  const results = [];
  for (let i = 0; i < count; i++) {
    const year = randomInt(yearFrom, yearTo);
    const seq = padZero(randomInt(0, 999999), 6);
    const code = typeCode === 'any'
      ? randomChoice(TYPE_CODES).code
      : typeCode;

    results.push(`${year}/${seq}/${code}`);
  }
  return results;
}
