// Local: supabase/functions/create-checkout/index.ts

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@14";

// Inicializa o Stripe com a chave secreta que está nas "Secrets" do seu Supabase
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  // A versão da API é importante, mantenha a que o Stripe recomenda ou uma recente
  apiVersion: "2024-06-20", 
});

// --- MELHORIA DE SEGURANÇA: Lista de origens permitidas ---
const allowedOrigins = [
  'http://localhost:5173', // Para seu desenvolvimento local
  'https://jersey-hub-eight.vercel.app' // Para seu site em produção
];

Deno.serve(async (req: Request) => {
  // Pega a origem da requisição para verificar se está na nossa lista
  const origin = req.headers.get("origin") || "";
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // O manipulador de OPTIONS é essencial para o CORS funcionar
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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
      success_url: `${origin}/catalogo?pagamento=sucesso`, // Usamos a origem da requisição
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