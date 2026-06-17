-- ============================================================================
-- CRIAR USUÁRIO ADMIN DE TESTE
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- ============================================================================

-- IMPORTANTE: Primeiro crie o usuário no Supabase Auth:
-- 1. Ir em Authentication > Users > Add User
-- 2. Email: admin@ultrachat.com
-- 3. Senha: Admin@123
-- 4. Copiar o UUID do usuário criado
-- 5. Substituir 'COLE-O-UUID-AQUI' abaixo pelo UUID copiado

-- Inserir role de admin para o usuário
INSERT INTO public.user_roles (user_id, role)
VALUES (
  'COLE-O-UUID-AQUI',  -- ← SUBSTITUIR PELO UUID DO USUÁRIO
  'admin'
)
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================================================
-- ALTERNATIVA: Criar usuário via SQL (requer extensão auth)
-- ============================================================================

-- Se quiser criar diretamente via SQL (não recomendado):
/*
-- 1. Criar usuário no auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@ultrachat.com',
  crypt('Admin@123', gen_salt('bf')),  -- senha hasheada
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) RETURNING id;

-- 2. Copiar o UUID retornado e inserir role
INSERT INTO public.user_roles (user_id, role)
VALUES ('UUID-RETORNADO-ACIMA', 'admin');
*/

-- ============================================================================
-- VERIFICAR SE FUNCIONOU
-- ============================================================================

-- Listar todos os admins
SELECT 
  u.email,
  ur.role,
  ur.created_at
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE ur.role = 'admin';
