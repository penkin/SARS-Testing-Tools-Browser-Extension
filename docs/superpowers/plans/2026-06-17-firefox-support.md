# Firefox Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing Chrome MV3 popup extension load and run in Firefox and publish it as a listed add-on on addons.mozilla.org (AMO), with no build step, bundler, or runtime dependency.

**Architecture:** A single shared `manifest.json` (Chrome ignores Firefox's `browser_specific_settings` key) gains a Firefox `gecko` block. The only API-incompatible code — `js/paste/paste-in-form.js` — gets a one-line `browser ?? chrome` shim. The existing tag-driven GitHub Actions release workflow gains `web-ext` lint + AMO submit steps alongside the unchanged Chrome zip.

**Tech Stack:** Vanilla JS ES modules, Chrome/Firefox MV3 WebExtensions, `node --test`, GitHub Actions, `web-ext` (run via `npx`, not committed as a dependency).

**Reference spec:** `docs/superpowers/specs/2026-06-17-firefox-support-design.md`

**Branch:** Work happens on `feat/firefox-support` (already created; the design spec is committed there).

---

## File Structure

| File | Responsibility | Action |
|------|----------------|--------|
| `manifest.json` | Shared manifest for both stores; gains Firefox `gecko` block | Modify |
| `manifest.test.js` (new, repo root) | Regression test asserting the Firefox manifest block | Create |
| `js/paste/paste-in-form.js` | Active-tab paste; gains `browser ?? chrome` shim | Modify |
| `.github/workflows/release.yml` | Adds `web-ext` lint + AMO submit to the existing `build` job | Modify |
| `CLAUDE.md` | Firefox loading, dual-store release flow, shim quirk | Modify |
| `README.md` | Firefox install note | Modify |

No new runtime files and no new committed dependencies. `web-ext` is fetched on demand by `npx` in CI.

---

## Manual Prerequisites (account actions — the human, not the agent)

These are **not** code tasks and are not required to land the code changes below, but CI auto-submit (Task 4) cannot succeed until they are done. Do them in parallel with the code work.

- [ ] Create / sign in to an AMO developer account at https://addons.mozilla.org.
- [ ] Generate AMO API credentials (JWT issuer + secret) at https://addons.mozilla.org/developers/addon/api/key/.
- [ ] Add them as GitHub repository secrets named exactly **`AMO_JWT_ISSUER`** and **`AMO_JWT_SECRET`** (Settings → Secrets and variables → Actions).
- [ ] Perform the **first** AMO submission once, manually, to register the extension and its `id` (`sars-testing-tools@penkin.me`). Either upload a build via the AMO dashboard, or run locally after Task 3:
  `npx --yes web-ext@latest sign --channel listed --api-key "<issuer>" --api-secret "<secret>" --ignore-files "**/*.test.js" "test-fixture.html" "package.json" "docs/**" "**/*.md" ".github/**" "chrome-web-store-description.txt" "web-ext-artifacts/**"`

---

## Task 1: Add the Firefox manifest block

**Files:**
- Create: `manifest.test.js`
- Modify: `manifest.json`

- [ ] **Step 1: Write the failing test**

Create `manifest.test.js` at the repo root:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync(new URL('./manifest.json', import.meta.url)));

test('manifest is MV3', () => {
  assert.equal(manifest.manifest_version, 3);
});

