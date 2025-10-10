-- Script para criar o perfil do admin@temp.com manualmente
-- Execute este script no SQL Editor do Supabase
-- (https://qcjzdpaavceaddnpunaw.supabase.co/project/qcjzdpaavceaddnpunaw/sql/new)

-- Passo 1: Encontrar o UUID do usuário admin@temp.com
-- Execute esta query primeiro para pegar o UUID:
SELECT id, email, created_at
FROM auth.users
WHERE email = 'admin@temp.com';

-- Passo 2: Copie o UUID retornado acima e cole aqui:
-- Substitua 'COLE_UUID_AQUI' pelo UUID do usuário

-- Inserir ou atualizar o perfil
INSERT INTO public.profiles (id, email, role, subscription_status, created_at, updated_at)
SELECT
  id,
  email,
  'admin',
  'active',
  created_at,
  now()
FROM auth.users
WHERE email = 'admin@temp.com'
ON CONFLICT (id)
DO UPDATE SET
  role = 'admin',
  subscription_status = 'active',
  subscription_end_date = NULL,
  updated_at = now();

-- Passo 3: Verificar se o perfil foi criado corretamente
SELECT
  p.id,
  p.email,
  p.role,
  p.subscription_status,
  p.created_at,
  au.email as auth_email
FROM profiles p
JOIN auth.users au ON au.id = p.id
WHERE p.email = 'admin@temp.com';

-- Se tudo estiver OK, você verá:
-- role = 'admin'
-- subscription_status = 'active'
-- Agora você pode fazer login com: admin@temp.com / TempAdmin2024!
