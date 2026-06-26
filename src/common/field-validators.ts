import { FormFieldType } from '@prisma/client';

const CPF_LEN = 11;
const CNPJ_LEN = 14;

export function digitsOnly(value: unknown): string {
  return String(value ?? '').replace(/\D/g, '');
}

function cpfCheckDigit(digits: string, factor: number): number {
  let sum = 0;
  for (let i = 0; i < digits.length; i += 1) {
    sum += Number(digits[i]) * (factor - i);
  }
  const mod = (sum * 10) % 11;
  return mod === 10 ? 0 : mod;
}

export function isValidCpf(value: unknown): boolean {
  const cpf = digitsOnly(value);
  if (cpf.length !== CPF_LEN || /^(\d)\1+$/.test(cpf)) return false;
  const d1 = cpfCheckDigit(cpf.slice(0, 9), 10);
  const d2 = cpfCheckDigit(cpf.slice(0, 10), 11);
  return d1 === Number(cpf[9]) && d2 === Number(cpf[10]);
}

function cnpjCheckDigit(digits: string, weights: number[]): number {
  let sum = 0;
  for (let i = 0; i < weights.length; i += 1) {
    sum += Number(digits[i]) * weights[i];
  }
  const mod = sum % 11;
  return mod < 2 ? 0 : 11 - mod;
}

export function isValidCnpj(value: unknown): boolean {
  const cnpj = digitsOnly(value);
  if (cnpj.length !== CNPJ_LEN || /^(\d)\1+$/.test(cnpj)) return false;
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d1 = cnpjCheckDigit(cnpj, w1);
  const d2 = cnpjCheckDigit(cnpj.slice(0, 12) + d1, w2);
  return d1 === Number(cnpj[12]) && d2 === Number(cnpj[13]);
}

export function isValidCpfOrCnpj(value: unknown): boolean {
  const digits = digitsOnly(value);
  if (digits.length === CPF_LEN) return isValidCpf(digits);
  if (digits.length === CNPJ_LEN) return isValidCnpj(digits);
  return false;
}

export function isValidBrDate(value: unknown): boolean {
  const raw = String(value ?? '').trim();
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
  if (!match) return false;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12 || day < 1) return false;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function isValidCurrency(value: unknown, _currencyCode?: string): boolean {
  if (value == null || value === '') return false;
  if (typeof value === 'number' && Number.isFinite(value)) return value >= 0;
  if (typeof value === 'object' && value !== null && 'amount' in value) {
    const amount = Number((value as { amount: unknown }).amount);
    return Number.isFinite(amount) && amount >= 0;
  }
  const normalized = String(value).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const num = Number(normalized);
  return Number.isFinite(num) && num >= 0;
}

export function validateFieldAnswer(
  type: FormFieldType,
  value: unknown,
  config: Record<string, unknown> = {}
): string | null {
  if (value == null || value === '') return null;

  switch (type) {
    case 'cpf':
      return isValidCpf(value) ? null : 'CPF inválido';
    case 'cnpj':
      return isValidCnpj(value) ? null : 'CNPJ inválido';
    case 'cpf_cnpj':
      return isValidCpfOrCnpj(value) ? null : 'CPF/CNPJ inválido';
    case 'date':
      return isValidBrDate(value) ? null : 'Data inválida (use DD/MM/AAAA)';
    case 'currency':
      return isValidCurrency(value, String(config.currencyCode || 'BRL'))
        ? null
        : 'Valor monetário inválido';
    case 'cep': {
      const cep = digitsOnly(value);
      return cep.length === 8 ? null : 'CEP inválido';
    }
    case 'address': {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return 'Endereço inválido';
      }
      const addr = value as Record<string, unknown>;
      const cep = digitsOnly(addr.cep);
      if (cep && cep.length !== 8) return 'CEP inválido';
      return null;
    }
    case 'percentage': {
      const num = Number(String(value).replace(',', '.'));
      const min = Number(config.min ?? 0);
      const max = Number(config.max ?? 100);
      return Number.isFinite(num) && num >= min && num <= max ? null : `Informe entre ${min}% e ${max}%`;
    }
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)) ? null : 'E-mail inválido';
    case 'url':
      try {
        new URL(String(value));
        return null;
      } catch {
        return 'URL inválida';
      }
    default:
      return null;
  }
}
