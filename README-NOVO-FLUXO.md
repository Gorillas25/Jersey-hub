# JerseyHub - Catálogo Privado de Camisas (Atualizado)

## Novo Fluxo: Pagamento Primeiro, Cadastro Automático

O JerseyHub agora opera com um modelo **"pague primeiro"**: apenas após o pagamento ser confirmado via Stripe, o usuário é criado automaticamente no sistema e recebe suas credenciais por email.

---

## Como Funciona Agora

### Para o Cliente Final (Revendedor):

1. **Acessa a Landing Page** e clica em "Assinar e acessar catálogo"
2. **Escolhe um plano** (Mensal ou Trimestral)
3. **Paga via Stripe Checkout** com cartão de crédito
4. **Recebe email automático** com:
   - Email de login (o mesmo usado no checkout)
   - Senha gerada automaticamente
   - Instruções de acesso
5. **Faz login** e acessa o catálogo imediatamente

### Para o Administrador:

- Sem necessidade de ativar manualmente cada usuário
- Sistema totalmente automatizado
- Apenas gerencia camisas e visualiza usuários

---

## Configuração Completa

### 1. Configurar Stripe

#### Criar Conta e Obter Chaves

1. Crie conta em [stripe.com](https://stripe.com)
2. Acesse **Developers → API Keys**
3. Copie:
   - **Publishable key** (pk_test_...)
   - **Secret key** (sk_test_...)

#### Criar Produtos no Stripe Dashboard

**Produto 1: Plano Mensal**
- Name: JerseyHub - Plano Mensal
- Price: R$ 97,00
- Billing: Monthly
- Currency: BRL

**Produto 2: Plano Trimestral**
- Name: JerseyHub - Plano Trimestral
- Price: R$ 247,00
- Billing: Every 3 months
- Currency: BRL

Copie os **Price IDs** (começam com `price_...`)

#### Atualizar Código com Price IDs

Edite `src/components/LandingPage.tsx`:

```typescript
const STRIPE_PRICE_MONTHLY = 'price_SEU_ID_MENSAL';
const STRIPE_PRICE_QUARTERLY = 'price_SEU_ID_TRIMESTRAL';
```

### 2. Deploy das Edge Functions

#### 2.1 - Configurar Variáveis de Ambiente no Supabase

No Supabase Dashboard → Project Settings → Edge Functions:

```
STRIPE_SECRET_KEY=sk_test_sua_chave
STRIPE_WEBHOOK_SECRET=whsec_seu_secret (será obtido no passo 2.3)
RESEND_API_KEY=re_sua_chave (opcional, para envio de emails)
```

#### 2.2 - Deploy das Funções

Você precisa fazer o deploy das 3 Edge Functions:

```bash
# 1. Função de criar checkout
supabase functions deploy create-checkout --no-verify-jwt

# 2. Função de webhook Stripe (cria usuário automaticamente)
supabase functions deploy stripe-webhook --no-verify-jwt

# 3. Função de envio de email
supabase functions deploy send-credentials-email --no-verify-jwt
```

#### 2.3 - Configurar Webhook no Stripe

1. No Stripe Dashboard → **Developers → Webhooks**
2. Clique em **Add endpoint**
3. URL: `https://SEU_PROJETO.supabase.co/functions/v1/stripe-webhook`
4. Selecione eventos:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
5. Copie o **Signing secret** (whsec_...)
6. Adicione nas variáveis de ambiente do Supabase:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### 3. Configurar Email (Opcional mas Recomendado)

Para enviar emails automaticamente com as credenciais, use Resend:

1. Crie conta em [resend.com](https://resend.com)
2. Obtenha a API Key
3. Adicione ao Supabase:
   ```
   RESEND_API_KEY=re_sua_chave
   ```

Se não configurar, as credenciais serão apenas logadas no console (útil para testes).

### 4. Criar Primeiro Admin

Como não há mais cadastro público, você precisa criar o admin manualmente:

**Opção A: Via Stripe** (Recomendado para produção)
1. Faça um pagamento teste na sua própria aplicação
2. Use seu email
3. Após receber as credenciais, faça login
4. No Supabase, execute:
   ```sql
   UPDATE profiles
   SET role = 'admin'
   WHERE email = 'seu@email.com';
   ```

**Opção B: Criar Manualmente no Supabase**
1. Supabase Dashboard → Authentication → Users
2. Clique em **Add user**
3. Email: seu@email.com
4. Password: (escolha uma senha)
5. Confirm: ✅
6. Depois execute no SQL Editor:
   ```sql
   UPDATE profiles
   SET role = 'admin',
       subscription_status = 'active'
   WHERE email = 'seu@email.com';
   ```

---

## Fluxo de Pagamento Detalhado

### O que acontece quando alguém paga:

1. **Cliente clica** em "Assinar Plano Mensal/Trimestral"
2. **Frontend chama** Edge Function `create-checkout`
3. **Stripe cria** sessão de checkout
4. **Cliente paga** no Stripe Checkout
5. **Stripe envia webhook** para `stripe-webhook` function
6. **Edge Function:**
   - Verifica o pagamento
   - Gera username aleatório baseado no nome
   - Gera senha segura de 12 caracteres
   - Cria usuário no Supabase Auth
   - Atualiza profile com status de assinatura
   - Chama `send-credentials-email`
7. **Email enviado** com credenciais
8. **Cliente recebe email** e faz login

### Geração de Credenciais

**Username:**
- Remove acentos e caracteres especiais
- Adiciona 4 dígitos aleatórios
- Exemplo: "João Silva" → "joaosilva1234"

**Senha:**
- 12 caracteres aleatórios
- Letras maiúsculas, minúsculas, números e símbolos
- Exemplo: "aB3$mK9#pL2@"

---

## Estrutura de Arquivos das Edge Functions

```
supabase/functions/
├── create-checkout/
│   └── index.ts          # Cria sessão Stripe Checkout
├── stripe-webhook/
│   └── index.ts          # Processa pagamentos e cria usuários
└── send-credentials-email/
    └── index.ts          # Envia email com credenciais
```

---

## Testes

### Testar Pagamento (Cartões de Teste Stripe)

Use estes cartões no checkout:

- **Sucesso**: 4242 4242 4242 4242
- **Falha**: 4000 0000 0000 0002
- **Requer 3D Secure**: 4000 0027 6000 3184

**Dados adicionais:**
- CVC: Qualquer 3 dígitos
- Data: Qualquer data futura
- CEP: Qualquer CEP válido

### Testar Fluxo Completo

1. Acesse a aplicação
2. Clique em "Assinar e acessar catálogo"
3. Escolha um plano
4. Complete o checkout com cartão de teste
5. Aguarde redirecionamento para página de sucesso
6. Verifique o console do webhook no Supabase para ver as credenciais
7. Faça login com as credenciais geradas

---

## Diferenças do Fluxo Antigo

| Aspecto | Antes | Agora |
|---------|-------|-------|
| Cadastro | Livre, qualquer um | Apenas após pagamento |
| Ativação | Manual pelo admin | Automática pelo webhook |
| Credenciais | Escolhidas pelo usuário | Geradas automaticamente |
| Email | Não tinha | Enviado automaticamente |
| Senha | Definida no cadastro | Gerada e enviada por email |

---

## Troubleshooting

### "Erro ao criar checkout"
- Verifique se os Price IDs estão corretos no `LandingPage.tsx`
- Confirme que a Edge Function `create-checkout` foi deployed
- Verifique a STRIPE_SECRET_KEY no Supabase

### "Usuário não foi criado após pagamento"
- Verifique logs da Edge Function `stripe-webhook` no Supabase
- Confirme que o webhook está configurado no Stripe
- Verifique o STRIPE_WEBHOOK_SECRET
- Teste o webhook no Stripe Dashboard

### "Email não chegou"
- Verifique se RESEND_API_KEY está configurada
- Olhe os logs da função `send-credentials-email`
- Verifique spam/lixeira
- Se não configurou Resend, as credenciais estão no console

### "Não consigo fazer login"
- Aguarde alguns minutos após o pagamento
- Verifique no Supabase Auth se o usuário foi criado
- Olhe os logs do webhook para pegar as credenciais
- Tente resetar a senha no Supabase manualmente

---

## Variáveis de Ambiente Necessárias

### Frontend (.env)
```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Supabase Edge Functions
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_... (opcional)
SUPABASE_URL=https://seu-projeto.supabase.co (automático)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (automático)
SUPABASE_ANON_KEY=eyJ... (automático)
```

---

## Segurança

- Secret keys nunca vão pro frontend
- Webhook signature é verificada
- Emails confirmados automaticamente
- RLS protege dados no banco
- Senhas geradas são fortes (12 chars)

---

## Produção

Antes de ir para produção:

1. ✅ Trocar chaves de teste por produção
2. ✅ Configurar domínio personalizado
3. ✅ Testar fluxo completo com pagamento real
4. ✅ Configurar Resend para envio de emails
5. ✅ Monitorar webhooks no Stripe
6. ✅ Testar recuperação de senha

---

**O JerseyHub agora é 100% automatizado desde o pagamento até o acesso!** 🚀
