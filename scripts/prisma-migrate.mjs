/**
 * Prisma migrate deploy usando DATABASE_URL ou POSTGRES_URI (mesmo padrão OnlyFlow).
 */
import { config } from 'dotenv';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { resolvePostgresUriIpv4 } from './resolve-postgres-uri.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
config({ path: resolve(root, '.env') });

const databaseUrl = await resolvePostgresUriIpv4(
  (process.env.POSTGRES_URI || process.env.DATABASE_URL || '').trim()
);

if (!databaseUrl) {
  console.error(
    '❌ Defina DATABASE_URL ou POSTGRES_URI no .env.\n' +
      '   Ex.: POSTGRES_URI=postgres://user:pass@host:5435/onlydb?sslmode=disable npm run prisma:migrate'
  );
  process.exit(1);
}

const masked = databaseUrl.replace(/:([^:@/]+)@/, ':****@');
console.log(`📦 FormFlow prisma migrate deploy → ${masked}`);

execSync('npx prisma migrate deploy', {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: databaseUrl },
});
