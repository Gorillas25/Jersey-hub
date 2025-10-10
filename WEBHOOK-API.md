# 🔌 Documentação da API Webhook - JerseyHub

## Endpoint Webhook

Quando um revendedor clica em "Enviar para cliente", o JerseyHub faz uma requisição POST para o webhook configurado.

## Configuração

Edite a URL do webhook em `src/components/UserCatalog.tsx`:

```typescript
const WEBHOOK_URL = 'https://sua-instancia-n8n.com/webhook/jerseyhub';
```

## Request

### Method
```
POST
```

### Headers
```
Content-Type: application/json
```

### Body (JSON)

```json
{
  "cliente": "+55 11 91234-5678",
  "usuario": "revendedor@exemplo.com",
  "imagens": [
    "https://seu-storage.supabase.co/storage/v1/object/public/jerseys/camisa1.jpg",
    "https://seu-storage.supabase.co/storage/v1/object/public/jerseys/camisa2.jpg",
    "https://seu-storage.supabase.co/storage/v1/object/public/jerseys/camisa3.jpg"
  ]
}
```

### Campos

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `cliente` | string | Número do WhatsApp do cliente no formato internacional | "+55 11 91234-5678" |
| `usuario` | string | Email do revendedor que está enviando | "vendedor@exemplo.com" |
| `imagens` | string[] | Array com URLs públicas das imagens selecionadas | ["https://...", "https://..."] |

## Response Esperada

### Sucesso (200 OK)

```json
{
  "success": true,
  "message": "Mensagens enviadas com sucesso",
  "enviados": 3
}
```

### Erro (4xx ou 5xx)

```json
{
  "success": false,
  "error": "Descrição do erro",
  "details": "Detalhes adicionais"
}
```

## Exemplo de Implementação n8n

### Workflow Básico

1. **Webhook Trigger** - Recebe o POST do JerseyHub
2. **Function Node** - Processa os dados
3. **Loop nas Imagens** - Itera sobre o array de imagens
4. **Evolution API** - Envia cada imagem para o WhatsApp
5. **Response Node** - Retorna sucesso/erro para o JerseyHub

### Código da Function Node

```javascript
// Extrair dados do webhook
const cliente = $input.item.json.body.cliente;
const usuario = $input.item.json.body.usuario;
const imagens = $input.item.json.body.imagens;

// Validações
if (!cliente || !imagens || imagens.length === 0) {
  throw new Error('Dados inválidos');
}

// Formatar número do WhatsApp (remover caracteres especiais)
const numeroLimpo = cliente.replace(/\D/g, '');

// Preparar mensagem inicial
const mensagemInicial = `Olá! O revendedor *${usuario}* selecionou ${imagens.length} camisa${imagens.length > 1 ? 's' : ''} para você.\n\nConfira as opções abaixo:`;

// Retornar dados estruturados
return {
  json: {
    cliente: numeroLimpo,
    clienteOriginal: cliente,
    usuario: usuario,
    mensagemInicial: mensagemInicial,
    totalImagens: imagens.length,
    imagens: imagens
  }
};
```

### Envio para Evolution API

**Node 1: Enviar Mensagem de Texto**
```javascript
// Evolution API - Send Text
{
  "number": "{{ $json.cliente }}",
  "text": "{{ $json.mensagemInicial }}"
}
```

**Node 2: Loop e Enviar Imagens**
```javascript
// Loop sobre as imagens e enviar cada uma
// Evolution API - Send Media
{
  "number": "{{ $json.cliente }}",
  "mediaUrl": "{{ $item.0.$json.imagens[$itemIndex] }}",
  "caption": "Camisa {{ $itemIndex + 1 }}"
}
```

## Registro de Logs

Todos os envios são registrados automaticamente na tabela `webhook_logs`:

```sql
SELECT
  w.created_at,
  w.client_phone,
  p.email as revendedor_email,
  w.status,
  array_length(w.jersey_ids, 1) as total_camisas
FROM webhook_logs w
JOIN profiles p ON w.reseller_id = p.id
ORDER BY w.created_at DESC;
```

## Testando o Webhook

### Com cURL

```bash
curl -X POST https://sua-instancia-n8n.com/webhook/jerseyhub \
  -H "Content-Type: application/json" \
  -d '{
    "cliente": "+55 11 99999-9999",
    "usuario": "teste@exemplo.com",
    "imagens": [
      "https://exemplo.com/camisa1.jpg",
      "https://exemplo.com/camisa2.jpg"
    ]
  }'
```

### Com Postman

1. Method: `POST`
2. URL: `https://sua-instancia-n8n.com/webhook/jerseyhub`
3. Headers:
   - `Content-Type`: `application/json`
4. Body (raw JSON):
```json
{
  "cliente": "+55 11 99999-9999",
  "usuario": "teste@exemplo.com",
  "imagens": [
    "https://exemplo.com/camisa1.jpg"
  ]
}
```

## Integração com Evolution API

### Configuração da Evolution API

1. Instale a Evolution API seguindo a documentação oficial
2. Crie uma instância e conecte com WhatsApp via QR Code
3. Obtenha a API Key da sua instância
4. Configure no n8n as credenciais da Evolution API

### Endpoints Úteis da Evolution API

**Enviar Texto:**
```
POST /message/sendText/{instance}
Body: { "number": "5511999999999", "text": "Mensagem" }
```

**Enviar Mídia:**
```
POST /message/sendMedia/{instance}
Body: {
  "number": "5511999999999",
  "mediaUrl": "https://url-da-imagem.jpg",
  "caption": "Legenda"
}
```

## Troubleshooting

### Erro: "Failed to fetch"
- Verifique se o n8n está rodando e acessível
- Confirme a URL do webhook
- Verifique se há CORS configurado (não necessário para webhooks)

### Erro: "Timeout"
- O webhook pode estar demorando muito para processar
- Considere processar assíncronamente
- Retorne resposta imediata e processe em background

### Imagens não aparecem no WhatsApp
- Certifique-se de que as URLs são públicas
- Teste acessar as URLs diretamente no navegador
- Verifique se o storage bucket está público no Supabase

### Número do WhatsApp inválido
- Use formato internacional: +55 (DDD) número
- Evolution API aceita com ou sem símbolos
- Exemplo válido: +5511999999999 ou 5511999999999

## Melhorias Sugeridas

1. **Fila de Processamento**: Usar Redis ou BullMQ para processar envios em background
2. **Retry Logic**: Tentar reenviar em caso de falha
3. **Rate Limiting**: Evitar spam e respeitar limites do WhatsApp
4. **Templates**: Criar templates de mensagem personalizáveis
5. **Analytics**: Rastrear taxa de abertura e resposta dos clientes

## Segurança

- ✅ Webhook deve estar protegido com HTTPS
- ✅ Considere adicionar autenticação (Bearer Token)
- ✅ Valide os dados recebidos antes de processar
- ✅ Implemente rate limiting no webhook
- ✅ Registre todos os acessos para auditoria

---

**Versão da API**: 1.0
**Última atualização**: 2024
