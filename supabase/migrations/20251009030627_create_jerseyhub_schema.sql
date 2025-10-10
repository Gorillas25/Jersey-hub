/*
  # Criação do Schema JerseyHub
  
  Este migration cria toda a estrutura de banco de dados para o JerseyHub,
  uma plataforma de catálogo privado para revendedores de camisas de futebol.

  ## 1. Novas Tabelas
  
  ### `profiles`
  Estende auth.users com informações adicionais do usuário
  - `id` (uuid, FK para auth.users)
  - `email` (text)
  - `role` (text) - 'admin' ou 'reseller'
  - `subscription_status` (text) - 'active', 'inactive', 'trial'
  - `subscription_end_date` (timestamptz) - data de expiração da assinatura
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `jerseys`
  Armazena informações sobre as camisas cadastradas
  - `id` (uuid, PK)
  - `title` (text) - nome/descrição da camisa
  - `team_name` (text) - nome do time
  - `image_url` (text) - URL da imagem no storage
  - `tags` (text[]) - array de tags para filtros
  - `created_by` (uuid, FK para auth.users) - admin que criou
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `webhook_logs`
  Registra envios realizados pelos revendedores
  - `id` (uuid, PK)
  - `reseller_id` (uuid, FK para auth.users)
  - `client_phone` (text) - telefone do cliente
  - `jersey_ids` (uuid[]) - IDs das camisas enviadas
  - `webhook_response` (jsonb) - resposta do webhook
  - `status` (text) - 'success', 'failed'
  - `created_at` (timestamptz)

  ## 2. Storage Buckets
  - `jerseys` - bucket público para armazenar imagens das camisas

  ## 3. Segurança (RLS)
  - Todas as tabelas têm RLS habilitado
  - Policies restritivas para cada role (admin/reseller)
  - Apenas usuários autenticados com assinatura ativa podem acessar
  
  ## 4. Índices
  - Índices em colunas frequentemente consultadas para performance
*/

-- Criar tabela de profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'reseller' CHECK (role IN ('admin', 'reseller')),
  subscription_status text NOT NULL DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'trial')),
  subscription_end_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de jerseys
CREATE TABLE IF NOT EXISTS jerseys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  team_name text NOT NULL,
  image_url text NOT NULL,
  tags text[] DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de logs de webhook
CREATE TABLE IF NOT EXISTS webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_phone text NOT NULL,
  jersey_ids uuid[] NOT NULL,
  webhook_response jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('success', 'failed', 'pending')),
  created_at timestamptz DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_jerseys_team_name ON jerseys(team_name);
CREATE INDEX IF NOT EXISTS idx_jerseys_tags ON jerseys USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_reseller ON webhook_logs(reseller_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription ON profiles(subscription_status, subscription_end_date);

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jerseys ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Policies para profiles
CREATE POLICY "Usuários podem ver próprio perfil"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar próprio perfil"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins podem ver todos os perfis"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins podem atualizar perfis"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins podem inserir perfis"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policies para jerseys
CREATE POLICY "Usuários com assinatura ativa podem ver jerseys"
  ON jerseys FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.subscription_status = 'active'
      AND (profiles.subscription_end_date IS NULL OR profiles.subscription_end_date > now())
    )
  );

CREATE POLICY "Admins podem inserir jerseys"
  ON jerseys FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins podem atualizar jerseys"
  ON jerseys FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins podem deletar jerseys"
  ON jerseys FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policies para webhook_logs
CREATE POLICY "Usuários podem ver próprios logs"
  ON webhook_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = reseller_id);

CREATE POLICY "Usuários podem inserir próprios logs"
  ON webhook_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reseller_id);

CREATE POLICY "Admins podem ver todos os logs"
  ON webhook_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jerseys_updated_at
  BEFORE UPDATE ON jerseys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para criar profile automaticamente após signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, subscription_status)
  VALUES (
    NEW.id,
    NEW.email,
    'reseller',
    'inactive'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar profile automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Criar storage bucket para jerseys (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('jerseys', 'jerseys', true)
ON CONFLICT (id) DO NOTHING;

-- Policies de storage para o bucket jerseys
CREATE POLICY "Admins podem fazer upload de jerseys"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'jerseys' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Todos podem ver jerseys"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'jerseys');

CREATE POLICY "Admins podem deletar jerseys do storage"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'jerseys' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );