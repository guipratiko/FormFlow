import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const DEFAULT_CONNECTION_LIMIT = process.env.PRISMA_CONNECTION_LIMIT || '5';
const DEFAULT_POOL_TIMEOUT = process.env.PRISMA_POOL_TIMEOUT || '30';

function toPostgresUrl(uri) {
  return new URL(uri.replace(/^postgres:\/\//i, 'postgresql://'));
}

function fromPostgresUrl(url) {
  return url.toString().replace(/^postgresql:\/\//i, 'postgres://');
}

export function applyPrismaPoolParams(uri) {
  const trimmed = uri.trim();
  if (!trimmed) return trimmed;

  try {
    const parsed = toPostgresUrl(trimmed);
    if (!parsed.searchParams.has('connection_limit')) {
      parsed.searchParams.set('connection_limit', DEFAULT_CONNECTION_LIMIT);
    }
    if (!parsed.searchParams.has('pool_timeout')) {
      parsed.searchParams.set('pool_timeout', DEFAULT_POOL_TIMEOUT);
    }
    if (!parsed.searchParams.has('connect_timeout')) {
      parsed.searchParams.set('connect_timeout', '15');
    }
    return fromPostgresUrl(parsed);
  } catch {
    return trimmed;
  }
}

/** Mesma lógica de src/config/resolvePostgresUri.ts (scripts Prisma CLI). */
export async function resolvePostgresUriIpv4(uri) {
  const trimmed = uri.trim();
  if (!trimmed) return trimmed;

  try {
    const parsed = toPostgresUrl(trimmed);
    const hostname = parsed.hostname;

    if (!hostname || isIP(hostname) === 4) {
      return applyPrismaPoolParams(trimmed);
    }
    if (isIP(hostname) === 6) {
      return applyPrismaPoolParams(trimmed);
    }

    const { address } = await lookup(hostname, { family: 4 });
    parsed.hostname = address;
    return applyPrismaPoolParams(fromPostgresUrl(parsed));
  } catch {
    return applyPrismaPoolParams(trimmed);
  }
}
