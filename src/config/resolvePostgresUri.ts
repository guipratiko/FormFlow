import { lookup } from 'dns/promises';
import { isIP } from 'net';

const DEFAULT_CONNECTION_LIMIT = process.env.PRISMA_CONNECTION_LIMIT || '5';
const DEFAULT_POOL_TIMEOUT = process.env.PRISMA_POOL_TIMEOUT || '30';

function toPostgresUrl(uri: string): URL {
  return new URL(uri.replace(/^postgres:\/\//i, 'postgresql://'));
}

function fromPostgresUrl(url: URL): string {
  return url.toString().replace(/^postgresql:\/\//i, 'postgres://');
}

export function applyPrismaPoolParams(uri: string): string {
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

/**
 * Hosts OnlyFlow (ex.: easy.onlyflow.com.br) expõem AAAA + A, mas o Postgres só aceita IPv4.
 * O engine Rust do Prisma tenta IPv6 e falha com P1001 — resolvemos o hostname para IPv4 aqui.
 */
export async function resolvePostgresUriIpv4(uri: string): Promise<string> {
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

export async function ensureDatabaseUrl(): Promise<void> {
  const rawUri = (process.env.POSTGRES_URI || process.env.DATABASE_URL || '').trim();
  if (rawUri) {
    process.env.DATABASE_URL = await resolvePostgresUriIpv4(rawUri);
  }

  if (!(process.env.DATABASE_URL || '').trim()) {
    console.warn(
      '⚠️ FormFlow: defina DATABASE_URL ou POSTGRES_URI no .env (ex.: POSTGRES_URI=postgres://...)'
    );
  }
}
