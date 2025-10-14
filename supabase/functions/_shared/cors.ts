// Local: supabase/functions/_shared/cors.ts

// Lista de sites que têm permissão para chamar nossas funções
const allowedOrigins = [
  'http://localhost:5173', // Para seu desenvolvimento local
  'https://jersey-hub-eight.vercel.app', // Seu site em produção na Vercel
  'https://jerseyhub.com.br' // Seu domínio principal
];

export const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigins.join(', '), // Permite as origens da lista
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};