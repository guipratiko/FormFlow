import { validateFields as validateFormFields } from './form-validation.js';

const SKIP_TYPES = new Set(['hidden', 'utm_capture']);

export function getVisibleFields(fields) {
  return (fields || []).filter((f) => !SKIP_TYPES.has(f.type));
}

export function buildFieldPages(fields, settings = {}, formLayout = 'single_page', steps = []) {
  const visible = getVisibleFields(fields);
  if (visible.length === 0) return [[]];

  const onePerPage = Boolean(
    settings.oneQuestionPerPage || settings.mode === 'typeform' || settings.mode === 'quiz'
  );

  if (!onePerPage && formLayout === 'single_page') {
    return [visible];
  }

  if (onePerPage) {
    return visible.map((f) => [f]);
  }

  if (formLayout === 'wizard') {
    if (steps.length > 0) {
      const sortedSteps = [...steps].sort((a, b) => a.orderIndex - b.orderIndex);
      const pages = [];
      const assigned = new Set();

      for (const step of sortedSteps) {
        const pageFields = visible.filter((f) => f.stepId === step.id);
        pageFields.forEach((f) => assigned.add(f.id));
        if (pageFields.length) pages.push(pageFields);
      }

      const unassigned = visible.filter((f) => !assigned.has(f.id));
      if (unassigned.length) pages.push(unassigned);
      if (pages.length) return pages;
    }

    const perPage = Math.max(1, Number(settings.fieldsPerPage) || 5);
    const pages = [];
    for (let i = 0; i < visible.length; i += perPage) {
      pages.push(visible.slice(i, i + perPage));
    }
    return pages.length ? pages : [visible];
  }

  if (formLayout === 'multi_step') {
    const perPage = Math.max(1, Number(settings.fieldsPerPage) || 5);
    const pages = [];
    for (let i = 0; i < visible.length; i += perPage) {
      pages.push(visible.slice(i, i + perPage));
    }
    return pages.length ? pages : [visible];
  }

  const perPage = Math.max(1, Number(settings.fieldsPerPage) || 5);
  const pages = [];
  for (let i = 0; i < visible.length; i += perPage) {
    pages.push(visible.slice(i, i + perPage));
  }
  return pages.length ? pages : [visible];
}

export function getPageStepTitle(pageFields, steps, pageIndex, formLayout) {
  if (formLayout !== 'wizard' || !steps.length) return null;
  const stepId = pageFields.find((f) => f.stepId)?.stepId;
  if (!stepId) return null;
  const step = steps.find((s) => s.id === stepId);
  return (step?.title || '').trim() || `Passo ${pageIndex + 1}`;
}

export function isFormPaginated(fields, settings, formLayout, steps) {
  return buildFieldPages(fields, settings, formLayout, steps || []).length > 1;
}

export function shouldShowProgressBar(progressBar, paginated) {
  return Boolean(progressBar || paginated);
}

export function progressBarWidth(progressBar, paginated, pageIndex, pageCount) {
  if (paginated && pageCount > 0) {
    return Math.round(((pageIndex + 1) / pageCount) * 100);
  }
  if (progressBar) return 100;
  return 0;
}

/**
 * Monta formulário paginado: campos ficam no DOM (para validação), páginas alternam visibilidade.
 */
export function initPaginatedForm({
  formEl,
  fields,
  settings,
  formLayout,
  steps,
  layoutSettings,
  onPageChange,
  stepTitleEl,
}) {
  const pages = buildFieldPages(fields, settings, formLayout, steps || []);
  const paginated = pages.length > 1;
  if (!paginated) {
    return {
      paginated: false,
      pageCount: 1,
      getCurrentPage: () => 0,
      goToPage: () => {},
      updateProgress: () => {},
      isLastPage: () => true,
      isFirstPage: () => true,
    };
  }

  const transition = layoutSettings?.pageTransition || 'fade';
  const pageNodes = [];

  for (let i = 0; i < pages.length; i += 1) {
    const pageWrap = document.createElement('div');
    pageWrap.className = `ff-form-page ff-form-page-${transition}`;
    pageWrap.dataset.pageIndex = String(i);
    pageWrap.style.display = i === 0 ? '' : 'none';
    if (i === 0) pageWrap.classList.add('ff-form-page-active');

    for (const field of pages[i]) {
      const node = formEl.querySelector(`[data-field-id="${field.id}"]`);
      if (node) pageWrap.appendChild(node);
    }
    formEl.insertBefore(pageWrap, formEl.firstChild);
    pageNodes.push(pageWrap);
  }

  let currentPage = 0;

  function updateStepTitle() {
    if (!stepTitleEl) return;
    const title = getPageStepTitle(pages[currentPage], steps || [], currentPage, formLayout);
    if (title) {
      stepTitleEl.textContent = title;
      stepTitleEl.hidden = false;
    } else {
      stepTitleEl.hidden = true;
    }
  }

  function updateProgress(progressBarEl) {
    if (!progressBarEl) return;
    const bar = progressBarEl.querySelector('.formflow-progress-bar');
    if (!bar) return;
    const pct = progressBarWidth(Boolean(settings.progressBar), true, currentPage, pages.length);
    bar.style.width = `${pct}%`;
  }

  function goToPage(index, progressBarEl) {
    if (index < 0 || index >= pages.length || index === currentPage) return;
    const prev = pageNodes[currentPage];
    const next = pageNodes[index];

    prev.classList.remove('ff-form-page-active');
    next.classList.add('ff-form-page-enter');
    next.style.display = '';

    if (transition === 'none') {
      prev.style.display = 'none';
      next.classList.add('ff-form-page-active');
      next.classList.remove('ff-form-page-enter');
    } else {
      requestAnimationFrame(() => {
        prev.style.display = 'none';
        next.classList.add('ff-form-page-active');
        next.classList.remove('ff-form-page-enter');
      });
    }

    currentPage = index;
    updateProgress(progressBarEl);
    updateStepTitle();
    if (onPageChange) onPageChange(currentPage, pages.length);
  }

  updateStepTitle();

  return {
    paginated: true,
    pageCount: pages.length,
    getCurrentPage: () => currentPage,
    goToPage,
    updateProgress,
    isLastPage: () => currentPage >= pages.length - 1,
    isFirstPage: () => currentPage <= 0,
  };
}

export function validateCurrentPage(formEl, fields) {
  if (!fields?.length) {
    const activePage = formEl.querySelector('.ff-form-page-active');
    if (!activePage) return { valid: formEl.checkValidity() };
    for (const input of activePage.querySelectorAll('input, textarea, select')) {
      if (input.required && !input.checkValidity()) {
        return {
          valid: false,
          fieldNode: input.closest('[data-field-id]'),
          message: input.validationMessage,
        };
      }
    }
    return { valid: true };
  }
  return validateFormFields(formEl, fields, { scope: 'activePage' });
}
