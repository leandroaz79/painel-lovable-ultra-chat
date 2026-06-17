# 🗄️ ESTRUTURA DO DATABASE - ULTRA CHAT

## 📊 TABELAS

### 1. **ts_licenses**
Armazena licenças de usuários com controle de dispositivo e sessão.

**Colunas:**
- `id` (UUID, PK) - Identificador único
- `license_key` (TEXT, UNIQUE) - Chave da licença (formato: TS-XXXXXXXXXXXXXXXXXXXX)
- `user_id` (UUID, FK) - Referência ao auth.users
- `user_name` (TEXT) - Nome do usuário
- `email` (TEXT) - Email do usuário
- `phone` (TEXT) - Telefone do usuário
- `status` (TEXT) - Status: active, expired, suspended, trial
- `license_type` (TEXT) - Tipo: trial, paid, lifetime
- `lifetime` (BOOLEAN) - Se é vitalícia
- `activated_at` (TIMESTAMPTZ) - Data de ativação
- `expires_at` (TIMESTAMPTZ) - Data de expiração (NULL se vitalícia)
- `device_id` (TEXT) - ID único do dispositivo
- `session_id` (TEXT) - ID da sessão ativa
- `last_heartbeat` (TIMESTAMPTZ) - Último heartbeat recebido
- `online_count` (INTEGER) - Contador de usuários online
- `created_at` (TIMESTAMPTZ) - Data de criação
- `updated_at` (TIMESTAMPTZ) - Data de atualização
- `metadata` (JSONB) - Metadados adicionais

**Índices:**
- idx_licenses_key (license_key)
- idx_licenses_user (user_id)
- idx_licenses_status (status)
- idx_licenses_device (device_id)
- idx_licenses_session (session_id)

**RLS Policies:**
- Users can view own licenses (SELECT)
- Service role can insert/update (INSERT/UPDATE)

---

### 2. **notifications**
Notificações do sistema exibidas na extensão.

**Colunas:**
- `id` (UUID, PK)
- `title` (TEXT, NOT NULL) - Título da notificação
- `message` (TEXT, NOT NULL) - Mensagem
- `link` (TEXT) - Link opcional
- `is_active` (BOOLEAN) - Se está ativa
- `priority` (INTEGER) - Prioridade de exibição
- `created_at` (TIMESTAMPTZ)
- `expires_at` (TIMESTAMPTZ) - Data de expiração
- `metadata` (JSONB)

**Índices:**
- idx_notifications_active (is_active, created_at DESC)
- idx_notifications_priority (priority DESC)

**RLS Policies:**
- Public can read active notifications (SELECT)
- Service role can manage (ALL)

---

### 3. **packages**
Planos de pagamento disponíveis.

**Colunas:**
- `id` (UUID, PK)
- `name` (TEXT, NOT NULL) - Nome do plano
- `description` (TEXT) - Descrição
- `price` (DECIMAL) - Preço
- `currency` (TEXT) - Moeda (default: MZN)
- `duration_days` (INTEGER) - Duração em dias (NULL = vitalício)
- `is_active` (BOOLEAN) - Se está ativo
- `is_popular` (BOOLEAN) - Se é popular (badge)
- `sort_order` (INTEGER) - Ordem de exibição
- `features` (JSONB) - Array de features
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)
- `metadata` (JSONB)

**Índices:**
- idx_packages_active (is_active, sort_order)

**RLS Policies:**
- Public can read active packages (SELECT)
- Service role can manage (ALL)

**Dados Seed:**
1. Plano Teste (50 MZN, 7 dias)
2. Plano Mensal (150 MZN, 30 dias)
3. Plano Trimestral (400 MZN, 90 dias)
4. Plano Vitalício (800 MZN, sem expiração)

---

### 4. **extension_versions**
Controle de versões para notificar atualizações.

**Colunas:**
- `id` (UUID, PK)
- `version` (TEXT, UNIQUE) - Versão (ex: 4.5)
- `changelog` (TEXT) - Notas de versão
- `file_path` (TEXT) - Caminho do arquivo no storage
- `is_alert_active` (BOOLEAN) - Se deve exibir alerta
- `is_mandatory` (BOOLEAN) - Se atualização é obrigatória
- `created_at` (TIMESTAMPTZ)
- `metadata` (JSONB)

**Índices:**
- idx_versions_active (is_alert_active, created_at DESC)

**RLS Policies:**
- Public can read active version alerts (SELECT)

---

### 5. **user_roles**
Roles especiais (reseller, admin).

**Colunas:**
- `id` (UUID, PK)
- `user_id` (UUID, FK, NOT NULL) - Referência ao auth.users
- `role` (TEXT, NOT NULL) - Role: user, reseller, admin
- `created_at` (TIMESTAMPTZ)
- `metadata` (JSONB)
- UNIQUE(user_id, role)

