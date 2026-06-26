export function slugify(input: string): string {
  const base = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return base || 'formulario';
}

function randomSlugSuffix(length = 6): string {
  return Math.random()
    .toString(36)
    .slice(2, 2 + length)
    .padEnd(length, '0');
}

export async function buildUniqueSlug(
  exists: (slug: string) => Promise<boolean>,
  title: string,
  preferred?: string
): Promise<string> {
  const root = slugify(preferred?.trim() || title);
  const withSuffix = preferred?.trim() ? root : `${root}-${randomSlugSuffix()}`;
  let attempt = 0;
  while (attempt < 200) {
    const candidate = attempt === 0 ? withSuffix : `${root}-${randomSlugSuffix()}`;
    if (!(await exists(candidate))) return candidate;
    attempt += 1;
  }
  return `${root}-${Date.now().toString(36)}`;
}
