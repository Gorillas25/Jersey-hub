-- Script para criar o primeiro administrador no JerseyHub
--
-- INSTRUÇÕES:
-- 1. Cadastre-se pela interface da aplicação primeiro
-- 2. Vá em Supabase Dashboard > Authentication > Users
-- 3. Copie o UUID do seu usuário
-- 4. Substitua 'SEU_UUID_AQUI' abaixo pelo UUID copiado
-- 5. Execute este script no SQL Editor do Supabase

UPDATE profiles
SET
  role = 'admin',
  subscription_status = 'active',
  subscription_end_date = NULL
WHERE id = 'SEU_UUID_AQUI';

-- Verificar se funcionou
SELECT
  id,
  email,
  role,
  subscription_status,
  created_at
FROM profiles
WHERE id = 'SEU_UUID_AQUI';
