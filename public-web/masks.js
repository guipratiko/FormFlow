/** Máscaras e formatação para formulário público FormFlow */

export function digitsOnly(value) {
  return String(value ?? '').replace(/\D/g, '');
}

export function maskDateInput(raw) {
  const d = digitsOnly(raw).slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

export function maskCpfInput(raw) {
  const d = digitsOnly(raw).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function maskCnpjInput(raw) {
  const d = digitsOnly(raw).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function maskCpfCnpjInput(raw) {
  const d = digitsOnly(raw);
  if (d.length <= 11) return maskCpfInput(d);
  return maskCnpjInput(d);
}

const CURRENCY_META = {
  BRL: { locale: 'pt-BR', currency: 'BRL', symbol: 'R$' },
  USD: { locale: 'en-US', currency: 'USD', symbol: '$' },
  EUR: { locale: 'de-DE', currency: 'EUR', symbol: '€' },
  GBP: { locale: 'en-GB', currency: 'GBP', symbol: '£' },
  ARS: { locale: 'es-AR', currency: 'ARS', symbol: '$' },
};

export function currencyMeta(code) {
  return CURRENCY_META[code] || CURRENCY_META.BRL;
}

export function maskCurrencyInput(raw, code = 'BRL') {
  const meta = currencyMeta(code);
  const digits = digitsOnly(raw);
  if (!digits) return '';
  const num = Number(digits) / 100;
  return new Intl.NumberFormat(meta.locale, {
    style: 'currency',
    currency: meta.currency,
    minimumFractionDigits: 2,
  }).format(num);
}

export function parseCurrencyValue(formatted, code = 'BRL') {
  const meta = currencyMeta(code);
  const digits = digitsOnly(formatted);
  if (!digits) return '';
  const amount = Number(digits) / 100;
  return { currency: meta.currency, amount };
}

export function maskPhoneInput(raw) {
  const d = digitsOnly(raw).slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function maskCepInput(raw) {
  const d = digitsOnly(raw).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function bindMaskInput(input, type, config = {}) {
  input.addEventListener('input', () => {
    const pos = input.selectionStart;
    const before = input.value;
    let next = before;
    if (type === 'date') next = maskDateInput(before);
    else if (type === 'phone') next = maskPhoneInput(before);
    else if (type === 'cpf') next = maskCpfInput(before);
    else if (type === 'cnpj') next = maskCnpjInput(before);
    else if (type === 'cpf_cnpj') next = maskCpfCnpjInput(before);
    else if (type === 'currency') next = maskCurrencyInput(before, config.currencyCode || 'BRL');
    else if (type === 'cep') next = maskCepInput(before);
    if (next !== before) {
      input.value = next;
      const delta = next.length - before.length;
      input.setSelectionRange(Math.max(0, (pos || 0) + delta), Math.max(0, (pos || 0) + delta));
    }
  });
}

export function readFieldValue(input, type, config = {}) {
  if (type === 'currency') {
    return parseCurrencyValue(input.value, config.currencyCode || 'BRL');
  }
  if (type === 'checkbox') return input.checked;
  return input.value;
}
