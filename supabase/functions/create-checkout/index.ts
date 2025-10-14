// Local: supabase/functions/create-checkout/index.ts

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@14";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2024-06-20",
});

// A nossa "Lista VIP" de endereços permitidos
const allowedOrigins = [
  'http://localhost:5173',
  'https://jersey-hub-eight.vercel.app', // O endereço da Vercel
  'https://www.jerseyhub.com.br',       // Seu domínio com www
  'https://jerseyhub.com.br'            // Seu domínio sem www
];

Deno.serve(async (req: Request) => {
  // --- A LÓGICA CORRETA E DINÂMICA ---
  // 1. O porteiro pergunta: "De onde você vem?"
  const origin = req.headers.get("origin") || "";

  // 2. O porteiro prepara uma resposta padrão e segura
  let corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigins[0], // Resposta padrão para evitar erros
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // 3. Se o convidado está na lista VIP, o porteiro grita o nome DELE!
  if (allowedOrigins.includes(origin)) {
    corsHeaders['Access-Control-Allow-Origin'] = origin;
  }

  // Resposta padrão para a "verificação" do navegador (método OPTIONS)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // O resto da sua lógica continua exatamente igual...
  try {
    const { priceId, customerEmail } = await req.json();

    if (!priceId) {
      return new Response(
        JSON.stringify({ error: "priceId é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/catalogo?pagamento=sucesso`,
      cancel_url: `${origin}/planos`,
      allow_promotion_codes: true,
    };

    if (customerEmail) {
      sessionParams.customer_email = customerEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});