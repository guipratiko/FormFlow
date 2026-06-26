import { bindMaskInput, digitsOnly } from './masks.js';

export const BR_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

export const ADDRESS_PARTS = [
  { key: 'cep', label: 'CEP', inputType: 'cep', width: 'full', autoComplete: 'postal-code' },
  { key: 'street', label: 'Rua', inputType: 'text', width: 'full', autoComplete: 'address-line1' },
  { key: 'number', label: 'Número', inputType: 'text', width: 'half' },
  { key: 'complement', label: 'Complemento', inputType: 'text', width: 'half', autoComplete: 'address-line2', optional: true },
  { key: 'neighborhood', label: 'Bairro', inputType: 'text', width: 'full', autoComplete: 'address-level3' },
  { key: 'city', label: 'Cidade', inputType: 'text', width: 'half', autoComplete: 'address-level2' },
  { key: 'state', label: 'Estado', inputType: 'state', width: 'half', autoComplete: 'address-level1' },
  { key: 'country', label: 'País', inputType: 'text', width: 'full', autoComplete: 'country-name', optional: true },
];

export const ADDRESS_PART_PLACEHOLDERS = {
  cep: '00000-000',
  street: 'Rua, avenida, travessa…',
  number: 'Nº 123',
  complement: 'Apto, bloco, sala…',
  neighborhood: 'Nome do bairro',
  city: 'Nome da cidade',
  country: 'Brasil',
};

export const ADDRESS_REQUIRED_KEYS = ['cep', 'street', 'number', 'neighborhood', 'city', 'state'];

function addressPartPlaceholder(part, config = {}) {
  const custom = config.placeholders?.[part.key];
  if (custom) return custom;
  if (part.key === 'country') return String(config.defaultCountry || ADDRESS_PART_PLACEHOLDERS.country);
  return ADDRESS_PART_PLACEHOLDERS[part.key] || '';
}

function addressConfig(config = {}) {
  return {
    autoLookup: config.autoLookup !== false,
    showCountry: config.showCountry === true,
    defaultCountry: String(config.defaultCountry || 'Brasil'),
  };
}

function visibleParts(config = {}) {
  const { showCountry } = addressConfig(config);
  return ADDRESS_PARTS.filter((part) => showCountry || part.key !== 'country');
}

async function lookupCep(cep) {
  const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.erro) return null;
  return data;
}

function setInputValue(grid, key, value) {
  const input = grid.querySelector(`[data-address-part="${key}"]`);
  if (input && value) input.value = value;
}

function bindCepLookup(cepInput, grid, config) {
  if (!addressConfig(config).autoLookup) return;

  let timer = null;
  cepInput.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const cep = digitsOnly(cepInput.value);
      if (cep.length !== 8) return;
      try {
        const data = await lookupCep(cep);
        if (!data) return;
        setInputValue(grid, 'street', data.logradouro || '');
        setInputValue(grid, 'neighborhood', data.bairro || '');
        setInputValue(grid, 'city', data.localidade || '');
        setInputValue(grid, 'state', data.uf || '');
      } catch {
        /* ignore lookup errors */
      }
    }, 400);
  });
}

export function buildAddressField(wrap, field, config = {}) {
  const grid = document.createElement('div');
  grid.className = 'ff-address-grid';
  grid.dataset.address = '1';

  for (const part of visibleParts(config)) {
    const cell = document.createElement('div');
    cell.className = part.width === 'half' ? 'ff-address-half' : 'ff-address-full';

    const partLabel = document.createElement('label');
    partLabel.className = 'ff-address-part-label';
    partLabel.textContent = part.label;
    cell.appendChild(partLabel);

    let input;
    if (part.inputType === 'state') {
      input = document.createElement('select');
      const empty = document.createElement('option');
      empty.value = '';
      empty.textContent = 'Selecione…';
      input.appendChild(empty);
      for (const uf of BR_STATES) {
        const opt = document.createElement('option');
        opt.value = uf;
        opt.textContent = uf;
        input.appendChild(opt);
      }
    } else {
      input = document.createElement('input');
      input.type = 'text';
      if (part.autoComplete) input.autocomplete = part.autoComplete;
      input.placeholder = addressPartPlaceholder(part, config);
    }

    input.dataset.addressPart = part.key;
    if (field.required && !part.optional) input.required = true;
    cell.appendChild(input);
    grid.appendChild(cell);

    if (part.inputType === 'cep') {
      bindMaskInput(input, 'cep', config);
      bindCepLookup(input, grid, config);
    }
  }

  wrap.appendChild(grid);
}

export function readAddressValue(node) {
  const grid = node.querySelector('[data-address]');
  if (!grid) return '';

  const value = {};
  for (const input of grid.querySelectorAll('[data-address-part]')) {
    const key = input.dataset.addressPart;
    value[key] = input.tagName === 'SELECT' ? input.value : input.value.trim();
  }
  return value;
}

export function addressValueForLogic(node) {
  const value = readAddressValue(node);
  if (!value || typeof value !== 'object') return '';
  return [value.cep, value.street, value.city, value.state].filter(Boolean).join(' ');
}
