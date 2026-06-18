# Firefox Support — Design

**Date:** 2026-06-17
**Status:** Approved (design phase)
**Topic:** Add Firefox compatibility to the SARS Testing Tools browser extension, distributed as a listed add-on on addons.mozilla.org (AMO).

## Goal

Make the existing Chrome MV3 extension load and run correctly in Firefox, and publish it as a **listed** add-on on AMO, **without introducing a build step, bundler, or runtime dependency**. The Chrome Web Store path stays exactly as it is today.

## Background / current state

- Manifest V3, popup-only extension. No background scripts, no content scripts.
- Permissions: `clipboardWrite`, `activeTab`, `scripting`.
- Vanilla JS loaded as ES modules; `node --test` unit suite for pure logic; no bundler/linter.
- The **only** code that touches extension (`chrome.*`) APIs is `js/paste/paste-in-form.js`:
  - `chrome.tabs.query({active:true, currentWindow:true})` — reads `tab.id` only.
  - `chrome.scripting.executeScript({target, func, args})` — injects `injectFill` into the active tab.
- All other browser interaction is standard web API: `navigator.clipboard.writeText` (`js/utils/helpers.js`). This already works identically in Firefox.
- Release is tag-driven via `.github/workflows/release.yml`: a version-check gate (tag must equal `manifest.json` version) followed by an explicit-allowlist zip uploaded to a GitHub Release for the Chrome Web Store.

This is a personal project (GitHub `penkin`, identity `chris@penkin.me`) — unrelated to any organisation.

## Key decisions

1. **Distribution:** Listed add-on on AMO (public, Mozilla-signed, auto-updating).
2. **Release automation:** CI auto-submits to AMO on a version tag (in addition to the existing Chrome zip).
3. **Manifest strategy:** A **single shared `manifest.json`**. Chrome provably ignores the `browser_specific_settings` key, so one manifest loads cleanly in both browsers and the "no build step" rule is preserved. (Rejected: per-browser manifests swapped at build time — would force a forbidden build step for no benefit.)
4. **Browser-API abstraction:** A **one-line feature-detect shim**, not `webextension-polyfill`. The polyfill would add a vendored file or a build step; only two API calls are involved and both return promises under `browser.*`. (Rejected: webextension-polyfill dependency.)

## Design

### 1. Manifest (`manifest.json`)

Add a Firefox-only block to the existing single manifest (Chrome ignores it):

```jsonc
"browser_specific_settings": {
  "gecko": {
    "id": "sars-testing-tools@penkin.me",
    "strict_min_version": "140.0",
    "data_collection_permissions": { "required": ["none"] }
  }
}
```

- **`id`** — required for AMO (Mozilla does not assign one). Email-style on the personal `penkin.me` domain; stable, unique, never user-visible.
- **`strict_min_version` `140.0`** — Firefox ESR that natively supports the `data_collection_permissions` consent key. Originally `115.0`, but `web-ext lint` flagged that the consent key is only supported from Firefox 140; the owner chose to raise the floor to 140 so the manifest is internally consistent and warning-free. Drops Firefox < 140.
- **`data_collection_permissions: { required: ["none"] }`** — declares the add-on collects no data (it doesn't); a recent AMO submission requirement, supported from Firefox 140.

No other manifest changes. `action`, `clipboardWrite`, `activeTab`, `scripting` are all supported in Firefox MV3.

### 2. Browser-API shim (`js/paste/paste-in-form.js`)

The only source-code change. Add at the top of the module:

```js
const ext = globalThis.browser ?? globalThis.chrome;
```

Then change the two calls:
- `chrome.tabs.query(...)` → `ext.tabs.query(...)`
- `chrome.scripting.executeScript(...)` → `ext.scripting.executeScript(...)`

Rationale: Firefox's `chrome.*` namespace is callback-based, so `await chrome.tabs.query(...)` would not work there; `browser.*` is promise-based. Preferring `browser` when present (Firefox) and falling back to `chrome` (Chrome, also promise-returning in MV3) makes both `await`s correct. The injected `injectFill` function runs in the page and uses only DOM APIs — no change. The existing comment referencing `chrome.scripting.executeScript` stays accurate.

### 3. CI / release (`.github/workflows/release.yml`)

On the same `v*` tag trigger, after the existing version-check:

- Keep the Chrome zip step **unchanged**.
- Add a **Firefox job/steps**:
  - `web-ext lint` over the repo (catches manifest/packaging issues early; fails the build on errors).
  - `web-ext submit --channel listed` (current command for listed submissions) using `--api-key`/`--api-secret` from **new GitHub repository secrets `AMO_JWT_ISSUER` and `AMO_JWT_SECRET`**.
  - An ignore configuration (`web-ext.config.mjs` with `ignoreFiles`, or `--ignore-files`) so the Firefox package excludes non-shipping files — mirroring what the Chrome allowlist already keeps out:
    - `**/*.test.js`, `test-fixture.html`, `package.json`, `.github/`, `docs/`, `CLAUDE.md`, `**/*.md`
  - `web-ext` is invoked via `npx`; no new committed dependency. (`package.json` already exists.)

The version-tag gate already guarantees `manifest.json` version == tag, which AMO also requires (each submitted version must be new).

### 4. Documentation

- **`CLAUDE.md`** — add: loading in Firefox via `about:debugging` → "Load Temporary Add-on"; the dual-store release flow; the `browser ?? chrome` shim quirk in the PAYE/UIF/SDL-adjacent paste code. Correct any stale tooling/permissions notes in the sections touched (the file predates `package.json`, the test files, and the `activeTab`/`scripting` permissions).
- **`README.md`** — add a Firefox install note alongside the Chrome instructions.

## Error handling / edge cases

- `tabs.query` reads only `tab.id`; no `tabs` host permission is needed in either browser. The existing `if (!tab?.id)` guard and the `{ matched, missed }` return contract are unchanged.
- A tag whose version already exists on AMO will fail the submit step — same discipline as the existing version gate.
- **First submission is manual:** the AMO listing and the `id` must be registered once via the AMO dashboard (or a first local `web-ext submit`) before CI auto-submit can succeed on later tags. Called out in the implementation plan.

## Testing / verification

- **Unit:** existing `node --test` suite stays green — no pure-logic files are touched.
- **Manual (Firefox):** load via `about:debugging` → "Load Temporary Add-on", verify each generator tab produces output and clipboard copy works, then exercise paste-in-form against `test-fixture.html`.
- **Manual (Chrome):** smoke-test that the added `browser_specific_settings` key produces no load error and the paste feature still works (regression check on the shim).
- **CI:** `web-ext lint` passes; a dry-run/first manual AMO submission confirms credentials and packaging before relying on tag-triggered auto-submit.

## Out of scope

- No change to generator logic, checksums, or the paste matcher.
- No bundler, transpiler, or runtime dependency.
- No new permissions or host permissions.
- Edge/other Chromium browsers (already covered by the Chrome build; no separate work).

## Files touched

| File | Change |
|------|--------|
| `manifest.json` | add `browser_specific_settings.gecko` block |
| `js/paste/paste-in-form.js` | add `ext` shim; 2 call-site renames |
| `.github/workflows/release.yml` | add Firefox lint + AMO submit job |
| `web-ext.config.mjs` (new) | ignore-list for the Firefox package |
| `CLAUDE.md`, `README.md` | Firefox loading + release docs |
