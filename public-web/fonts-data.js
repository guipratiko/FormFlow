/** Espelho do catálogo de fontes do editor — usado no formulário público. */
export const FORM_FLOW_FONTS = [
  { value: 'system', stack: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', google: null },
  { value: 'SF Pro Display', stack: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', google: null },
  { value: 'SF Pro Text', stack: '"SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', google: null },
  { value: 'SF Mono', stack: '"SF Mono", ui-monospace, Menlo, Monaco, monospace', google: null },
  { value: 'Inter', stack: '"Inter", system-ui, sans-serif', google: 'Inter:wght@400;500;600;700' },
  { value: 'Roboto', stack: '"Roboto", system-ui, sans-serif', google: 'Roboto:wght@400;500;700' },
  { value: 'Open Sans', stack: '"Open Sans", system-ui, sans-serif', google: 'Open+Sans:wght@400;600;700' },
  { value: 'Lato', stack: '"Lato", system-ui, sans-serif', google: 'Lato:wght@400;700' },
  { value: 'Montserrat', stack: '"Montserrat", system-ui, sans-serif', google: 'Montserrat:wght@400;600;700' },
  { value: 'Poppins', stack: '"Poppins", system-ui, sans-serif', google: 'Poppins:wght@400;600;700' },
  { value: 'Nunito', stack: '"Nunito", system-ui, sans-serif', google: 'Nunito:wght@400;600;700' },
  { value: 'Raleway', stack: '"Raleway", system-ui, sans-serif', google: 'Raleway:wght@400;600;700' },
  { value: 'Rubik', stack: '"Rubik", system-ui, sans-serif', google: 'Rubik:wght@400;500;700' },
  { value: 'Work Sans', stack: '"Work Sans", system-ui, sans-serif', google: 'Work+Sans:wght@400;500;700' },
  { value: 'DM Sans', stack: '"DM Sans", system-ui, sans-serif', google: 'DM+Sans:wght@400;500;700' },
  { value: 'Manrope', stack: '"Manrope", system-ui, sans-serif', google: 'Manrope:wght@400;600;700' },
  { value: 'Outfit', stack: '"Outfit", system-ui, sans-serif', google: 'Outfit:wght@400;600;700' },
  { value: 'Sora', stack: '"Sora", system-ui, sans-serif', google: 'Sora:wght@400;600;700' },
  { value: 'Space Grotesk', stack: '"Space Grotesk", system-ui, sans-serif', google: 'Space+Grotesk:wght@400;500;700' },
  { value: 'IBM Plex Sans', stack: '"IBM Plex Sans", system-ui, sans-serif', google: 'IBM+Plex+Sans:wght@400;500;700' },
  { value: 'Lexend', stack: '"Lexend", system-ui, sans-serif', google: 'Lexend:wght@400;600;700' },
  { value: 'Source Sans 3', stack: '"Source Sans 3", system-ui, sans-serif', google: 'Source+Sans+3:wght@400;600;700' },
  { value: 'Noto Sans', stack: '"Noto Sans", system-ui, sans-serif', google: 'Noto+Sans:wght@400;600;700' },
  { value: 'Fira Sans', stack: '"Fira Sans", system-ui, sans-serif', google: 'Fira+Sans:wght@400;500;700' },
  { value: 'Josefin Sans', stack: '"Josefin Sans", system-ui, sans-serif', google: 'Josefin+Sans:wght@400;600;700' },
  { value: 'Archivo', stack: '"Archivo", system-ui, sans-serif', google: 'Archivo:wght@400;600;700' },
  { value: 'Ubuntu', stack: '"Ubuntu", system-ui, sans-serif', google: 'Ubuntu:wght@400;500;700' },
  { value: 'Oswald', stack: '"Oswald", system-ui, sans-serif', google: 'Oswald:wght@400;600;700' },
  { value: 'Playfair Display', stack: '"Playfair Display", Georgia, serif', google: 'Playfair+Display:wght@400;600;700' },
  { value: 'Merriweather', stack: '"Merriweather", Georgia, serif', google: 'Merriweather:wght@400;700' },
  { value: 'Lora', stack: '"Lora", Georgia, serif', google: 'Lora:wght@400;600;700' },
  { value: 'PT Serif', stack: '"PT Serif", Georgia, serif', google: 'PT+Serif:wght@400;700' },
  { value: 'Crimson Pro', stack: '"Crimson Pro", Georgia, serif', google: 'Crimson+Pro:wght@400;600;700' },
  { value: 'Libre Baskerville', stack: '"Libre Baskerville", Georgia, serif', google: 'Libre+Baskerville:wght@400;700' },
  { value: 'Georgia', stack: 'Georgia, "Times New Roman", serif', google: null },
  { value: 'Times New Roman', stack: '"Times New Roman", Times, serif', google: null },
  { value: 'Bebas Neue', stack: '"Bebas Neue", system-ui, sans-serif', google: 'Bebas+Neue' },
  { value: 'Anton', stack: '"Anton", system-ui, sans-serif', google: 'Anton' },
  { value: 'Roboto Mono', stack: '"Roboto Mono", ui-monospace, monospace', google: 'Roboto+Mono:wght@400;500;700' },
  { value: 'JetBrains Mono', stack: '"JetBrains Mono", ui-monospace, monospace', google: 'JetBrains+Mono:wght@400;600;700' },
  { value: 'Fira Code', stack: '"Fira Code", ui-monospace, monospace', google: 'Fira+Code:wght@400;500;700' },
];

export function resolveFontEntry(name) {
  return FORM_FLOW_FONTS.find((f) => f.value === name) || FORM_FLOW_FONTS.find((f) => f.value === 'Inter');
}

export function resolveFontFamily(name) {
  return resolveFontEntry(name)?.stack || FORM_FLOW_FONTS[4].stack;
}

export function resolveGoogleFont(name) {
  return resolveFontEntry(name)?.google || FORM_FLOW_FONTS[4].google;
}
