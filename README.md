# FormFlow

Microsserviço independente de formulários do ecossistema OnlyFlow.

- **Painel (configuração):** Frontend OnlyFlow existente (item de menu FormFlow — próxima etapa)
- **API:** NestJS + Prisma + PostgreSQL (`schema: form_flow`)
- **URL pública:** `https://forms.onlyflow.com.br/{slug}`

## Requisitos

- Node.js 20+
- PostgreSQL 16+
- Redis 7+ (opcional no scaffold; preparado via env)

## Desenvolvimento local

```bash
cd FormFlow
cp .env.example .env
docker compose up -d
```

Configure no `.env`:

```env
DATABASE_URL=postgresql://formflow:formflow@localhost:5434/formflow?schema=form_flow
REDIS_URL=redis://localhost:6380
JWT_SECRET=<mesmo do Backend OnlyFlow>
```

```bash
npm install
npm run prisma:migrate
npm run start:dev
```

## Endpoints (scaffold)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Info do serviço |
| GET | `/health` | Health check + Postgres |
| GET | `/api/form-flow/forms` | Lista forms do tenant (`x-tenant-id` temporário) |
| GET | `/api/public/forms/:slug` | Definição pública (somente `published`) |

## Porta padrão

`4341`

## Integrações futuras

ManyFlow, CRM, WhatsApp, webhooks — via REST + JWT + `ONLYFLOW_INTERNAL_KEY` (desacoplado).

## Documentação

- Roadmap visual: [FormFlow — Architecture & Roadmap (FigJam)](https://www.figma.com/board/WFW7Wv0GZK6mXlyd9haiho)
- Detalhes locais: `docs/FIGJAM-ROADMAP.md`
- Documento mestre FormFlow v1.0 (arquitetura completa)
