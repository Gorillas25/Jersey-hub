-- Script para criar usuário admin temporário
-- Execute este script no SQL Editor do Supabase Dashboard
-- (https://qcjzdpaavceaddnpunaw.supabase.co/project/qcjzdpaavceaddnpunaw/sql/new)

-- CREDENCIAIS DE ACESSO TEMPORÁRIO:
-- Email: admin@temp.com
-- Senha: TempAdmin2024!

-- Passo 1: Primeiro você precisa criar o usuário no Auth
-- Vá em: Authentication > Users > Add User
-- Email: admin@temp.com
-- Password: TempAdmin2024!
-- Confirme o email automaticamente

-- Passo 2: Depois de criar o usuário, copie o UUID dele e execute:

-- Substitua 'UUID_DO_USUARIO_AQUI' pelo UUID copiado
UPDATE profiles
SET
  role = 'admin',
  subscription_status = 'active',
  subscription_end_date = NULL,
  is_active = true
WHERE id = 'UUID_DO_USUARIO_AQUI';

-- Verificar se funcionou
SELECT
  id,
  email,
  role,
  subscription_status,
  is_active,
  created_at
FROM profiles
WHERE id = 'UUID_DO_USUARIO_AQUI';

-- IMPORTANTE: Após testar, delete este usuário temporário por segurança!
