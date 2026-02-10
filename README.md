# SARS Testing Tools

A Chrome extension for generating valid South African tax-related reference numbers for QA testing.

## What it does

Generates properly validated reference numbers for:

| Type | Format | Validation |
|------|--------|------------|
| **SA ID Number** | 13 digits (`YYMMDDSSSSCAZ`) | Luhn check digit |
| **Income Tax Number** | 10 digits, starts with 0/1/2/3/9 | SARS Modulus 10 |
| **Company Registration** | `YYYY/NNNNNN/XX` (14 type codes) | Format only |
| **PAYE Reference** | 10 digits, starts with 0/1/2/3/7/9 | SARS Modulus 10 (first digit → 4) |
| **UIF Reference** | `U` + 9 digits | SARS Modulus 10 (prefix → 4) |
| **SDL Reference** | `L` + 9 digits | SARS Modulus 10 (prefix → 4) |

Each generator includes configurable filters (date ranges, gender, citizenship, starting digits, company type codes) and produces 1–25 numbers at a time with one-click copy.

## Install

### From source

1. Clone this repo
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the project folder

### From release

1. Download the latest `.zip` from [Releases](../../releases)
2. Extract it
3. Load as unpacked extension (same steps as above)

## Usage

Click the extension icon in the toolbar to open the popup. Select a tab, configure filters, and click **Generate**. Use the **Copy** button on individual results or **Copy All** to grab everything.

## Project structure

```
├── manifest.json              # Chrome Extension Manifest V3
├── popup.html                 # Tabbed UI
├── popup.css                  # Styling
├── popup.js                   # Main controller
├── js/
│   ├── generators/
│   │   ├── sa-id.js           # SA ID number generator
│   │   ├── income-tax.js      # Income tax number generator
│   │   ├── company-reg.js     # Company registration number generator
│   │   ├── paye.js            # PAYE reference number generator
│   │   ├── uif.js             # UIF reference number generator
│   │   └── sdl.js             # SDL reference number generator
│   └── utils/
│       ├── luhn.js            # Luhn algorithm
│       ├── sars-modulus10.js  # SARS Modulus 10 algorithm
│       └── helpers.js         # Shared utilities
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Algorithms

### Luhn (SA ID)

Standard [Luhn algorithm](https://en.wikipedia.org/wiki/Luhn_algorithm). The 13th digit is the check digit computed over the first 12.

### SARS Modulus 10 (Tax numbers)

Digits at even indices (0-based) are doubled; if the result exceeds 9, subtract 9. All values are summed. The check digit is `(10 - sum % 10) % 10`.

For PAYE, UIF, and SDL the first character is substituted with `4` before computing the check digit.

## Releasing

1. Update `version` in `manifest.json`
2. Commit, tag, and push:
   ```sh
   git tag v1.x.x
   git push origin main --tags
   ```
3. The GitHub Actions workflow builds a Chrome Web Store–ready zip and attaches it to the release.

## Disclaimer

These numbers are **generated for testing purposes only**. They are structurally valid but do not correspond to real individuals or entities. Do not use them for fraud or misrepresentation.

## License

[MIT](LICENSE)
