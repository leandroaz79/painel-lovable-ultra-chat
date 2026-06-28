---
description: "Análise completa do projeto: mapeia estrutura, componentes, APIs, edge functions, banco de dados e gera documentação."
---

# Análise Completa do Projeto

Execute uma análise profunda do projeto no diretório de trabalho atual. Não faça nenhuma alteração no código — apenas leitura e documentação.

## Passo 1 — Estrutura do Projeto

1. Leia o `package.json` para identificar framework, dependências e scripts.
2. Leia `README.md` e `PROJECT_MEMORY.md` (se existirem) para contexto prévio.
3. Mapeie a estrutura de diretórios: lista recursiva dos diretórios principais (`src/`, `supabase/`, `public/`, etc.).

## Passo 2 — Frontend

1. Identifique todas as páginas/componentes React (`src/pages/`, `src/components/`).
2. Leia o roteamento principal (`App.tsx` ou equivalente) para mapear rotas e autenticação.
3. Leia hooks customizados (`src/hooks/`) para entender a lógica de negócio.
4. Leia a integração com backend (`src/lib/`, `src/services/`, `src/integrations/`).
5. Identifique o padrão de UI (Tailwind, shadcn/ui, etc.).

## Passo 3 — Backend (Supabase)

1. Liste todas as Edge Functions em `supabase/functions/*/index.ts`.
2. Para cada edge function, leia o `index.ts` e documente:
   - Nome da função
   - Método HTTP (GET/POST/etc.)
   - Parâmetros de entrada
   - Lógica principal (em 1-2 linhas)
   - Tabelas do banco acessadas
3. Liste as migrations SQL em `supabase/migrations/`.
4. Identifique tabelas, triggers, RPCs e políticas RLS.

## Passo 4 — Autenticação e Segurança

1. Identifique o provedor de auth (Supabase Auth, etc.).
2. Documente os roles/papéis do sistema (admin, reseller, user, etc.).
3. Identifique políticas de acesso por função.

## Passo 5 — Deploy e Infraestrutura

1. Verifique `docker-compose.yml`, `Dockerfile`, `netlify.toml`, `vercel.json`.
2. Documente como o projeto é deployado.

## Passo 6 — Documentação Gerada

Gere um arquivo `ANALISE_COMPLETA.md` na raiz do projeto com:

```markdown
# Análise Completa — [Nome do Projeto]
**Data:** YYYY-MM-DD

## Visão Geral
[Descrição do projeto, stack tecnológico, propósito]

## Arquitetura
[Diagrama textual da arquitetura: frontend → backend → banco]

## Frontend
### Rotas
[Tabela de rotas com componentes e autenticação]

### Componentes Principais
[Lista dos componentes com função]

### Hooks e Lógica de Negócio
[Hooks customizados e suas responsabilidades]

## Backend (Supabase Edge Functions)
### Funções
| Função | Método | Descrição | Tabelas |
|--------|--------|-----------|---------|

### Database
#### Tabelas
[Lista de tabelas com colunas principais]

#### Triggers e RPCs
[Funções do banco]

#### Políticas RLS
[Políticas de segurança]

## Autenticação
[Provedor, roles, fluxo de login]

## Deploy
[Como fazer deploy]

## Pontos de Atenção
[Riscos, débitos técnicos, melhorias sugeridas]
```

## Regras

- **Não modifique nenhum arquivo** — esta é uma tarefa somente leitura.
- Responda em português do Brasil.
- Se o projeto tiver muitos arquivos (>50 componentes), agrupe por módulo/pasta e documente os mais importantes em detalhe, sumarizando o resto.
- Se encontrar `PROJECT_MEMORY.md` ou `RELATORIO-FUNCIONALIDADES.md` existente, use como base e atualize, não recrie do zero.
