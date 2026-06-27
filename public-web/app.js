import { fieldInput, readFieldNodeValue, refreshFieldVisibility, wireContentBlockButtons } from './fields-engine.js';
import { resolveFontFamily, resolveGoogleFont, resolveFontWeight } from './fonts-data.js';
import { initPaginatedForm, validateCurrentPage, isFormPaginated, shouldShowProgressBar, progressBarWidth } from './pagination.js';
import {
  clearFormErrors,
  validateFields,
  presentValidationError,
  resolveServerFieldError,
} from './form-validation.js';

const app = document.getElementById('app');

function getSlugFromPath() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  if (parts.length >= 2 && parts[0] === 'f') return decodeURIComponent(parts[1]);
  const last = parts[parts.length - 1];
  if (!last || last === 'index.html') return null;
  return decodeURIComponent(last);
}

function getBackendApiBase() {
  if (window.__FORMFLOW_BACKEND_API__) return window.__FORMFLOW_BACKEND_API__;
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    return 'http://localhost:4331/api';
  }
  const host = location.hostname.replace(/^forms\./, 'api.');
  return `${location.protocol}//${host}/api`;
}

function loadGoogleFont(google) {
  if (!google) return;
  const id = 'formflow-google-font';
  let link = document.getElementById(id);
  const href = `https://fonts.googleapis.com/css2?family=${google}&display=swap`;
  if (link) {
    if (link.href !== href) link.href = href;
    return;
  }
  link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

function buttonClassNames(ls = {}) {
  const parts = ['form-submit-btn'];
  parts.push(`ff-btn-style-${ls.buttonStyle || 'solid'}`);
  const effect = ls.buttonEffect || 'lift';
  if (effect !== 'none') parts.push(`ff-btn-effect-${effect}`);
  parts.push(`ff-btn-align-${ls.buttonAlign || 'stretch'}`);
  if (ls.buttonWidth === 'auto') parts.push('ff-btn-width-auto');
  return parts.join(' ');
}

function formBodyClassNames(ls = {}, mode) {
  const parts = ['form-body'];
  parts.push(`ff-content-align-${ls.contentAlign || 'center'}`);
  parts.push(`ff-field-align-${ls.fieldAlign || 'left'}`);
  parts.push(`ff-label-align-${ls.labelAlign || ls.fieldAlign || 'left'}`);
  if (ls.pageTransition && ls.pageTransition !== 'none') {
    parts.push(`ff-transition-${ls.pageTransition}`);
  }
  if (mode) parts.push(`ff-form-mode-${mode}`);
  return parts.join(' ');
}

function applyTypographyVars(root, prefix, typo) {
  if (!typo) return;
  if (typo.bold != null) {
    if (typo.bold) root.style.setProperty(`--ff-${prefix}-weight`, '700');
    else root.style.removeProperty(`--ff-${prefix}-weight`);
  }
  if (typo.italic != null) root.style.setProperty(`--ff-${prefix}-style`, typo.italic ? 'italic' : 'normal');
  if (typo.color) root.style.setProperty(`--ff-${prefix}-color`, typo.color);
  const bg = typo.backgroundColor;
  if (bg && bg !== 'transparent') {
    root.style.setProperty(`--ff-${prefix}-bg`, bg);
  } else {
    root.style.removeProperty(`--ff-${prefix}-bg`);
  }
}

function applyTheme(theme, layout) {
  const root = document.documentElement;
  const ls = layout || theme?.layoutSettings || {};
  const isDark = theme?.mode === 'dark';

  if (theme?.primaryColor) root.style.setProperty('--primary', theme.primaryColor);
  if (theme?.secondaryColor) {
    root.style.setProperty('--secondary', theme.secondaryColor);
    root.style.setProperty('--muted', theme.secondaryColor);
  }
  root.style.setProperty('--btn-color', ls.buttonColor || theme?.primaryColor || '#2563eb');
  root.style.setProperty('--btn-color-end', ls.buttonColorEnd || theme?.secondaryColor || '#64748b');
  if (ls.buttonTextColor) {
    root.style.setProperty('--btn-text-color', ls.buttonTextColor);
  } else {
    root.style.removeProperty('--btn-text-color');
  }

  if (theme?.backgroundColor) root.style.setProperty('--bg', theme.backgroundColor);
  if (ls.cardMaxWidth) root.style.setProperty('--card-max', `${ls.cardMaxWidth}px`);
  if (ls.borderRadius != null) root.style.setProperty('--radius', `${ls.borderRadius}px`);
  if (ls.boxShadow) root.style.setProperty('--shadow', ls.boxShadow);

  if (ls.cardBackgroundType === 'gradient' && ls.cardBackgroundGradient) {
    root.style.setProperty('--card', ls.cardBackgroundGradient);
  } else if (ls.cardBackgroundColor) {
    root.style.setProperty('--card', ls.cardBackgroundColor);
  } else if (isDark) {
    root.style.setProperty('--card', '#1e293b');
  } else {
    root.style.setProperty('--card', '#ffffff');
  }

  const fontKey = theme?.fontFamily || 'Inter';
  const fontGoogle = ls.fontGoogle ?? resolveGoogleFont(fontKey);
  const fontStack = ls.fontStack || resolveFontFamily(fontKey);
  const fontWeight = ls.fontWeight ?? resolveFontWeight(fontKey);
  loadGoogleFont(fontGoogle);
  document.body.style.fontFamily = fontStack;
  document.body.style.fontWeight = String(fontWeight);
  document.body.style.fontSynthesis = 'none';
  root.style.setProperty('--ff-body-weight', String(fontWeight));
  root.style.setProperty('font-family', fontStack);

  document.body.classList.toggle('dark', isDark);
  document.body.classList.remove('formflow-bg-image');
  document.body.style.background = '';
  document.body.style.backgroundImage = '';

  if (ls.backgroundType === 'gradient' && ls.backgroundGradient) {
    document.body.style.background = ls.backgroundGradient;
  } else if (ls.backgroundType === 'image') {
    const desktop = ls.backgroundImageUrlDesktop || ls.backgroundImageUrl || '';
    const tablet = ls.backgroundImageUrlTablet || desktop;
    const mobile = ls.backgroundImageUrlMobile || tablet;
    root.style.setProperty('--bg-image-desktop', desktop ? `url(${desktop})` : 'none');
    root.style.setProperty('--bg-image-tablet', tablet ? `url(${tablet})` : 'none');
    root.style.setProperty('--bg-image-mobile', mobile ? `url(${mobile})` : 'none');
    if (desktop || tablet || mobile) document.body.classList.add('formflow-bg-image');
  } else {
    document.body.style.background = isDark ? '#0f172a' : theme?.backgroundColor || '#f8fafc';
  }

  if (theme?.customCss?.trim()) {
    let el = document.getElementById('formflow-custom-css');
    if (!el) {
      el = document.createElement('style');
      el.id = 'formflow-custom-css';
      document.head.appendChild(el);
    }
    el.textContent = theme.customCss;
  } else {
    document.getElementById('formflow-custom-css')?.remove();
  }

  applyTypographyVars(root, 'title', ls.titleTypography);
  applyTypographyVars(root, 'desc', ls.descTypography);
  applyTypographyVars(root, 'label', ls.labelTypography);

  const logoMaxHeight = ls.logoMaxHeight ?? 64;
  const bannerMaxHeight = ls.bannerMaxHeight ?? 280;
  const headerVideoMaxHeight = ls.headerVideoMaxHeight ?? bannerMaxHeight;
  root.style.setProperty('--ff-logo-max-height', `${logoMaxHeight}px`);
  root.style.setProperty('--ff-banner-max-height', `${bannerMaxHeight}px`);
  root.style.setProperty('--ff-header-video-max-height', `${headerVideoMaxHeight}px`);
}

function extractYoutubeVideoId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('/')[0] || null;
    const fromQuery = u.searchParams.get('v');
    if (fromQuery) return fromQuery;
    const embed = u.pathname.match(/\/embed\/([^/?]+)/);
    if (embed) return embed[1];
  } catch {
    const m = url.match(/(?:youtu\.be\/|embed\/|v=)([A-Za-z0-9_-]{11})/);
    if (m) return m[1];
  }
  return null;
}

