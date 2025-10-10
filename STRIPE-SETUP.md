# 💳 Guia de Configuração - Stripe

Este guia explica como integrar pagamentos recorrentes com Stripe no JerseyHub.

## Por que Stripe?

- Aceita cartões de crédito brasileiros
- Suporte a pagamentos recorrentes (assinaturas)
- API robusta e bem documentada
- Dashboard completo para gerenciar pagamentos
- Webhooks para automatizar ativação/desativação de assinaturas

## Passo 1: Criar Conta Stripe

1. Acesse: https://dashboard.stripe.com/register
2. Preencha os dados da sua empresa
3. Configure sua conta para o Brasil (BRL)
4. Complete a verificação da conta

## Passo 2: Obter Chaves de API

### Ambiente de Teste

1. Vá em: **Developers → API Keys**
2. Copie a **Publishable key** (começa com `pk_test_`)
3. Copie a **Secret key** (começa com `sk_test_`)

### Ambiente de Produção

Após testes, use as chaves de produção:
- **Publishable key** (começa com `pk_live_`)
- **Secret key** (começa com `sk_live_`)

## Passo 3: Configurar Variáveis de Ambiente

Adicione ao arquivo `.env`:

```env
# Stripe
VITE_STRIPE_PUBLIC_KEY=pk_test_sua_chave_publica
STRIPE_SECRET_KEY=sk_test_sua_chave_secreta
```

⚠️ **IMPORTANTE**: A Secret Key NUNCA deve estar no código frontend!

## Passo 4: Criar Produtos no Stripe

### Via Dashboard

1. Vá em: **Products → Add product**
2. Crie dois produtos:

**Produto 1: Assinatura Mensal**
- Name: JerseyHub - Plano Mensal
- Description: Acesso completo ao catálogo por 1 mês
- Pricing: R$ 97,00
- Billing period: Monthly
- Currency: BRL

**Produto 2: Assinatura Trimestral**
- Name: JerseyHub - Plano Trimestral
- Description: Acesso completo ao catálogo por 3 meses
- Pricing: R$ 247,00
- Billing period: Every 3 months
- Currency: BRL

3. Copie os **Price IDs** de cada produto (começam com `price_`)

## Passo 5: Implementar Frontend

Instale a biblioteca do Stripe:

```bash
npm install @stripe/stripe-js
```

### Atualizar PaymentPage.tsx

```typescript
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export function PaymentPage() {
  const handleCheckout = async (priceId: string) => {
    const stripe = await stripePromise;
    if (!stripe) return;

    // Criar Checkout Session via Edge Function
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId: user?.id,
        }),
      }
    );

    const { sessionId } = await response.json();

    // Redirecionar para Stripe Checkout
    const { error } = await stripe.redirectToCheckout({ sessionId });
    if (error) console.error(error);
  };

  return (
    // ... seu código
    <button onClick={() => handleCheckout('price_mensal')}>
      Assinar Plano Mensal
    </button>
  );
}
```

## Passo 6: Criar Edge Function para Checkout

Crie uma Edge Function no Supabase para criar sessões de checkout:

```typescript
// supabase/functions/create-checkout/index.ts
import Stripe from 'npm:stripe@14';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    const { priceId, userId } = await req.json();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/plans`,
      client_reference_id: userId,
      metadata: { userId },
    });

    return new Response(
      JSON.stringify({ sessionId: session.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
```

Deploy da função:
```bash
supabase functions deploy create-checkout --no-verify-jwt
```

## Passo 7: Configurar Webhooks do Stripe

Os webhooks permitem automatizar a ativação/desativação de assinaturas.

### Criar Edge Function para Webhook

```typescript
// supabase/functions/stripe-webhook/index.ts
import Stripe from 'npm:stripe@14';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

Deno.serve(async (req: Request) => {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!signature || !webhookSecret) {
    return new Response('Missing signature or secret', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;

        if (userId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          await supabase.from('profiles').update({
            subscription_status: 'active',
            subscription_end_date: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
          }).eq('id', userId);
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;

        if (userId) {
          await supabase.from('profiles').update({
            subscription_status: subscription.status === 'active' ? 'active' : 'inactive',
            subscription_end_date: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
          }).eq('id', userId);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

Deploy:
```bash
supabase functions deploy stripe-webhook --no-verify-jwt
```

### Configurar Webhook no Stripe Dashboard

1. Vá em: **Developers → Webhooks**
2. Clique em **Add endpoint**
3. URL: `https://seu-projeto.supabase.co/functions/v1/stripe-webhook`
4. Selecione os eventos:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copie o **Signing secret** (começa com `whsec_`)
6. Adicione ao Supabase Secrets:

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_seu_secret
```

## Passo 8: Adicionar Variáveis ao Supabase

No Supabase Dashboard, vá em **Project Settings → Edge Functions** e adicione:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Passo 9: Testar

### Teste com Cartões Stripe

Use estes cartões de teste:

- **Sucesso**: 4242 4242 4242 4242
- **Falha**: 4000 0000 0000 0002
- **Requer autenticação**: 4000 0027 6000 3184

**CVC**: Qualquer 3 dígitos
**Data**: Qualquer data futura
**CEP**: Qualquer CEP válido

### Fluxo de Teste

1. Faça cadastro como novo usuário
2. Clique em "Assinar Plano Mensal"
3. Complete o checkout com cartão de teste
4. Verifique se a assinatura foi ativada automaticamente
5. Confirme acesso ao catálogo

## Passo 10: Produção

### Antes de ir para produção:

1. ✅ Complete a verificação da conta Stripe
2. ✅ Configure os pagamentos para o Brasil
3. ✅ Troque as chaves de teste pelas de produção
4. ✅ Teste o fluxo completo em produção
5. ✅ Configure notificações de falha de pagamento
6. ✅ Implemente recuperação de pagamentos falhos

### Checklist de Segurança

- [ ] Secret Key NUNCA no frontend
- [ ] Webhook com HTTPS obrigatório
- [ ] Validar signature dos webhooks
- [ ] Logs de todas as transações
- [ ] Monitoramento de fraudes ativo

## Recursos Adicionais

- [Documentação Stripe](https://stripe.com/docs)
- [Stripe no Brasil](https://stripe.com/br)
- [Testing Stripe](https://stripe.com/docs/testing)
- [Webhooks Guide](https://stripe.com/docs/webhooks)

## Suporte Stripe

- Email: support@stripe.com
- Chat: Disponível no Dashboard
- Documentação: https://stripe.com/docs

---

**Nota**: Esta é uma implementação básica. Para produção, considere adicionar:
- Tratamento de erros mais robusto
- Retry logic para webhooks
- Dashboard de gerenciamento de assinaturas
- Cancelamento de assinatura pelo usuário
- Upgrade/downgrade de planos
