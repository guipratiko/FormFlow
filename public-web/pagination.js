import { validateFields as validateFormFields } from './form-validation.js';

const SKIP_TYPES = new Set(['hidden', 'utm_capture']);

export function getVisibleFields(fields) {
  return (fields || []).filter((f) => !SKIP_TYPES.has(f.type));
}

function buildWizardStepPages(visible, steps) {
  if (!steps.length || !visible.length) return [];

  const sortedSteps = [...steps].sort((a, b) => a.orderIndex - b.orderIndex);
  const buckets = sortedSteps.map(() => []);
  const assigned = new Set();

  for (const field of visible) {
    if (!field.stepId) continue;
    const stepIndex = sortedSteps.findIndex((s) => s.id === field.stepId);
    if (stepIndex >= 0) {
      buckets[stepIndex].push(field);
      assigned.add(field.id);
    }
  }

  const unassigned = visible.filter((f) => !assigned.has(f.id));
  if (unassigned.length > 0) {
    const stepCount = sortedSteps.length;
    const perStep = Math.max(1, Math.ceil(unassigned.length / stepCount));
    for (let i = 0; i < unassigned.length; i++) {
      const stepIndex = Math.min(Math.floor(i / perStep), stepCount - 1);
      buckets[stepIndex].push(unassigned[i]);
    }
  }

  const pages = [];
  sortedSteps.forEach((step, index) => {
    if (buckets[index].length === 0) return;
    pages.push({
      fields: buckets[index],
      stepId: step.id,
      stepTitle: (step.title || '').trim() || `Passo ${index + 1}`,
    });
  });

  return pages;
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
      const wizardPages = buildWizardStepPages(visible, steps);
      if (wizardPages.length > 0) {
        return wizardPages.map((p) => p.fields);
      }
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

export function getPageStepTitle(pageFields, steps, pageIndex, formLayout, allFields) {
  if (formLayout !== 'wizard' || !steps.length) return null;

  if (allFields) {
    const wizardPages = buildWizardStepPages(getVisibleFields(allFields), steps);
    if (wizardPages[pageIndex]?.stepTitle) return wizardPages[pageIndex].stepTitle;
  }

  const stepId = pageFields.find((f) => f.stepId)?.stepId;
  if (stepId) {
    const step = steps.find((s) => s.id === stepId);
    if (step?.title?.trim()) return step.title.trim();
  }

  const sortedSteps = [...steps].sort((a, b) => a.orderIndex - b.orderIndex);
  const step = sortedSteps[pageIndex];
  return (step?.title || '').trim() || `Passo ${pageIndex + 1}`;
}

export function isFormPaginated(fields, settings, formLayout, steps) {
  return buildFieldPages(fields, settings, formLayout, steps || []).length > 1;
}

export function shouldShowProgressBar(progressBar) {
  return Boolean(progressBar);
}

export function progressBarWidth(progressBar, paginated, pageIndex, pageCount) {
  if (!progressBar) return 0;
  if (paginated && pageCount > 0) {
    return Math.round(((pageIndex + 1) / pageCount) * 100);
  }
  if (progressBar) return 100;
  return 0;
}

/**
 * Monta formulário paginado: campos ficam no DOM (para validação), páginas alternam visibilidade.
 */
function animatePageFields(pageEl) {
  if (!pageEl) return;
  pageEl.querySelectorAll('.field').forEach((field, i) => {
    field.style.setProperty('--ff-field-i', String(i));
    field.classList.remove('ff-field-animate');
    void field.offsetHeight;
    field.classList.add('ff-field-animate');
  });
}

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
    const title = getPageStepTitle(pages[currentPage], steps || [], currentPage, formLayout, fields);
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
    animatePageFields(next);
    if (onPageChange) onPageChange(currentPage, pages.length);
  }

  updateStepTitle();
  animatePageFields(pageNodes[0]);

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