function toYoutubeEmbedAutoplayUrl(url) {
  const id = extractYoutubeVideoId(url);
  if (!id) return url.replace('watch?v=', 'embed/');
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    playsinline: '1',
    loop: '1',
    playlist: id,
    rel: '0',
    modestbranding: '1',
  });
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}

function setupCoverVideo(video) {
  video.muted = true;
  video.defaultMuted = true;
  video.autoplay = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.preload = 'auto';
  video.controls = false;
  video.addEventListener('mouseenter', () => {
    video.controls = true;
  });
  video.addEventListener('mouseleave', () => {
    video.controls = false;
  });
  const tryPlay = () => {
    video.play().catch(() => {});
  };
  video.addEventListener('loadeddata', tryPlay);
  tryPlay();
}

function renderMediaHeader(theme) {
  const wrap = document.createElement('div');
  wrap.className = 'form-media';
  if (theme?.logoUrl) {
    const img = document.createElement('img');
    img.className = 'form-logo';
    img.src = theme.logoUrl;
    img.alt = 'Logo';
    wrap.appendChild(img);
  }
  if (theme?.bannerUrl) {
    const img = document.createElement('img');
    img.className = 'form-banner';
    img.src = theme.bannerUrl;
    img.alt = '';
    wrap.appendChild(img);
  }
  if (theme?.headerVideoUrl) {
    const isYoutube = /youtube|youtu\.be/.test(theme.headerVideoUrl);
    const videoWrap = document.createElement('div');
    videoWrap.className = 'form-video-wrap';
    if (isYoutube) {
      const iframe = document.createElement('iframe');
      iframe.className = 'form-video';
      iframe.src = toYoutubeEmbedAutoplayUrl(theme.headerVideoUrl);
      iframe.allowFullscreen = true;
      iframe.allow = 'autoplay; fullscreen; picture-in-picture';
      iframe.title = 'Vídeo de capa';
      videoWrap.appendChild(iframe);
    } else {
      const video = document.createElement('video');
      video.className = 'form-video';
      video.src = theme.headerVideoUrl;
      setupCoverVideo(video);
      videoWrap.appendChild(video);
    }
    wrap.appendChild(videoWrap);
  }
  return wrap.childElementCount > 0 ? wrap : null;
}

