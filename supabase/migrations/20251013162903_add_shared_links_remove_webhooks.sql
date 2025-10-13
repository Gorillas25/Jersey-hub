/*
  # Adicionar Sistema de Links Compartilhados e Remover Webhooks
  
  Este migration remove a funcionalidade de webhooks e adiciona o sistema
  de geração de links públicos para compartilhar camisas.

  ## 1. Mudanças
  
  ### Remover
  - Tabela `webhook_logs` (não será mais usada)
  
  ### Adicionar
  - Tabela `shared_links` - Links públicos gerados pelos revendedores
    - `id` (uuid, PK)
    - `short_code` (text, unique) - código curto para URL amigável
    - `reseller_id` (uuid, FK) - quem criou o link
    - `jersey_ids` (uuid[]) - IDs das camisas compartilhadas
    - `view_count` (integer) - contador de visualizações
    - `created_at` (timestamptz)
    - `expires_at` (timestamptz, nullable) - data de expiração (opcional)

  ## 2. Segurança (RLS)
  - RLS habilitado na tabela shared_links
  - Revendedores podem criar e ver próprios links
  - Links são públicos (qualquer um pode visualizar com o código)
  - Admins podem ver todos os links

  ## 3. Índices
  - Índice único em short_code para buscas rápidas
  - Índice em reseller_id para queries por revendedor
*/

-- Remover tabela de webhook_logs (não mais necessária)
DROP TABLE IF EXISTS webhook_logs;

-- Criar tabela de links compartilhados
CREATE TABLE IF NOT EXISTS shared_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  short_code text UNIQUE NOT NULL,
  reseller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  jersey_ids uuid[] NOT NULL,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_shared_links_short_code ON shared_links(short_code);
CREATE INDEX IF NOT EXISTS idx_shared_links_reseller ON shared_links(reseller_id);
CREATE INDEX IF NOT EXISTS idx_shared_links_created ON shared_links(created_at DESC);

-- Habilitar RLS
ALTER TABLE shared_links ENABLE ROW LEVEL SECURITY;

-- Policy: Qualquer um pode visualizar links compartilhados (público)
CREATE POLICY "Links compartilhados são públicos para visualização"
  ON shared_links FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy: Revendedores podem criar próprios links
CREATE POLICY "Revendedores podem criar links"
  ON shared_links FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = reseller_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.subscription_status = 'active'
      AND (profiles.subscription_end_date IS NULL OR profiles.subscription_end_date > now())
    )
  );

-- Policy: Revendedores podem ver próprios links
CREATE POLICY "Revendedores podem ver próprios links"
  ON shared_links FOR SELECT
  TO authenticated
  USING (auth.uid() = reseller_id);

-- Policy: Revendedores podem deletar próprios links
CREATE POLICY "Revendedores podem deletar próprios links"
  ON shared_links FOR DELETE
  TO authenticated
  USING (auth.uid() = reseller_id);

-- Policy: Admins podem ver todos os links
CREATE POLICY "Admins podem ver todos os links"
  ON shared_links FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Função para gerar código curto único
CREATE OR REPLACE FUNCTION generate_short_code()
RETURNS text AS $$
DECLARE
  chars text := 'abcdefghijklmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  result text := '';
  i integer;
  code_exists boolean := true;
BEGIN
  WHILE code_exists LOOP
    result := '';
    FOR i IN 1..8 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    SELECT EXISTS(SELECT 1 FROM shared_links WHERE short_code = result) INTO code_exists;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para incrementar contador de views
CREATE OR REPLACE FUNCTION increment_link_view_count(link_code text)
RETURNS void AS $$
BEGIN
  UPDATE shared_links
  SET view_count = view_count + 1
  WHERE short_code = link_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
