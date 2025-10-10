# 🚀 Guia de Início Rápido - JerseyHub

## Passo 1: Verificar Configuração

O banco de dados já foi criado automaticamente. Verifique se o arquivo `.env` contém as credenciais do Supabase:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Passo 2: Criar Primeiro Administrador

1. **Cadastre-se** pela interface da aplicação (vai abrir automaticamente)
2. **Acesse o Supabase Dashboard**: https://supabase.com/dashboard
3. Navegue até: **Authentication → Users**
4. Copie o **UUID** do usuário que você acabou de criar
5. Vá em: **SQL Editor**
6. Execute este comando (substituindo o UUID):

```sql
UPDATE profiles
SET role = 'admin',
    subscription_status = 'active'
WHERE id = 'COLE_SEU_UUID_AQUI';
```

7. **Faça logout e login novamente** na aplicação

## Passo 3: Adicionar Camisas (Como Admin)

1. Clique em **"Cadastrar Nova Camisa"**
2. Preencha:
   - **Título**: Ex: "Flamengo Home 2024"
   - **Nome do Time**: Ex: "Flamengo"
   - **Tags**: Ex: "2024, home, brasileiro" (separado por vírgula)
   - **Imagem**: Faça upload da foto da camisa
3. Clique em **"Cadastrar"**

## Passo 4: Configurar Webhook n8n

### 4.1 - Instalar Evolution API

Siga as instruções em: https://doc.evolution-api.com/

### 4.2 - Configurar n8n

1. Instale o n8n: https://n8n.io/
2. Importe o workflow do arquivo `n8n-workflow-example.json`
3. Configure a integração com Evolution API
4. Ative o webhook e copie a URL gerada

### 4.3 - Atualizar URL no JerseyHub

Edite o arquivo `src/components/UserCatalog.tsx`:

```typescript
// Linha 6 - substitua pela sua URL do n8n
const WEBHOOK_URL = 'https://sua-instancia-n8n.com/webhook/jerseyhub';
```

Depois rode:
```bash
npm run build
```

## Passo 5: Criar Revendedores

### Como Admin:

1. Vá na aba **"Usuários"** no painel admin
2. Quando um novo usuário se cadastrar, ele aparecerá aqui
3. Clique em **"Ativar (1 mês)"** para dar acesso

### Como Revendedor (teste):

1. Faça logout
2. Cadastre-se com outro email
3. Faça login como admin novamente
4. Ative a assinatura do novo usuário

## Passo 6: Testar Envio para WhatsApp

1. Faça login como **revendedor**
2. No catálogo, **selecione algumas camisas** (clique para marcar)
3. Clique em **"Enviar para cliente (X)"**
4. Digite o número do WhatsApp no formato: **+55 11 91234-5678**
5. Clique em **"Enviar"**
6. As imagens serão enviadas automaticamente via n8n

## 📋 Checklist de Verificação

- [ ] Supabase configurado no `.env`
- [ ] Primeiro admin criado via SQL
- [ ] Pelo menos 3 camisas cadastradas
- [ ] n8n configurado com Evolution API
- [ ] URL do webhook atualizada no código
- [ ] Pelo menos 1 revendedor com assinatura ativa
- [ ] Teste de envio para WhatsApp realizado

## 🎯 Próximos Passos

### Integrar Pagamentos Stripe

1. Crie conta no Stripe: https://stripe.com
2. Obtenha as chaves de API
3. Implemente o checkout no `PaymentPage.tsx`
4. Configure webhooks do Stripe para atualizar assinaturas automaticamente

### Personalizações Sugeridas

- Adicionar mais campos nas camisas (preço, tamanhos disponíveis)
- Criar relatórios de envios por revendedor
- Adicionar notificações por email
- Implementar sistema de favoritos
- Adicionar mais filtros (por ano, liga, etc.)

## ❓ Problemas Comuns

### "Assinatura Necessária" aparecendo para admin
- Certifique-se de que executou o SQL corretamente
- Faça logout e login novamente
- Verifique no Supabase se o role está como 'admin'

### Upload de imagens não funciona
- Verifique as permissões do Storage no Supabase
- O bucket 'jerseys' deve estar público
- As policies RLS devem estar ativas

### Webhook não envia para WhatsApp
- Confirme que o n8n está rodando
- Teste a URL do webhook diretamente com Postman
- Verifique os logs do n8n
- Certifique-se de que Evolution API está conectada

## 📞 Suporte

Para dúvidas ou problemas, verifique:
- Logs do navegador (F12 → Console)
- Logs do Supabase Dashboard
- Logs do n8n
- README.md completo

---

**Desenvolvido para revendedores de camisas de futebol no Brasil** ⚽🇧🇷
