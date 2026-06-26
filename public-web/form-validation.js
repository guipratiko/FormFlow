import { readFieldNodeValue } from './fields-engine.js';

export function isEmptyAnswer(type, value) {
  if (value == null || value === '') return true;
  if (type === 'checkbox' || type === 'terms_acceptance') return value !== true;
  if (type === 'address') {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return true;
    const required = ['cep', 'street', 'number', 'neighborhood', 'city', 'state'];
    return required.some((key) => !String(value[key] ?? '').trim());
  }
  return false;
}

function readFieldValueSync(node) {
  const result = readFieldNodeValue(node, '', () => ({
    fieldId: node.dataset.fieldId,
    value: '',
  }));
  if (result instanceof Promise) {
    return { fieldId: node.dataset.fieldId, value: '' };
  }
  return result;
}

export function clearFormErrors(formEl) {
  formEl.querySelectorAll('.ff-field-error').forEach((el) => el.remove());
  formEl.querySelectorAll('.field-invalid').forEach((el) => el.classList.remove('field-invalid'));
  const banner = formEl.querySelector('.ff-form-error');
  if (banner) banner.remove();
}

function ensureFormErrorBanner(formEl) {
  let banner = formEl.querySelector('.ff-form-error');
  if (!banner) {
    banner = document.createElement('div');
    banner.className = 'ff-form-error';
    banner.setAttribute('role', 'alert');
    formEl.insertBefore(banner, formEl.firstChild);
  }
  return banner;
}

export function showFieldError(formEl, message, fieldNode) {
  clearFormErrors(formEl);
  const banner = ensureFormErrorBanner(formEl);
  banner.textContent = message;

  if (!fieldNode) return;

  fieldNode.classList.add('field-invalid');
  const err = document.createElement('p');
  err.className = 'ff-field-error';
  err.textContent = message;
  fieldNode.appendChild(err);
}

export function goToFieldNode(fieldNode, pagination, progressEl, syncNav) {
  if (!fieldNode) return;

  const page = fieldNode.closest('.ff-form-page');
  if (page && pagination?.paginated) {
    const idx = Number(page.dataset.pageIndex);
    if (!Number.isNaN(idx) && pagination.getCurrentPage() !== idx) {
      pagination.goToPage(idx, progressEl);
      syncNav?.();
    }
  }

  requestAnimationFrame(() => {
    fieldNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const focusable = fieldNode.querySelector(
      'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), textarea, select'
    );
    if (focusable) {
      focusable.focus({ preventScroll: true });
    } else {
      const cb = fieldNode.querySelector('input[type="checkbox"]');
      cb?.focus({ preventScroll: true });
    }
  });
}

export function presentValidationError(formEl, result, pagination, progressEl, syncNav) {
  showFieldError(formEl, result.message, result.fieldNode);
  goToFieldNode(result.fieldNode, pagination, progressEl, syncNav);
}

export function validateFields(formEl, fields, { scope = 'all' } = {}) {
  const activePage = scope === 'activePage' ? formEl.querySelector('.ff-form-page-active') : null;

  for (const field of fields) {
    if (field.type === 'hidden' || field.type === 'utm_capture') continue;
    if (!field.required) continue;

    const node = formEl.querySelector(`[data-field-id="${field.id}"]`);
    if (!node) continue;
    if (node.style.display === 'none') continue;
    if (activePage && !activePage.contains(node)) continue;

    const { value } = readFieldValueSync(node);
    if (isEmptyAnswer(field.type, value)) {
      return {
        valid: false,
        fieldId: field.id,
        message: `Campo obrigatório: ${field.label}`,
        fieldNode: node,
      };
    }
  }

  return { valid: true };
}

export function resolveServerFieldError(message, fields, formEl) {
  const text = String(message || '').trim();
  if (!text) return { message: 'Falha ao enviar', fieldNode: null };

  const requiredMatch = text.match(/^Campo obrigatório:\s*(.+)$/i);
  if (requiredMatch) {
    const label = requiredMatch[1].trim();
    const field = fields.find((f) => f.label === label);
    if (field) {
      return {
        fieldId: field.id,
        message: text,
        fieldNode: formEl.querySelector(`[data-field-id="${field.id}"]`),
      };
    }
  }

  for (const field of fields) {
    if (text.startsWith(`${field.label}:`)) {
      return {
        fieldId: field.id,
        message: text,
        fieldNode: formEl.querySelector(`[data-field-id="${field.id}"]`),
      };
    }
  }

  return { message: text, fieldNode: null };
}

export function validateCurrentPage(formEl, fields) {
  return validateFields(formEl, fields, { scope: 'activePage' });
}
