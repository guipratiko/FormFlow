# FormFlow — Roadmap visual (FigJam)

Este documento descreve o conteúdo do board FigJam **FormFlow Architecture & Roadmap** a ser criado/atualizado no Figma.

## Seções do board

### 1. Visão geral
- OnlyFlow Frontend (menu FormFlow) → API FormFlow (4341) → PostgreSQL `form_flow`
- URL pública: `https://forms.onlyflow.com.br/{slug}`
- Integrações futuras: ManyFlow, CRM, WhatsApp, webhooks

### 2. Módulos implementados (v0.1)
| Módulo | Status |
|--------|--------|
| Auth JWT + tenant | ✅ |
| CRUD formulários | ✅ |
| Construtor básico de campos | ✅ |
| Publicar / despublicar | ✅ |
| Dashboard métricas | ✅ |
| Central de respostas | ✅ |
| Renderer público (public-web) | ✅ |
| Permissão subusuário `formflow` | ✅ |

### 3. Fluxo do usuário (painel)
1. Menu **FormFlow** → Dashboard
2. Criar formulário → Editor de campos
3. Publicar → Copiar URL pública
4. Ver respostas na central

### 4. Fluxo do respondente (público)
1. Acessa `forms.onlyflow.com.br/{slug}`
2. Visualização registrada (`POST /view`)
3. Preenche campos → Envia (`POST /responses`)
4. Tela de agradecimento

### 5. Roadmap próximo
- Drag-and-drop avançado (DnD kit)
- Lógica condicional visual
- Multi-step / wizard com barra de progresso
- Temas (logo, cores, dark mode)
- Export CSV/XLSX/PDF
- Integração ManyFlow (webhook on submit)
- Rate limiting + honeypot + CAPTCHA
- SEO (OG, structured data)

### 6. Design tokens (referência)
- Primária: `#2563eb`
- Fundo: `#f8fafc`
- Tipografia: Inter / system-ui
- Inspiração: Linear, Notion, Typeform

---

Para gerar o board no Figma: criar arquivo FigJam e usar stickies por seção acima.
