# JerseyHub - Catálogo Privado de Camisas

Plataforma SaaS para revendedores de camisas de futebol no Brasil. Permite gerenciar um catálogo privado de camisas e enviar seleções diretamente para clientes via WhatsApp.

## Funcionalidades

### Para Revendedores
- Navegar pelo catálogo completo de camisas
- Filtrar por time e tags (temporada, tipo, etc.)
- Selecionar múltiplas camisas
- Enviar seleção diretamente para clientes no WhatsApp via webhook n8n
- Acesso mediante assinatura paga

### Para Administradores
- Upload de novas camisas com imagens
- Gerenciamento de camisas (editar/deletar)
- Gerenciamento de usuários e assinaturas
- Ativar/desativar acesso de revendedores

## Tecnologias

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend/Auth**: Supabase (PostgreSQL + Auth)
- **Storage**: Supabase Storage (imagens)
- **Pagamentos**: Stripe (preparado para integração)
- **WhatsApp**: Webhook para n8n + Evolution API

## Configuração

### 1. Variáveis de Ambiente

O arquivo `.env` já está configurado com as credenciais do Supabase. Verifique se contém:

```
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

### 2. Banco de Dados

O schema do banco de dados já foi criado automaticamente e inclui:

- Tabela `profiles` - perfis de usuários com roles e status de assinatura
- Tabela `jerseys` - catálogo de camisas
- Tabela `webhook_logs` - registro de envios para clientes
- Storage bucket `jerseys` - armazenamento de imagens
- RLS (Row Level Security) configurado para todas as tabelas

### 3. Criar Primeiro Admin

Para criar o primeiro administrador:

1. Cadastre-se pela interface da aplicação
2. No Supabase Dashboard, vá em Authentication > Users
3. Copie o UUID do usuário criado
4. No SQL Editor, execute:

```sql
UPDATE profiles
SET role = 'admin',
    subscription_status = 'active'
WHERE id = 'UUID_DO_USUARIO';
```

### 4. Configurar Webhook n8n

No arquivo `src/components/UserCatalog.tsx`, atualize a URL do webhook:

```typescript
const WEBHOOK_URL = 'https://sua-instancia-n8n.com/webhook/jerseyhub';
```

O webhook recebe o seguinte payload:

```json
{
  "cliente": "+55 11 91234-5678",
  "usuario": "revendedor@exemplo.com",
  "imagens": [
    "https://url-da-imagem-1.jpg",
    "https://url-da-imagem-2.jpg"
  ]
}
```

### 5. Configurar Stripe (Opcional)

Para ativar pagamentos automáticos:

1. Crie uma conta no [Stripe](https://stripe.com)
2. Obtenha suas chaves de API
3. Adicione ao `.env`:
   ```
   VITE_STRIPE_PUBLIC_KEY=pk_live_...
   ```
4. Implemente o checkout no componente `PaymentPage.tsx`

## Instalação e Execução

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## Fluxo de Uso

### Para Revendedores

1. **Cadastro**: Criar conta com email e senha
2. **Aguardar Aprovação**: Admin ativa a assinatura manualmente
3. **Acessar Catálogo**: Navegar e filtrar camisas
4. **Selecionar**: Escolher múltiplas camisas
5. **Enviar**: Digitar número do cliente e enviar via WhatsApp

### Para Administradores

1. **Upload**: Adicionar novas camisas com imagem, título, time e tags
2. **Gerenciar**: Editar ou deletar camisas existentes
3. **Usuários**: Ativar/desativar assinaturas de revendedores

## Estrutura de Pastas

```
src/
├── components/
│   ├── AdminDashboard.tsx    # Painel admin
│   ├── UserCatalog.tsx       # Catálogo para revendedores
│   ├── LandingPage.tsx       # Página inicial
│   ├── Header.tsx            # Cabeçalho da aplicação
│   ├── PaymentPage.tsx       # Página de pagamentos
│   └── SubscriptionRequired.tsx  # Aviso de assinatura
├── contexts/
│   └── AuthContext.tsx       # Gerenciamento de autenticação
├── lib/
│   └── supabase.ts          # Cliente Supabase e tipos
├── App.tsx                   # Componente principal
└── main.tsx                  # Entry point
```

## Segurança

- RLS (Row Level Security) habilitado em todas as tabelas
- Autenticação obrigatória para todas as operações
- Validação de assinatura ativa para acessar catálogo
- Admins têm acesso total, revendedores acesso limitado
- Storage com políticas de acesso controladas

## Suporte

Para suporte técnico ou dúvidas, entre em contato com o administrador da plataforma.

## Licença

Proprietary - Todos os direitos reservados
