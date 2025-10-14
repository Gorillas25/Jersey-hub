// Local: supabase/functions/create-user-from-stripe/index.ts

import { createClient } from "jsr:@supabase/supabase-js@2";

// Lista de origens permitidas
const allowedOrigins = [
  'http://localhost:5173',
  'https://jersey-hub-eight.vercel.app',
  'https://www.jerseyhub.com.br',
  'https://jerseyhub.com.br'
];

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin") || "";
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // --- MUDANÇA PRINCIPAL AQUI ---
    // 1. Cria o usuário no sistema de autenticação
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
    });

    if (authError) throw authError;

    // 2. RETORNA o ID do usuário recém-criado para o n8n
    return new Response(
      JSON.stringify({ userId: authData.user.id }), // Devolve o "CPF"
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});