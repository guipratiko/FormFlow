import {
  bindMaskInput,
  maskCpfCnpjInput,
  maskCpfInput,
  maskCnpjInput,
  maskCurrencyInput,
  maskDateInput,
  maskPhoneInput,
  readFieldValue,
} from './masks.js';
import { buildAddressField, readAddressValue, addressValueForLogic } from './address-fields.js';
import { buildTermsField } from './terms-fields.js';

function getOptions(config) {
  const raw = config.options;
  if (!Array.isArray(raw) || raw.length === 0) {
    return [{ label: 'Opção 1', value: '1' }, { label: 'Opção 2', value: '2' }];
  }
  return raw.map((o, i) => {
    if (typeof o === 'string') return { label: o, value: o };
    return { label: String(o.label ?? o.value ?? `Opção ${i + 1}`), value: String(o.value ?? o.label ?? i) };
  });
}

function notifyRatingChange(row) {
  row.dispatchEvent(new Event('change', { bubbles: true }));
  row.dispatchEvent(new Event('input', { bubbles: true }));
}

function setToggleGroupValue(row, value, activeClass = 'active') {
  row.dataset.value = String(value);
  row.querySelectorAll('button').forEach((btn) => {
    const selected = btn.dataset.value === String(value);
    btn.classList.toggle(activeClass, selected);
    btn.setAttribute('aria-pressed', selected ? 'true' : 'false');
  });
  notifyRatingChange(row);
}

function initStarRow(row, maxStars = 5) {
  const buttons = row.querySelectorAll('button');
  const apply = (value) => {
    row.dataset.value = String(value);
    buttons.forEach((btn, idx) => {
      const filled = idx + 1 <= value;
      btn.classList.toggle('active', filled);
      btn.setAttribute('aria-pressed', filled ? 'true' : 'false');
    });
    notifyRatingChange(row);
  };

  buttons.forEach((btn, idx) => {
    btn.classList.add('ff-star-btn');
    btn.setAttribute('aria-label', `${idx + 1} de ${maxStars} estrelas`);
    btn.addEventListener('click', () => apply(idx + 1));
  });
}

function readRatingRowValue(node) {
  return (
    node.querySelector('[data-nps]')?.dataset.value
    || node.querySelector('[data-stars]')?.dataset.value
    || node.querySelector('[data-emoji]')?.dataset.value
    || node.querySelector('[data-scale]')?.dataset.value
    || ''
  );
}

function placeholderFor(field, config) {
  if (config.placeholder) return String(config.placeholder);
  const map = {
    date: 'DD/MM/AAAA',
    phone: '(62) 9 9999-9999',
    whatsapp: '(62) 9 9999-9999',
    cep: '00000-000',
    cnpj: '00.000.000/0000-00',
    cpf: '000.000.000-00',
    cpf_cnpj: '000.000.000-00',
    rg: '00.000.000-0',
    email: 'seu@email.com',
    url: 'https://',
    full_name: 'Seu nome completo',
    currency: config.currencyCode === 'USD' ? '$ 0.00' : 'R$ 0,00',
  };
  return map[field.type] || '';
}

