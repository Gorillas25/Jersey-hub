import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

async function sendEmailViaResend(
  to: string,
  subject: string,
  html: string
) {
  if (!RESEND_API_KEY) {
    console.log("Resend API Key não configurada. Email simulado:");
    console.log("Para:", to);
    console.log("Assunto:", subject);
    console.log("HTML:", html);
    return { success: true, simulated: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "JerseyHub <noreply@jerseyhub.com>",
      to: [to],
      subject: subject,
      html: html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }

  return await response.json();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { email, name, username, password, planName } = await req.json();

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #334155;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            width: 60px;
            height: 60px;
            background: #10b981;
            border-radius: 12px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 15px;
          }
          h1 {
            color: #0f172a;
            font-size: 24px;
            margin: 0;
          }
          .credentials-box {
            background: #f1f5f9;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
          }
          .credential-item {
            margin: 15px 0;
          }
          .credential-label {
            font-weight: 600;
            color: #64748b;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .credential-value {
            font-size: 18px;
            color: #0f172a;
            font-weight: 600;
            margin-top: 5px;
            font-family: 'Courier New', monospace;
            background: white;
            padding: 10px;
            border-radius: 6px;
            border: 2px solid #e2e8f0;
          }
          .button {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
          }
          .info-box {
            background: #ecfdf5;
            border-left: 4px solid #10b981;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">⚽</div>
            <h1>Bem-vindo ao JerseyHub!</h1>
          </div>

          <p>Olá <strong>${name}</strong>,</p>

          <p>Seu pagamento foi confirmado com sucesso! Sua conta no <strong>JerseyHub</strong> foi criada e está pronta para uso.</p>

          <p><strong>Plano contratado:</strong> ${planName}</p>

          <div class="credentials-box">
            <h2 style="margin-top: 0; font-size: 18px;">Suas Credenciais de Acesso</h2>

            <div class="credential-item">
              <div class="credential-label">Email / Username</div>
              <div class="credential-value">${email}</div>
            </div>

            <div class="credential-item">
              <div class="credential-label">Senha</div>
              <div class="credential-value">${password}</div>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="https://jerseyhub.com" class="button">Acessar JerseyHub</a>
          </div>

          <div class="info-box">
            <strong>⚠️ Importante:</strong> Guarde esta senha em local seguro. Recomendamos que você altere sua senha após o primeiro acesso.
          </div>

          <h3>Próximos Passos:</h3>
          <ol>
            <li>Acesse o JerseyHub usando suas credenciais</li>
            <li>Navegue pelo catálogo completo de camisas</li>
            <li>Selecione as camisas e envie para seus clientes via WhatsApp</li>
            <li>Aproveite todos os recursos da plataforma!</li>
          </ol>

          <div class="footer">
            <p>Se você não realizou este pagamento, entre em contato conosco imediatamente.</p>
            <p>JerseyHub - Catálogo de Camisas para Revendedores</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await sendEmailViaResend(
      email,
      `🎉 Sua conta JerseyHub foi criada! - Credenciais de acesso`,
      html
    );

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
