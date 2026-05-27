// Order matters: more-specific entries first. The matcher walks this list top-to-bottom
// and returns the first hit, so "Labour UIF number" must be tested before plain "UIF".
export const FIELD_KEYWORDS = [
  ['sa-id',       ['id number', 'sa id', 'identity number', 'national id']],
  ['labour-uif',  ['labour uif', 'department of labour', 'ui8', 'ui-8']],
  ['uif',         ['uif reference', 'uif ref', 'uif']],
  ['paye',        ['paye']],
  ['sdl',         ['sdl']],
  ['income-tax',  ['income tax', 'tax reference', 'tax number', 'itax']],
  ['company-reg', ['company reg', 'cipc', 'registration number']],
];