async function uploadPublicFile(slug, file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${getBackendApiBase()}/public/form-flow/forms/${encodeURIComponent(slug)}/media`, {
    method: 'POST',
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Falha ao enviar');
  return data.data?.url || data.url;
}

async function collectAnswers(formEl, slug) {
  const answers = [];
  for (const node of formEl.querySelectorAll('[data-field-id]')) {
    const fieldType = node.dataset.fieldType;
    const hiddenByLogic = node.style.display === 'none';
    if (hiddenByLogic && fieldType !== 'hidden' && fieldType !== 'utm_capture') continue;

    const result = readFieldNodeValue(node, slug, async (_fieldId, file) => {
      const url = await uploadPublicFile(slug, file);
      return { fieldId: node.dataset.fieldId, value: url };
    });
    if (result instanceof Promise) {
      answers.push(await result);
    } else {
      answers.push(result);
    }
  }
  return answers;
}

function applyQuestionNumbers(formEl, fields, settings) {
  if (settings.showQuestionNumbers === false) return;
  let n = 0;
  for (const field of fields) {
    if (field.type === 'hidden' || field.type === 'utm_capture' || field.type === 'statement' || field.type === 'content_block') continue;
    n += 1;
    const wrap = formEl.querySelector(`[data-field-id="${field.id}"]`);
    if (!wrap) continue;
    const node = field.type === 'terms_acceptance'
      ? wrap.querySelector('.ff-terms-copy')
      : wrap.querySelector(':scope > label');
    if (!node || node.querySelector('.ff-question-number')) continue;
    const num = document.createElement('span');
    num.className = 'ff-question-number';
    num.textContent = `${n}. `;
    node.prepend(num);
  }
}

async function main() {
  const slug = getSlugFromPath();
  if (!slug) {
    app.innerHTML = '<div class="error">Slug do formulário não informado na URL.</div>';
    return;
  }

  const apiBase = window.location.origin;
  const sessionId = crypto.randomUUID();

  try {
    await fetch(`${apiBase}/api/public/forms/${encodeURIComponent(slug)}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });

    const res = await fetch(`${apiBase}/api/public/forms/${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error('Formulário indisponível');
    const form = await res.json();

    const layoutSettings = form.theme?.layoutSettings || {};
    applyTheme(form.theme, layoutSettings);

    const wrap = document.createElement('div');
    wrap.className = 'wrap';
    const card = document.createElement('div');
    card.className = 'card form-container';

    const mediaHeader = renderMediaHeader(form.theme);
    if (mediaHeader) card.appendChild(mediaHeader);

    const settings = form.settings || {};
    const screens = settings.screens || {};
    const fields = form.fields || [];

    const formBody = document.createElement('div');
    formBody.className = formBodyClassNames(layoutSettings, settings.mode);

    const h1 = document.createElement('h1');
    h1.textContent = form.title;
    formBody.appendChild(h1);

    if (form.description) {
      const p = document.createElement('p');
      p.className = 'desc';
      p.textContent = form.description;
      formBody.appendChild(p);
    }

    const stepTitleEl = document.createElement('h2');
    stepTitleEl.className = 'ff-step-title';
    stepTitleEl.hidden = true;
    formBody.appendChild(stepTitleEl);

    let progressEl = null;
    const paginatedPreview = isFormPaginated(fields, settings, form.layout, form.steps);
    const showProgress = shouldShowProgressBar(settings.progressBar);
    if (showProgress) {
      progressEl = document.createElement('div');
      progressEl.className = 'formflow-progress';
      const bar = document.createElement('div');
      bar.className = 'formflow-progress-bar';
      bar.style.width = `${progressBarWidth(Boolean(settings.progressBar), paginatedPreview, 0, 1)}%`;
      progressEl.appendChild(bar);
      formBody.appendChild(progressEl);
    }

    const formEl = document.createElement('form');
    for (const field of fields) {
      formEl.appendChild(fieldInput(field, slug));
    }

    applyQuestionNumbers(formEl, fields, settings);

    formEl.addEventListener('input', () => refreshFieldVisibility(formEl, fields));
    formEl.addEventListener('change', () => refreshFieldVisibility(formEl, fields));
    refreshFieldVisibility(formEl, fields);

    const pagination = initPaginatedForm({
      formEl,
      fields,
      settings,
      formLayout: form.layout || 'single_page',
      steps: form.steps || [],
      layoutSettings,
      stepTitleEl,
    });

    if (pagination.paginated) {
      pagination.updateProgress(progressEl);
    } else {
      formEl.querySelectorAll('.field').forEach((el, i) => {
        el.style.setProperty('--ff-field-i', String(i));
      });
      if (progressEl) {
        const bar = progressEl.querySelector('.formflow-progress-bar');
        if (bar) bar.style.width = '100%';
      }
    }

    const submitLabel = layoutSettings.submitLabel?.trim() || 'Enviar resposta';
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = buttonClassNames(layoutSettings);
    submitBtn.textContent = submitLabel;

    let prevBtn = null;
    let nextBtn = null;
    let pageIndicator = null;
    let syncNav = () => {};
    const navWrap = document.createElement('div');
    navWrap.className = 'ff-form-nav';

    const showValidationFailure = (result) => {
      presentValidationError(formEl, result, pagination, progressEl, syncNav);
    };

    if (pagination.paginated) {
      prevBtn = document.createElement('button');
      prevBtn.type = 'button';
      prevBtn.className = 'ff-nav-btn ff-nav-prev';
      prevBtn.textContent = 'Anterior';
      prevBtn.disabled = true;

      pageIndicator = document.createElement('span');
      pageIndicator.className = 'ff-page-indicator';
      pageIndicator.textContent = `1 / ${pagination.pageCount}`;

      nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.className = 'ff-nav-btn ff-nav-next';
      nextBtn.textContent = 'Próximo';

      navWrap.appendChild(prevBtn);
      navWrap.appendChild(pageIndicator);
      navWrap.appendChild(nextBtn);
      navWrap.appendChild(submitBtn);
      submitBtn.style.display = 'none';

      syncNav = () => {
        prevBtn.disabled = pagination.isFirstPage();
        const onLast = pagination.isLastPage();
        nextBtn.style.display = onLast ? 'none' : '';
        submitBtn.style.display = onLast ? '' : 'none';
        pageIndicator.textContent = `${pagination.getCurrentPage() + 1} / ${pagination.pageCount}`;
      };

      prevBtn.addEventListener('click', () => {
        clearFormErrors(formEl);
        pagination.goToPage(pagination.getCurrentPage() - 1, progressEl);
        syncNav();
      });

      nextBtn.addEventListener('click', () => {
        const result = validateCurrentPage(formEl, fields);
        if (!result.valid) {
          showValidationFailure(result);
          return;
        }
        clearFormErrors(formEl);
        pagination.goToPage(pagination.getCurrentPage() + 1, progressEl);
        syncNav();
      });

      formEl.appendChild(navWrap);
      syncNav();
    }

    wireContentBlockButtons(
      formEl,
      pagination,
      progressEl,
      syncNav,
      () => {
        const result = validateCurrentPage(formEl, fields);
        if (!result.valid) showValidationFailure(result);
        return result;
      }
    );

    if (!pagination.paginated) {
      formEl.appendChild(submitBtn);
    }

    formEl.addEventListener('input', () => clearFormErrors(formEl));
    formEl.addEventListener('change', () => clearFormErrors(formEl));

    formEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (pagination.paginated && !pagination.isLastPage()) {
        const result = validateCurrentPage(formEl, fields);
        if (!result.valid) {
          showValidationFailure(result);
          return;
        }
        clearFormErrors(formEl);
        pagination.goToPage(pagination.getCurrentPage() + 1, progressEl);
        if (pageIndicator) {
          pageIndicator.textContent = `${pagination.getCurrentPage() + 1} / ${pagination.pageCount}`;
        }
        if (prevBtn) prevBtn.disabled = pagination.isFirstPage();
        if (nextBtn) nextBtn.style.display = pagination.isLastPage() ? 'none' : '';
        submitBtn.style.display = pagination.isLastPage() ? '' : 'none';
        return;
      }

      const validation = validateFields(formEl, fields);
      if (!validation.valid) {
        showValidationFailure(validation);
        return;
      }
      clearFormErrors(formEl);

      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando…';
      try {
        const answers = await collectAnswers(formEl, slug);
        const submitRes = await fetch(`${apiBase}/api/public/forms/${encodeURIComponent(slug)}/responses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, answers }),
        });
        if (!submitRes.ok) {
          const err = await submitRes.json().catch(() => ({}));
          const msg = err.message;
          const text = Array.isArray(msg) ? msg.join('; ') : msg || 'Falha ao enviar';
          throw new Error(text);
        }
        const thankTitle = screens.thankYou?.title || 'Obrigado!';
        const thankBody = screens.thankYou?.body || 'Sua resposta foi registrada.';
        const redirect = settings.publication?.redirectUrl;
        if (redirect) {
          window.location.href = redirect;
          return;
        }
        wrap.innerHTML = `<div class="success card formflow-screen"><h2>${thankTitle}</h2><p>${thankBody}</p></div>`;
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = submitLabel;
        const parsed = resolveServerFieldError(err.message, fields, formEl);
        showValidationFailure(parsed);
      }
    });

    formBody.appendChild(formEl);
    card.appendChild(formBody);
    wrap.appendChild(card);
    app.innerHTML = '';
    app.appendChild(wrap);
  } catch (error) {
    app.innerHTML = `<div class="error">${error.message || 'Erro ao carregar formulário'}</div>`;
  }
}

main();