**Índices:**
- idx_user_roles_user (user_id)
- idx_user_roles_role (role)

**RLS Policies:**
- Users can view own roles (SELECT)

---

### 6. **payment_transactions**
Histórico de transações de pagamento.

**Colunas:**
- `id` (UUID, PK)
- `license_key` (TEXT) - Chave da licença gerada
- `package_id` (UUID, FK) - Referência ao packages
- `phone` (TEXT, NOT NULL) - Número do telefone
- `payment_method` (TEXT, NOT NULL) - mpesa ou emola
- `amount` (DECIMAL, NOT NULL) - Valor pago
- `currency` (TEXT) - Moeda (default: MZN)
- `status` (TEXT, NOT NULL) - pending, success, failed, cancelled
- `transaction_id` (TEXT) - ID do gateway de pagamento
- `provider_response` (JSONB) - Resposta completa do provedor
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)
- `metadata` (JSONB)

**Índices:**
- idx_transactions_license (license_key)
- idx_transactions_status (status, created_at DESC)
- idx_transactions_phone (phone)

**RLS Policies:**
- Service role can manage transactions (ALL)

---

## 🔧 FUNÇÕES

### 1. **update_updated_at_column()**
Trigger function que atualiza automaticamente o campo `updated_at`.

**Uso:**
```sql
CREATE TRIGGER update_[table]_updated_at
BEFORE UPDATE ON [table]
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**Aplicado em:**
- ts_licenses
- packages
- payment_transactions

---

### 2. **generate_license_key()**
Gera chave de licença única no formato TS-XXXXXXXXXXXXXXXXXXXX.

**Retorno:** TEXT

**Exemplo:**
```sql
SELECT generate_license_key();
-- Resultado: TS-A1B2C3D4E5F6G7H8I9J0
```

**Lógica:**
- Prefixo: TS-
- 20 caracteres aleatórios (A-Z, 0-9)
- Loop até encontrar chave única
- SECURITY DEFINER (executa com privilégios do owner)

---

### 3. **cleanup_temp_images()**
Remove imagens temporárias com mais de 24 horas.

**Uso:** Executar via cron diariamente
```sql
SELECT cleanup_temp_images();
```

**Lógica:**
- Calcula data de ontem
- Deleta arquivos do bucket temp-images com data < ontem
- Usa SECURITY DEFINER

---

## 🔒 SEGURANÇA (RLS)

### Princípios Aplicados:

1. **Todas tabelas têm RLS habilitado**
2. **Anon role:** Apenas leitura pública (notificações, pacotes, versões)
3. **Authenticated:** Acesso aos próprios dados
4. **Service role:** Acesso total via Edge Functions

### Tabelas por Nível de Acesso:

**Público (anon):**
- notifications (apenas ativas)
- packages (apenas ativos)
- extension_versions (apenas com alerta ativo)

**Privado (authenticated):**
- ts_licenses (apenas própria licença)
- user_roles (apenas próprio role)

**Restrito (service_role):**
- payment_transactions (apenas via functions)

---

## 📈 QUERIES ÚTEIS

### Verificar licenças ativas:
```sql
SELECT 
  license_key, 
  user_name, 
  status, 
  expires_at,
  CASE 
    WHEN expires_at IS NULL THEN 'Vitalícia'
    WHEN expires_at > NOW() THEN 'Ativa'
    ELSE 'Expirada'
  END as state
FROM ts_licenses
WHERE status = 'active'
ORDER BY created_at DESC;
```

### Estatísticas de pagamentos:
```sql
SELECT 
  payment_method,
  status,
  COUNT(*) as total,
  SUM(amount) as revenue
FROM payment_transactions
GROUP BY payment_method, status
ORDER BY revenue DESC;
```

### Licenças expirando em 7 dias:
```sql
SELECT 
  license_key,
  user_name,
  email,
  expires_at,
  expires_at - NOW() as time_remaining
FROM ts_licenses
WHERE expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'
AND status = 'active'
ORDER BY expires_at ASC;
```

### Pacotes mais vendidos:
```sql
SELECT 
  p.name,
  COUNT(pt.id) as sales,
  SUM(pt.amount) as revenue
FROM packages p
LEFT JOIN payment_transactions pt ON p.id = pt.package_id
WHERE pt.status = 'success'
GROUP BY p.id, p.name
ORDER BY sales DESC;
```

---

## 🔄 MANUTENÇÃO

### Tarefas Diárias:
- Executar `cleanup_temp_images()`
- Verificar licenças expiradas e atualizar status

### Tarefas Semanais:
- Backup completo do database
- Análise de logs de transações
- Review de políticas RLS

### Tarefas Mensais:
- Auditoria de segurança
- Otimização de índices
- Limpeza de dados antigos (> 6 meses)

---

**Última atualização:** 2026-06-07
**Versão do Schema:** 1.0
