# Plano: Página Programa de Revendedores

## Escopo
Criar página dedicada `/reseller-program` como landing page completa para converter clientes em revendedores.

## Arquivos a criar/modificar

### 1. `src/pages/ResellerProgram.tsx` (NOVO)
Página completa com 8 seções:
- **Hero**: Título grande + 2 CTAs
- **Como funciona**: 4 cards (adesão, brinde, compra, revenda)
- **Investimento**: Card premium R$ 89,90 + checklist
- **Tabela Progressiva**: 9 faixas de preço (R$ 37,90 → R$ 19,90)
- **Calculadora Interativa**: Slider quantidade + preço de venda → investimento, faturamento, lucro, margem
- **Potencial de Lucro**: Tabela simulação Vitalício (10→150 licenças)
- **Você escolhe como vender**: 5 cards (Diário→Vitalício)
- **Por que vale a pena**: 7 cards com ícones
- **FAQ**: Accordion 4 perguntas
- **CTA Final**: Repeat do hero

### 2. `src/App.tsx` (MODIFICAR)
- Adicionar lazy import: `const ResellerProgram = lazy(() => import('./pages/ResellerProgram'))`
- Adicionar rota: `/reseller-program` com `ProtectedRoute anyRole`

### 3. `src/pages/user/Dashboard.tsx` (MODIFICAR)
- Substituir o CTA card existente (reseller-cta-card, linhas ~428-465) por um card que linka para `/reseller-program`
- Card com bullets + botão "Saiba mais" → navigate('/reseller-program')

## Design
- Seguir padrão existente: `landing-page`, `landing-section`, `hero-panel`, `glass-card`, `table-card`, `section-header`, `eyebrow`
- Usar variáveis CSS existentes: `--accent`, `--cyan`, `--muted`, `--text`, `--card`, `--line`
- Ícones do Lucide React
- Botão primário usa componente `Button` existente
- Calculadora interativa com inputs controlled
- FAQ com accordion state local
- Responsivo via `grid-template-columns: repeat(auto-fit, minmax(...))`

## Verificação
- `npx tsc -b` deve passar limpo
- Rota `/reseller-program` acessível por qualquer usuário logado
- Botão no dashboard do cliente redireciona para a página