test('manifest declares the Firefox gecko block for AMO', () => {
  const gecko = manifest.browser_specific_settings?.gecko;
  assert.ok(gecko, 'browser_specific_settings.gecko must exist');
  assert.equal(gecko.id, 'sars-testing-tools@penkin.me');
  assert.equal(gecko.strict_min_version, '115.0');
  assert.deepEqual(gecko.data_collection_permissions, { required: ['none'] });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test manifest.test.js`
Expected: FAIL — the "Firefox gecko block" test fails because `browser_specific_settings` does not yet exist (`gecko` is undefined).

- [ ] **Step 3: Add the block to `manifest.json`**

Add this top-level key to `manifest.json` (e.g. after the `icons` block; mind the trailing comma on the preceding key):

```json
  "browser_specific_settings": {
    "gecko": {
      "id": "sars-testing-tools@penkin.me",
      "strict_min_version": "115.0",
      "data_collection_permissions": { "required": ["none"] }
    }
  }
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test manifest.test.js`
Expected: PASS — both tests pass.

- [ ] **Step 5: Confirm the full suite still passes**

Run: `node --test`
Expected: PASS — 18 tests pass (the prior 16 plus the 2 new ones).

- [ ] **Step 6: Commit**

```bash
git add manifest.json manifest.test.js
git commit -m "feat: add Firefox browser_specific_settings to manifest"
```

---

## Task 2: Add the `browser ?? chrome` API shim

**Files:**
- Modify: `js/paste/paste-in-form.js`

The Firefox `chrome.*` namespace is callback-based, so `await chrome.tabs.query(...)` would not resolve there; `browser.*` is promise-based. Preferring `browser` when present, and falling back to `chrome` (promise-based in Chrome MV3), makes both `await`s correct in both browsers. This module is not unit-tested because it binds to extension-runtime globals that don't exist under `node`; verification is an import smoke-test plus manual browser loads in Task 5/verification.

- [ ] **Step 1: Add the shim constant**

In `js/paste/paste-in-form.js`, immediately after the existing import line:

```js
import { FIELD_KEYWORDS } from './field-keywords.js';
```

add:

```js
// Firefox exposes promise-based `browser.*`; Chrome exposes promise-based
// `chrome.*` (MV3) and no `browser`. Prefer `browser`, fall back to `chrome`.
const ext = globalThis.browser ?? globalThis.chrome;
```

- [ ] **Step 2: Rename the two call sites**

In `pasteIntoActiveTab`, change:

```js
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
```
to:
```js
  const [tab] = await ext.tabs.query({ active: true, currentWindow: true });
```

and change:

```js
  const [{ result } = {}] = await chrome.scripting.executeScript({
```
to:
```js
  const [{ result } = {}] = await ext.scripting.executeScript({
```

Leave the `injectFill` function and the `chrome.scripting.executeScript serializes…` comment unchanged — `injectFill` runs in the page using only DOM APIs, and the comment remains accurate.

- [ ] **Step 3: Smoke-test that the module still imports cleanly**

Run: `node -e "import('./js/paste/paste-in-form.js').then(() => console.log('import ok')).catch(e => { console.error(e); process.exit(1); })"`
Expected: prints `import ok` (no throw — confirms valid syntax and that the shim line doesn't crash at import when both globals are undefined).

- [ ] **Step 4: Confirm the full suite still passes**

Run: `node --test`
Expected: PASS — 18 tests pass.

- [ ] **Step 5: Commit**

```bash
git add js/paste/paste-in-form.js
git commit -m "feat: use browser/chrome API shim in paste-in-form for Firefox"
```

---

## Task 3: Verify the Firefox package contents with web-ext

No file changes — this task establishes the exact `--ignore-files` patterns the CI step (Task 4) will use, by building locally and inspecting the artifact. `web-ext` is run via `npx` and never committed.

- [ ] **Step 1: Lint the extension as Firefox sees it**

Run:
```bash
npx --yes web-ext@latest lint \
  --ignore-files "**/*.test.js" "test-fixture.html" "package.json" "docs/**" "**/*.md" ".github/**" "chrome-web-store-description.txt" "web-ext-artifacts/**"
```
Expected: completes with **0 errors**. Warnings are acceptable; errors are not. If `browser_specific_settings`/`data_collection_permissions` triggers an error, note it and stop — it means a manifest field needs adjusting before proceeding.

- [ ] **Step 2: Build the package and inspect its contents**

Run:
```bash
npx --yes web-ext@latest build --overwrite-dest \
  --ignore-files "**/*.test.js" "test-fixture.html" "package.json" "docs/**" "**/*.md" ".github/**" "chrome-web-store-description.txt" "web-ext-artifacts/**"
unzip -l web-ext-artifacts/*.zip
```
Expected: the listing **contains** `manifest.json`, `popup.html`, `popup.css`, `popup.js`, the `js/` tree (generators, paste, utils), and `icons/`; and **excludes** every `*.test.js`, `test-fixture.html`, `docs/`, `.github/`, `package.json`, `*.md`, and `chrome-web-store-description.txt`.

- [ ] **Step 3: If the listing is wrong, adjust patterns and rebuild**

`--ignore-files` uses minimatch globs relative to the repo root. If a file that should be excluded still appears (or a needed file is missing), add/correct the matching pattern and re-run Step 2 until the listing matches Step 2's expectation. Record the final, working pattern list — it is reused verbatim in Task 4.

- [ ] **Step 4: Clean up the local artifact (not committed)**

Run: `rm -rf web-ext-artifacts`
Expected: directory removed. (`*.zip` is already covered by `.gitignore`; nothing to commit in this task.)

---

## Task 4: Add Firefox lint + AMO submit to the release workflow

**Files:**
- Modify: `.github/workflows/release.yml`

Add steps to the **existing `build` job** (reusing its version-check gate) rather than a second job. Order: lint runs early to fail fast on a bad manifest; the AMO submit runs last, after the Chrome zip and GitHub Release.

- [ ] **Step 1: Add a `web-ext lint` step after the version-check step**

Insert this step immediately after the `Verify version matches tag` step and before `Build zip for Chrome Web Store`:

```yaml
      - name: Lint for Firefox (web-ext)
        run: |
          npx --yes web-ext@latest lint \
            --ignore-files "**/*.test.js" "test-fixture.html" "package.json" "docs/**" "**/*.md" ".github/**" "chrome-web-store-description.txt" "web-ext-artifacts/**"
```

- [ ] **Step 2: Add the AMO submit step at the end of the job**

Append this as the **last** step of the `build` job (after `Create GitHub Release`):

```yaml
      - name: Submit to AMO (Firefox listed)
        env:
          AMO_JWT_ISSUER: ${{ secrets.AMO_JWT_ISSUER }}
          AMO_JWT_SECRET: ${{ secrets.AMO_JWT_SECRET }}
        run: |
          npx --yes web-ext@latest sign \
            --channel listed \
            --api-key "$AMO_JWT_ISSUER" \
            --api-secret "$AMO_JWT_SECRET" \
            --ignore-files "**/*.test.js" "test-fixture.html" "package.json" "docs/**" "**/*.md" ".github/**" "chrome-web-store-description.txt" "web-ext-artifacts/**"
```

(If Task 3 produced a different working ignore-files list, use that exact list in both steps.)

- [ ] **Step 3: Validate the workflow YAML parses**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/release.yml')); print('yaml ok')"`
Expected: prints `yaml ok` (no exception).

- [ ] **Step 4: Re-read the workflow to confirm step order and gate**

Run: `cat .github/workflows/release.yml`
Expected (read, don't just run): the `Lint for Firefox` step sits after `Verify version matches tag`; the `Submit to AMO` step is the final step; the Chrome zip + `Create GitHub Release` steps are unchanged; `AMO_JWT_ISSUER`/`AMO_JWT_SECRET` are referenced via `secrets`.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "ci: lint and submit Firefox add-on to AMO on release tags"
```

---

## Task 5: Update documentation

**Files:**
- Modify: `CLAUDE.md`
- Modify: `README.md`

- [ ] **Step 1: Update `CLAUDE.md`**

In the **"Running locally"** subsection, after the Chrome unpacked-loading instructions, add a Firefox paragraph:

```markdown
**Firefox:** open `about:debugging#/runtime/this-firefox`, click **Load Temporary Add-on…**, and select `manifest.json` in the repo root. The add-on is removed when Firefox restarts; reload it the same way after edits.
```

In the **"Releasing"** section, note the dual-store flow — replace the single Chrome statement with:

```markdown
A version tag triggers `.github/workflows/release.yml`, which (1) zips the extension and attaches it to a GitHub Release for the Chrome Web Store, and (2) runs `web-ext lint` and submits the **listed** add-on to AMO using the `AMO_JWT_ISSUER` / `AMO_JWT_SECRET` repository secrets. Both stores ship from the same single `manifest.json`.
```

In the **"Manifest constraints"** section, add a sentence about cross-browser support:

```markdown
The manifest also carries `browser_specific_settings.gecko` (id `sars-testing-tools@penkin.me`, `strict_min_version` 115.0, no data collection) so the same file installs on Firefox — Chrome ignores this key. The only API-divergent code is `js/paste/paste-in-form.js`, which resolves `globalThis.browser ?? globalThis.chrome` into `ext` so its `tabs`/`scripting` calls return promises in both browsers; any new code touching extension APIs must do the same.
```

- [ ] **Step 2: Update `README.md`**

Find the Chrome install/loading instructions and add an adjacent Firefox note (match the surrounding heading style):

```markdown
### Firefox

Once published, install from [addons.mozilla.org](https://addons.mozilla.org). For local development, open `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on…** and select `manifest.json`.
```

- [ ] **Step 3: Confirm docs read correctly**

Run: `git diff --stat CLAUDE.md README.md`
Expected: both files show as modified. Re-read the two diffs to confirm the Firefox sections are coherent and consistent with the rest of each file.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md README.md
git commit -m "docs: document Firefox loading and dual-store release"
```

---

## Final verification (manual, before merge/release)

- [ ] `node --test` → 18 tests pass.
- [ ] `npx --yes web-ext@latest lint --ignore-files <final list>` → 0 errors.
- [ ] **Firefox load:** `about:debugging` → Load Temporary Add-on → `manifest.json`. Open the popup; verify each generator tab (SA ID, Income Tax, Company Reg, PAYE, UIF, SDL) produces output and the copy button works; then exercise paste-in-form against `test-fixture.html` (open it in a Firefox tab, trigger paste, confirm fields fill).
- [ ] **Chrome regression:** reload the unpacked extension in `chrome://extensions`; confirm no manifest load error from the new key and that generation + paste still work (validates the shim's `chrome` fallback).
- [ ] Manual prerequisites complete (AMO account, API secrets in GitHub, first manual submission registering the `id`) before pushing the first version tag that should auto-submit.

---

## Notes on TDD scope

The pure logic (generators, checksums, field matcher) is untouched, so its existing `node --test` coverage stays valid as a regression guard. The genuinely new, testable surface is the manifest shape (Task 1, unit-tested). The API shim and CI workflow bind to runtime environments (`browser`/`chrome` globals; GitHub Actions + AMO) that cannot be exercised under `node`, so they are verified by import smoke-test, YAML parse, `web-ext lint`, and the manual browser loads above — not by unit tests.
