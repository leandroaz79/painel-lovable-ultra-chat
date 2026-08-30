# Debug Production Blank Page

Status: [OPEN]

## Sintoma

A aplicação é publicada no Dokploy, mas o navegador exibe apenas o fundo visual; o conteúdo da página não é renderizado.

## Hipóteses

1. O bundle JavaScript não está sendo servido corretamente.
2. Variáveis `VITE_*` não estão disponíveis durante o build.
3. O fallback de SPA ou os caminhos dos assets estão incorretos.
4. Uma exceção JavaScript interrompe a inicialização em produção.
5. A configuração de build/porta não é compatível com o Dokploy.

## Evidências

- `npm run build` local conclui com sucesso e gera o bundle Vite.
- O bundle local contém a URL pública do Supabase, indicando que as variáveis estavam disponíveis no build local.
- O código falha imediatamente na importação de `src/lib/supabase.ts` quando `VITE_SUPABASE_URL` ou `VITE_SUPABASE_ANON_KEY` não existe.
- `.dockerignore` exclui arquivos `.env`; portanto, o `.env` local não é enviado para o contexto Docker.
- O Dockerfile exige as variáveis como `ARG` antes de executar `npm run build`.
- O domínio resolve para `179.199.132.179`, mas a coleta automatizada não conseguiu estabelecer TLS; é necessário confirmar no navegador do usuário se os assets retornam HTTP 200.
- O Console de produção confirma `Missing VITE_SUPABASE_URL environment variable` no bundle `supabase-*.js`.

## Estado Atual

A hipótese de variáveis ausentes durante o build está confirmada. A hipótese de assets/roteamento deixa de ser primária.

## Correção Aplicada

O Dockerfile agora valida os argumentos `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` antes do build. A publicação falha de forma explícita se o Dokploy não os enviar como argumentos de build.
