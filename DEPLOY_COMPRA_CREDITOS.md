# 🛒 Sistema de Compra de Créditos - Instruções de Deploy

## 📋 Arquivos Criados

### Frontend (React)
- ✅ Modal de compra no Dashboard Revendedor
- ✅ Cálculo automático de desconto progressivo
- ✅ Modal Pix com QR Code
- ✅ Polling automático para verificar pagamento

### Backend (Edge Functions)
1. **`reseller-buy-credits`** - Gera pagamento Pix via Mercado Pago
2. **`mercadopago-webhook`** - Recebe notificações e atualiza créditos
3. **`check-payment-status`** - Verifica status do pagamento (polling)

### Database
- **Migration `005_credit_purchases.sql`** - Tabela para registrar compras

---

## 🚀 Passos para Ativar

### 1. Criar tabela `credit_purchases`
```bash
# No Supabase Dashboard > SQL Editor
# Execute o arquivo: supabase/migrations/005_credit_purchases.sql
```

### 2. Deploy das Edge Functions

**Opção A: Via CLI** (recomendado)
```bash
cd supabase

# Deploy todas de uma vez
supabase functions deploy reseller-buy-credits
supabase functions deploy mercadopago-webhook
supabase functions deploy check-payment-status
```

**Opção B: Via Dashboard**
1. Acesse: Edge Functions no menu lateral
2. Crie cada função manualmente
3. Cole o código dos arquivos `.ts`

### 3. Configurar Webhook no Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers/panel/notifications/webhooks
2. Clique em **"Criar webhook"**
3. Preencha:
   - **URL**: `https://rkntjizbuusaozipvaqm.supabase.co/functions/v1/mercadopago-webhook`
   - **Eventos**: Selecione apenas `payment`
4. Clique em **"Criar"**

---

## 💰 Tabela de Preços (Configurada)

| Quantidade | Preço Unitário | Desconto | Total (exemplo) |
|------------|----------------|----------|-----------------|
| 1-9 chaves | R$ 30,00 | 0% | R$ 270,00 (9 chaves) |
| 10-19 chaves | R$ 25,00 | -17% | R$ 250,00 (10 chaves) |
| 20-29 chaves | R$ 20,00 | -33% | R$ 400,00 (20 chaves) |
| 30+ chaves | R$ 15,00 | -50% | R$ 450,00 (30 chaves) |

---

## 🔄 Fluxo de Compra

1. **Revendedor** clica em "🛒 Comprar chaves"
2. **Modal** abre com:
   - Seletor de quantidade (+/-)
   - Cálculo automático de desconto
   - Formulário (Nome, CPF, Telefone, Email)
3. Clica em **"Pagar R$ XXX,XX"**
4. **Mercado Pago** gera QR Code Pix
5. **Modal Pix** mostra:
   - QR Code para escanear
   - Código Pix para copiar
   - Mensagem "Aguardando pagamento..."
6. **Polling** verifica pagamento a cada 5 segundos
7. **Quando aprovado**:
   - Webhook recebe notificação
   - Créditos são adicionados automaticamente
   - Modal fecha
   - Toast: "Pagamento aprovado! X créditos adicionados"
   - Dashboard atualiza

---

## 🧪 Como Testar

### Teste em Produção (Pix real)
1. Faça login como revendedor
2. Clique em "Comprar chaves"
3. Selecione quantidade (ex: 10)
4. Preencha dados reais
5. Pague via Pix
6. Aguarde aprovação (geralmente instantâneo)

### Teste em Sandbox (Mercado Pago Teste)
Para testar sem pagar, você precisaria:
1. Usar credenciais de **teste** do Mercado Pago
2. Trocar `MERCADOPAGO_ACCESS_TOKEN` nas Edge Functions
3. Usar CPF de teste: `12345678909`

---

## ⚠️ Importante

- **Access Token** está hardcoded nas Edge Functions
- **Recomendação**: Mover para variáveis de ambiente do Supabase:
  ```bash
  supabase secrets set MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
  ```
  E atualizar código:
  ```typescript
  const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
  ```

- **Webhook URL** deve ser pública e acessível pelo Mercado Pago
- **Tabela `resellers`** precisa ter coluna `total_credits_purchased` (já existe no schema)

---

## 📊 Monitoramento

### Ver compras no banco:
```sql
SELECT 
  cp.id,
  cp.payment_id,
  cp.quantity,
  cp.amount,
  cp.status,
  cp.buyer_name,
  cp.created_at,
  cp.approved_at,
  u.email as reseller_email
FROM credit_purchases cp
JOIN auth.users u ON u.id = cp.reseller_id
ORDER BY cp.created_at DESC;
```

### Ver logs das Edge Functions:
```bash
# No Dashboard: Edge Functions > Selecionar função > Logs
```

---

## ✅ Checklist Final

- [ ] Executar migration `005_credit_purchases.sql`
- [ ] Deploy das 3 Edge Functions
- [ ] Configurar webhook no Mercado Pago
- [ ] Testar compra completa
- [ ] Verificar se créditos foram adicionados
- [ ] (Opcional) Mover Access Token para secrets

---

Está tudo pronto! Assim que fizer o deploy, o sistema de compra estará 100% funcional.
