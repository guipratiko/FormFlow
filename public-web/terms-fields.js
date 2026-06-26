function ensureTermsModal() {
  let overlay = document.getElementById('ff-terms-modal-root');
  if (overlay) return overlay;

  overlay = document.createElement('div');
  overlay.id = 'ff-terms-modal-root';
  overlay.className = 'ff-terms-modal-overlay';
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="ff-terms-modal" role="dialog" aria-modal="true" aria-labelledby="ff-terms-modal-title">
      <div class="ff-terms-modal-header">
        <span id="ff-terms-modal-title">Termos de uso</span>
        <button type="button" class="ff-terms-modal-close" aria-label="Fechar">×</button>
      </div>
      <div class="ff-terms-modal-body"></div>
      <div class="ff-terms-modal-footer" hidden></div>
    </div>
  `;

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeTermsModal();
  });
  overlay.querySelector('.ff-terms-modal-close')?.addEventListener('click', closeTermsModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.hidden) closeTermsModal();
  });

  document.body.appendChild(overlay);
  return overlay;
}

function closeTermsModal() {
  const overlay = document.getElementById('ff-terms-modal-root');
  if (overlay) overlay.hidden = true;
}

function openTermsModal(content, url) {
  const overlay = ensureTermsModal();
  const body = overlay.querySelector('.ff-terms-modal-body');
  const footer = overlay.querySelector('.ff-terms-modal-footer');
  if (body) body.textContent = content;
  if (footer) {
    footer.innerHTML = '';
    footer.hidden = !url;
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = 'Abrir em nova aba';
      footer.appendChild(a);
    }
  }
  overlay.hidden = false;
}

export function buildTermsField(wrap, field, config) {
  const content = String(config.termsContent || '').trim();
  const url = String(config.termsUrl || '').trim();
  const acceptText = String(config.termsText || 'Aceito os termos e condições');
  const readLinkText = String(config.termsLinkText || 'Ler Termos');
  const hasReadAction = Boolean(content || url);

  const topLabel = wrap.querySelector(':scope > label');
  if (topLabel) topLabel.remove();

  const row = document.createElement('label');
  row.className = 'ff-terms-row';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.name = field.id;
  if (field.required) input.required = true;

  const copy = document.createElement('span');
  copy.className = 'ff-terms-copy';

  const inline = document.createElement('span');
  inline.className = 'ff-terms-inline';

  const accept = document.createElement('span');
  accept.className = 'ff-terms-accept';
  accept.textContent = acceptText;
  inline.appendChild(accept);

  const sep = document.createElement('span');
  sep.className = 'ff-terms-sep';
  sep.textContent = ' · ';
  inline.appendChild(sep);

  if (hasReadAction) {
    const readBtn = document.createElement('button');
    readBtn.type = 'button';
    readBtn.className = 'ff-terms-read-link';
    readBtn.textContent = readLinkText;
    readBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (content) {
        openTermsModal(content, url);
      } else if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    });
    inline.appendChild(readBtn);
  } else {
    const disabled = document.createElement('span');
    disabled.className = 'ff-terms-read-link ff-terms-read-link--disabled';
    disabled.textContent = readLinkText;
    inline.appendChild(disabled);
  }

  copy.appendChild(inline);

  row.appendChild(input);
  row.appendChild(copy);
  wrap.appendChild(row);
}
