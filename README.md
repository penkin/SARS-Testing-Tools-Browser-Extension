# SARS Testing Tools

A Chrome extension for generating valid South African tax-related reference numbers for QA testing — and pasting them straight into your test forms.

## What it does

Generates properly validated reference numbers for:

| Type | Format | Validation |
|------|--------|------------|
| **SA ID Number** | 13 digits (`YYMMDDSSSSCAZ`) | Luhn check digit |
| **Income Tax Number** | 10 digits, starts with 0/1/2/3/9 | SARS Modulus 10 |
| **Company Registration** | `YYYY/NNNNNN/XX` (14 type codes) | Format only |
| **PAYE Reference** | 10 digits, starts with 0/1/2/3/7/9 | SARS Modulus 10 (first digit → 4) |
| **UIF Reference (SARS)** | `U` + 9 digits | SARS Modulus 10 (prefix → 4) |
| **SDL Reference** | `L` + 9 digits | SARS Modulus 10 (prefix → 4) |
| **Labour UIF Number** | `NNNNNNN/N` | Weighted mod-11/mod-10 |

Each generator includes configurable filters (date ranges, gender, citizenship, starting digits, company type codes) and produces 1–25 numbers at a time with one-click copy.

## All view

The popup opens on an **All** tab that generates one of every type at once. Click **Regenerate All** to refresh the set, or **Paste All in form** to fill matching inputs on the active web page. In this view, PAYE / UIF / SDL share a common 9-character body so the three employer references stay consistent — useful when testing employer-registration forms that validate consistency across them.

## Paste in form

The **Paste All in form** and per-row **Paste** buttons fill matching inputs on the active tab. Matching uses label, placeholder, name, id, and aria-label keywords, with `Labour UIF` correctly disambiguated from plain `UIF`. The extension never overwrites fields you've already filled in, and it dispatches native `input` and `change` events so React, Vue, and Angular forms pick up the values. The popup reports which fields were filled and which weren't found. On restricted pages (`chrome://`, the Web Store, etc.) you get a friendly "couldn't paste" message rather than a silent failure.

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

### Firefox

Once published, install from [addons.mozilla.org](https://addons.mozilla.org). For local development, open `about:debugging#/runtime/this-firefox`, click **Load Temporary Add-on…**, and select `manifest.json` in the project folder. (Temporary add-ons are removed when Firefox restarts.)

## Usage

Click the extension icon to open the popup. The **All** tab is the default landing view — selecting any tab auto-generates fresh values for it. Use **Copy** to grab one value, **Copy All** to grab a batch, **Paste** / **Paste All in form** to fill matching fields on the page you're viewing.

## Permissions

- `clipboardWrite` — Copy and Copy All buttons.
- `activeTab` and `scripting` — used only when you click **Paste** or **Paste All in form**, and only against the tab you're currently viewing. No host permissions, no background scripts, no network calls.

## Project structure

```
├── manifest.json              # Chrome Extension Manifest V3
├── package.json               # node --test scaffolding (no runtime deps)
├── popup.html                 # Tabbed UI
├── popup.css                  # Styling
├── popup.js                   # Main controller + All-view + paste handlers
├── js/
│   ├── generators/
│   │   ├── sa-id.js
│   │   ├── income-tax.js
│   │   ├── company-reg.js
│   │   ├── paye.js
│   │   ├── uif.js
│   │   ├── sdl.js
│   │   └── labour-uif.js
│   ├── paste/
│   │   ├── field-keywords.js  # ordered keyword → type map
│   │   ├── match-field.js     # popup-side matcher (unit-tested mirror)
│   │   └── paste-in-form.js   # chrome.scripting wrapper + injected filler
│   └── utils/
│       ├── luhn.js
│       ├── sars-modulus10.js
│       ├── labour-uif-checksum.js
│       └── helpers.js
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

Generators, check-digit utilities, and the paste helpers ship with co-located `*.test.js` files.

## Testing

```sh
npm test
```

Runs the suite via Node's built-in `node --test` runner. No dependencies are installed — `package.json` only declares `"type": "module"` and the test script.

## Algorithms

### Luhn (SA ID)

Standard [Luhn algorithm](https://en.wikipedia.org/wiki/Luhn_algorithm). The 13th digit is the check digit computed over the first 12.

### SARS Modulus 10 (Income Tax, PAYE, UIF, SDL)

Digits at even indices (0-based) are doubled; if the result exceeds 9, subtract 9. All values are summed. The check digit is `(10 - sum % 10) % 10`.

For PAYE, UIF, and SDL the first character is substituted with `4` before computing the check digit.

### Weighted mod-11/mod-10 (Labour UIF)

The seven payload digits are multiplied by weights `[1, 2, 4, 5, 7, 8, 2]` respectively. Each product is reduced mod 11. The remainders are summed. The check digit is `sum mod 10`.

Worked example for `1234567`: products `1, 4, 12, 20, 35, 48, 14` → mod 11 `1, 4, 1, 9, 2, 4, 3` → sum `24` → `24 mod 10 = 4`, giving `1234567/4`.

## Releasing

1. Update `version` in `manifest.json`
2. Commit, tag, and push:
   ```sh
   git tag v1.x.x
   git push origin main --tags
   ```
3. The GitHub Actions workflow attaches a Chrome Web Store–ready zip to the GitHub Release and submits the **listed** add-on to [addons.mozilla.org](https://addons.mozilla.org) via `web-ext` (using the `AMO_JWT_ISSUER` / `AMO_JWT_SECRET` repository secrets). Both stores ship from the same `manifest.json`.

## Disclaimer

These numbers are **generated for testing purposes only**. They are structurally valid but do not correspond to real individuals or entities. Do not use them for fraud or misrepresentation.

## License

[MIT](LICENSE)
