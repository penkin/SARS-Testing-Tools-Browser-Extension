import { generateSAID } from './js/generators/sa-id.js';
import { generateIncomeTax } from './js/generators/income-tax.js';
import { generateCompanyReg } from './js/generators/company-reg.js';
import { generatePAYE } from './js/generators/paye.js';
import { generateUIF } from './js/generators/uif.js';
import { generateSDL } from './js/generators/sdl.js';
import { generateLabourUIF } from './js/generators/labour-uif.js';
import { copyToClipboard } from './js/utils/helpers.js';

// --- All-view state and helpers --------------------------------------------

const ALL_TYPES = ['sa-id', 'income-tax', 'company-reg', 'paye', 'uif', 'sdl', 'labour-uif'];

function allRow(type) {
  return document.querySelector(`.all-row[data-type="${type}"]`);
}

function setRowValue(type, value) {
  const row = allRow(type);
  if (!row) return;
  const valEl = row.querySelector('.all-row-value');
  valEl.textContent = value ?? '';
  const hasValue = Boolean(value);
  row.querySelector('.btn-row-copy').disabled = !hasValue;
  row.querySelector('.btn-row-paste').disabled = !hasValue;
}

function getRowValue(type) {
  const row = allRow(type);
  const text = row?.querySelector('.all-row-value').textContent ?? '';
  return text.trim() ? text : null;
}

function generateOne(type) {
  // Per-row generation in the All view always uses count: 1 and default filters.
  switch (type) {
    case 'sa-id':       return generateSAID({ count: 1 })[0];
    case 'income-tax':  return generateIncomeTax({ count: 1 })[0];
    case 'company-reg': return generateCompanyReg({ count: 1 })[0];
    case 'paye':        return generatePAYE({ count: 1 })[0];
    case 'uif':         return generateUIF({ count: 1 })[0];
    case 'sdl':         return generateSDL({ count: 1 })[0];
    case 'labour-uif':  return generateLabourUIF({ count: 1 })[0];
    default:            return null;
  }
}

/**
 * Generates a fresh PAYE/UIF/SDL triple that shares a 9-character body.
 * Updates all three rows in lock-step.
 */
function regenerateEmployerTriple() {
  const paye = generatePAYE({ count: 1 })[0];
  const body = paye.slice(1);
  setRowValue('paye', paye);
  setRowValue('uif', `U${body}`);
  setRowValue('sdl', `L${body}`);
}

function regenerateRow(type) {
  if (type === 'paye' || type === 'uif' || type === 'sdl') {
    regenerateEmployerTriple();
  } else {
    setRowValue(type, generateOne(type));
  }
}

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`panel-${tab.dataset.tab}`).classList.add('active');
  });
});

// Generate button handlers
document.querySelectorAll('.btn-generate').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.generator;
    const results = generate(type);
    renderResults(type, results);
  });
});

// --- All-view button handlers ----------------------------------------------

document.querySelectorAll('.all-row .btn-row-generate').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.closest('.all-row').dataset.type;
    regenerateRow(type);
  });
});

document.querySelectorAll('.all-row .btn-row-copy').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.closest('.all-row').dataset.type;
    const value = getRowValue(type);
    if (!value) return;
    copyToClipboard(value).then(() => flashCopied(btn));
  });
});

function generate(type) {
  switch (type) {
    case 'sa-id': {
      const specificDate = document.getElementById('said-specific-date').value;
      return generateSAID({
        yearFrom: Number(document.getElementById('said-year-from').value),
        yearTo: Number(document.getElementById('said-year-to').value),
        specificDate: specificDate || null,
        gender: document.getElementById('said-gender').value,
        citizenship: document.getElementById('said-citizenship').value,
        count: Number(document.getElementById('said-count').value),
      });
    }
    case 'income-tax':
      return generateIncomeTax({
        startDigit: document.getElementById('itax-start').value,
        count: Number(document.getElementById('itax-count').value),
      });
    case 'company-reg':
      return generateCompanyReg({
        yearFrom: Number(document.getElementById('creg-year-from').value),
        yearTo: Number(document.getElementById('creg-year-to').value),
        typeCode: document.getElementById('creg-type').value,
        count: Number(document.getElementById('creg-count').value),
      });
    case 'paye':
      return generatePAYE({
        startDigit: document.getElementById('paye-start').value,
        count: Number(document.getElementById('paye-count').value),
      });
    case 'uif':
      return generateUIF({
        count: Number(document.getElementById('uif-count').value),
      });
    case 'sdl':
      return generateSDL({
        count: Number(document.getElementById('sdl-count').value),
      });
    case 'labour-uif':
      return generateLabourUIF({
        count: Number(document.getElementById('luif-count').value),
      });
    default:
      return [];
  }
}

function renderResults(type, results) {
  const container = document.getElementById(`results-${type}`);
  if (!results.length) {
    container.innerHTML = '';
    return;
  }

  const header = document.createElement('div');
  header.className = 'results-header';
  header.innerHTML = `
    <span>${results.length} result${results.length > 1 ? 's' : ''}</span>
    <button class="btn-copy-all">Copy All</button>
  `;

  const list = document.createElement('div');
  list.className = 'results-list';

  results.forEach(value => {
    const item = document.createElement('div');
    item.className = 'result-item';
    item.innerHTML = `
      <span class="value">${value}</span>
      <button class="btn-copy">Copy</button>
    `;
    list.appendChild(item);
  });

  container.innerHTML = '';
  container.appendChild(header);
  container.appendChild(list);

  // Copy individual
  list.querySelectorAll('.btn-copy').forEach((btn, i) => {
    btn.addEventListener('click', () => {
      copyToClipboard(results[i]).then(() => flashCopied(btn));
    });
  });

  // Copy all
  header.querySelector('.btn-copy-all').addEventListener('click', () => {
    const allText = results.join('\n');
    copyToClipboard(allText).then(() => {
      flashCopied(header.querySelector('.btn-copy-all'));
    });
  });
}

function flashCopied(btn) {
  const original = btn.textContent;
  btn.textContent = 'Copied!';
  btn.classList.add('copied');
  setTimeout(() => {
    btn.textContent = original;
    btn.classList.remove('copied');
  }, 1200);
}