export function fieldInput(field, slug) {
  const wrap = document.createElement('div');
  wrap.className = 'field form-group';
  wrap.dataset.fieldId = field.id;
  wrap.dataset.fieldType = field.type;

  const config = field.config || {};
  if (Object.keys(config).length > 0) wrap.dataset.fieldConfig = JSON.stringify(config);

  if (field.type === 'hidden' || field.type === 'utm_capture') {
    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = field.id;
    hidden.value = String(config.defaultValue || '');
    wrap.appendChild(hidden);
    wrap.style.display = 'none';
    return wrap;
  }

  const label = document.createElement('label');
  label.textContent = field.label;
  if (field.required) {
    const req = document.createElement('span');
    req.className = 'required';
    req.textContent = '*';
    label.appendChild(req);
  }
  wrap.appendChild(label);

  let input;

  if (field.type === 'long_text') {
    input = document.createElement('textarea');
    input.placeholder = placeholderFor(field, config);
  } else if (field.type === 'address') {
    buildAddressField(wrap, field, config);
    input = null;
  } else if (field.type === 'select') {
    input = document.createElement('select');
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = 'Selecione…';
    input.appendChild(empty);
    for (const opt of getOptions(config)) {
      const o = document.createElement('option');
      o.value = opt.value;
      o.textContent = opt.label;
      input.appendChild(o);
    }
  } else if (field.type === 'radio' || field.type === 'multi_select') {
    const group = document.createElement('div');
    group.className = field.type === 'radio' ? 'ff-radio-group' : 'ff-checkbox-group';
    for (const opt of getOptions(config)) {
      const row = document.createElement('label');
      row.className = field.type === 'radio' ? 'ff-radio-option' : 'ff-checkbox-option';
      const inp = document.createElement('input');
      inp.type = field.type === 'radio' ? 'radio' : 'checkbox';
      inp.name = field.id;
      inp.value = opt.value;
      row.appendChild(inp);
      row.appendChild(document.createTextNode(` ${opt.label}`));
      group.appendChild(row);
    }
    wrap.appendChild(group);
    input = null;
  } else if (field.type === 'terms_acceptance') {
    buildTermsField(wrap, field, config);
    input = null;
  } else if (field.type === 'checkbox') {
    input = document.createElement('input');
    input.type = 'checkbox';
  } else if (field.type === 'nps') {
    const row = document.createElement('div');
    row.className = 'ff-nps-row';
    for (let i = 0; i <= 10; i += 1) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ff-nps-btn';
      btn.textContent = String(i);
      btn.dataset.value = String(i);
      btn.addEventListener('click', () => {
        setToggleGroupValue(row, i, 'active');
      });
      row.appendChild(btn);
    }
    row.dataset.nps = '1';
    wrap.appendChild(row);
    input = null;
  } else if (field.type === 'stars') {
    const maxStars = Math.min(10, Math.max(1, Number(config.max ?? config.maxStars ?? 5) || 5));
    const row = document.createElement('div');
    row.className = 'ff-stars-row';
    row.setAttribute('role', 'radiogroup');
    for (let i = 1; i <= maxStars; i += 1) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = '★';
      btn.dataset.value = String(i);
      row.appendChild(btn);
    }
    row.dataset.stars = '1';
    initStarRow(row, maxStars);
    wrap.appendChild(row);
    input = null;
  } else if (field.type === 'emoji_rating') {
    const emojis = Array.isArray(config.emojis) ? config.emojis : ['😡', '😕', '😐', '🙂', '🤩'];
    const row = document.createElement('div');
    row.className = 'formflow-emoji-row';
    emojis.forEach((e, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'formflow-emoji-btn';
      btn.textContent = e;
      btn.dataset.value = String(i);
      btn.addEventListener('click', () => {
        setToggleGroupValue(row, i, 'active');
      });
      row.appendChild(btn);
    });
    row.dataset.emoji = '1';
    wrap.appendChild(row);
    input = null;
  } else if (field.type === 'scale') {
    const min = Number(config.min ?? 1);
    const max = Number(config.max ?? 5);
    const row = document.createElement('div');
    row.className = 'ff-scale-row';
    for (let i = min; i <= max; i += 1) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ff-scale-btn';
      btn.textContent = String(i);
      btn.dataset.value = String(i);
      btn.addEventListener('click', () => {
        setToggleGroupValue(row, i, 'active');
      });
      row.appendChild(btn);
    }
    row.dataset.scale = '1';
    wrap.appendChild(row);
    input = null;
  } else if (field.type === 'matrix') {
    const rows = Array.isArray(config.rows) ? config.rows : ['Linha 1'];
    const cols = Array.isArray(config.columns) ? config.columns : ['A', 'B'];
    const table = document.createElement('table');
    table.className = 'ff-matrix-table';
    const thead = document.createElement('thead');
    const hr = document.createElement('tr');
    hr.appendChild(document.createElement('th'));
    cols.forEach((c) => {
      const th = document.createElement('th');
      th.textContent = c;
      hr.appendChild(th);
    });
    thead.appendChild(hr);
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    rows.forEach((r) => {
      const tr = document.createElement('tr');
      const tdLabel = document.createElement('td');
      tdLabel.textContent = r;
      tr.appendChild(tdLabel);
      cols.forEach((c) => {
        const td = document.createElement('td');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `${field.id}-${r}`;
        radio.value = `${r}::${c}`;
        td.appendChild(radio);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    table.dataset.matrix = '1';
    wrap.appendChild(table);
    input = null;
  } else if (['image', 'file', 'document', 'video'].includes(field.type)) {
    if (config.mediaSource === 'url') {
      input = document.createElement('input');
      input.type = 'url';
      input.placeholder = config.placeholder || 'https://…';
      if (config.mediaUrl) input.value = config.mediaUrl;
    } else {
      input = document.createElement('input');
      input.type = 'file';
      input.accept = field.type === 'video' ? 'video/*' : field.type === 'image' ? 'image/*' : '*/*';
      input.dataset.upload = '1';
    }
  } else if (field.type === 'signature') {
    const box = document.createElement('div');
    box.className = 'signature-box';
    box.textContent = 'Assinatura (em breve)';
    wrap.appendChild(box);
    input = null;
  } else if (field.type === 'geolocation') {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'form-submit-btn';
    btn.textContent = '📍 Usar minha localização';
    btn.dataset.geo = '1';
    wrap.appendChild(btn);
    input = null;
  } else if (['date', 'cpf', 'cnpj', 'cpf_cnpj', 'currency', 'phone', 'whatsapp', 'cep', 'rg'].includes(field.type)) {
    input = document.createElement('input');
    input.type = 'tel';
    input.inputMode = field.type === 'phone' || field.type === 'whatsapp' ? 'tel' : 'numeric';
    input.placeholder = placeholderFor(field, config);
    bindMaskInput(input, field.type === 'whatsapp' ? 'phone' : field.type, config);
  } else {
    input = document.createElement('input');
    const typeMap = {
      email: 'email',
      number: 'number',
      url: 'url',
      password: 'password',
      password_confirm: 'password',
      time: 'time',
      datetime: 'datetime-local',
      percentage: 'number',
    };
    input.type = typeMap[field.type] || 'text';
    input.placeholder = placeholderFor(field, config);
  }

  if (input) {
    input.name = field.id;
    if (field.required && field.type !== 'checkbox') input.required = true;
    wrap.appendChild(input);
  }

  if (field.description) {
    const hint = document.createElement('p');
    hint.className = 'hint';
    hint.textContent = field.description;
    wrap.appendChild(hint);
  }

  return wrap;
}

export function readFieldNodeValue(node, slug, uploadFn) {
  const type = node.dataset.fieldType;
  const fieldId = node.dataset.fieldId;
  let config = {};
  try {
    config = JSON.parse(node.dataset.fieldConfig || '{}');
  } catch {
    config = {};
  }

  if (type === 'hidden' || type === 'utm_capture') {
    const hidden = node.querySelector('input[type="hidden"]');
    return { fieldId, value: hidden?.value || '' };
  }

  const nps = node.querySelector('[data-nps]');
  if (nps) return { fieldId, value: nps.dataset.value || '' };

  const stars = node.querySelector('[data-stars]');
  if (stars) return { fieldId, value: stars.dataset.value || '' };

  const emoji = node.querySelector('[data-emoji]');
  if (emoji) return { fieldId, value: emoji.dataset.value || '' };

  const scale = node.querySelector('[data-scale]');
  if (scale) return { fieldId, value: scale.dataset.value || '' };

  const matrix = node.querySelector('[data-matrix]');
  if (matrix) {
    const selected = matrix.querySelectorAll('input[type="radio"]:checked');
    const values = Array.from(selected).map((r) => r.value);
    return { fieldId, value: values.join('; ') };
  }

  const geo = node.querySelector('[data-geo]');
  if (geo) return { fieldId, value: geo.dataset.lat ? `${geo.dataset.lat},${geo.dataset.lng}` : '' };

  const addressGrid = node.querySelector('[data-address]');
  if (addressGrid) return { fieldId, value: readAddressValue(node) };

  const input = node.querySelector('input, textarea, select');
  if (!input) return { fieldId, value: '' };

  if (input.dataset.upload === '1' && input.files?.[0]) {
    return uploadFn(fieldId, input.files[0]);
  }
  if (input.dataset.upload === '1' && !input.files?.[0]) {
    return { fieldId, value: '' };
  }

  if (type === 'multi_select') {
    const checked = node.querySelectorAll('input[type="checkbox"]:checked');
    return { fieldId, value: Array.from(checked).map((c) => c.value).join(', ') };
  }

  if (type === 'radio') {
    const checked = node.querySelector('input[type="radio"]:checked');
    return { fieldId, value: checked ? checked.value : '' };
  }

  if (type === 'checkbox' || type === 'terms_acceptance') {
    const cb = node.querySelector('input[type="checkbox"]');
    return { fieldId, value: Boolean(cb?.checked) };
  }

  return { fieldId, value: readFieldValue(input, type, config) };
}

export function refreshFieldVisibility(formEl, fields) {
  const values = {};
  for (const node of formEl.querySelectorAll('[data-field-id]')) {
    const id = node.dataset.fieldId;
    if (node.dataset.fieldType === 'address') {
      values[id] = addressValueForLogic(node);
      continue;
    }
    const input = node.querySelector('input, textarea, select');
    if (input) {
      let config = {};
      try { config = JSON.parse(node.dataset.fieldConfig || '{}'); } catch { /* */ }
      values[id] = readFieldValue(input, node.dataset.fieldType, config);
    } else {
      values[id] = readRatingRowValue(node);
    }
  }
  const hidden = applyFieldLogic(fields, values);
  for (const node of formEl.querySelectorAll('[data-field-id]')) {
    if (node.dataset.fieldType === 'hidden') continue;
    node.style.display = hidden.has(node.dataset.fieldId) ? 'none' : '';
  }
}

export function applyFieldLogic(fields, values) {
  const hidden = new Set();
  for (const field of fields) {
    const rules = field.logic?.rules || [];
    for (const rule of rules) {
      const current = values[rule.when?.fieldId] ?? '';
      const target = rule.when?.value ?? '';
      let match = false;
      switch (rule.when?.operator) {
        case 'equals': match = current === target; break;
        case 'not_equals': match = current !== target; break;
        case 'contains': match = String(current).includes(target); break;
        case 'empty': match = !String(current).trim(); break;
        case 'not_empty': match = Boolean(String(current).trim()); break;
        default: break;
      }
      if (!match) continue;
      if (rule.then?.action === 'hide') hidden.add(field.id);
      if (rule.then?.action === 'show') hidden.delete(field.id);
    }
  }
  return hidden;
}
