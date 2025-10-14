import { CreditCard, Check } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

// --- PASSO 1: INICIALIZE O STRIPE ---
// Usamos a Chave Publicável que você configurou no seu arquivo .env
// Esta linha deve ficar fora do componente para não ser recriada a cada renderização.
export function PaymentPage() {

   const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  
  // --- PASSO 2: CRIE A FUNÇÃO DE REDIRECIONAMENTO ---
  const handleSubscribeClick = async (priceId: string) => {
    setLoadingPriceId(priceId);

       try {
      // --- A MÁGICA ACONTECE AQUI ---
      // 1. Chamamos a NOSSA Supabase Function 'create-checkout'
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId: priceId }, // Enviamos o ID do preço no corpo da requisição
      });

      if (error) {
        // Se a função do Supabase der erro, nós o jogamos para o catch
        throw error;
      }

      // 2. A função nos devolve a URL de checkout segura do Stripe
      const { url } = data;

      // 3. Redirecionamos o usuário para a URL que o Stripe nos deu
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('URL de checkout não recebida.');
      }

    } catch (error: any) {
      console.error("Erro ao criar a sessão de checkout:", error);
      alert(`Erro ao iniciar pagamento: ${error.message}`);
      setLoadingPriceId(null); // Desativa o loading em caso de erro
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Escolha seu Plano
            </h1>
            <p className="text-xl text-slate-300">
              Acesso ilimitado ao catálogo completo de camisas
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col">
              <div className="mb-6">
                <span className="inline-block bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold mb-3">
                  Preço de Lançamento
                </span>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Plano Mensal</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl font-bold text-slate-900">R$39,90</span>
                  <span className="text-slate-600">/mês</span>
                </div>
                <p className="text-slate-500">De <span className="line-through">R$ 54,00</span> por mês</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-1" />
                  <span className="text-slate-700">
                    Acesso completo ao catálogo de camisas
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-1" />
                  <span className="text-slate-700">Geração de catálogos personalizados</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-1" />
                  <span className="text-slate-700">Atualizações constantes do catálogo</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-1" />
                  <span className="text-slate-700">Suporte prioritário</span>
                </li>
              </ul>

              <button
                onClick={() => handleSubscribeClick('price_1SHuLcFaQzrWkh95UFyri85i')}
                disabled={!!loadingPriceId}
                className="mt-auto w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-4 rounded-lg transition flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                  {loadingPriceId === 'price_1SHuLcFaQzrWkh95UFyri85i' ? 'Carregando...' : 'Assinar Plano Mensal'}
              </button>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-8 shadow-2xl relative flex flex-col">
              <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold">
                Mais Popular
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Plano Trimestral</h3>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-bold text-white">R$ 145,90</span>
                  <span className="text-emerald-100">/3 meses</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-1" />
                  <span className="text-white">Acesso completo ao catálogo de camisas</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-1" />
                  <span className="text-white">Geração de catálogos personalizados</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-1" />
                  <span className="text-white">Atualizações constantes do catálogo</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-1" />
                  <span className="text-white">Suporte prioritário</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-1" />
                  <span className="text-white font-semibold">
                    Desconto de 10% no total
                  </span>
                </li>
              </ul>

              <button
                onClick={() => handleSubscribeClick('price_1SHuMSFaQzrWkh95bdK2oZBA')}
                disabled={!!loadingPriceId}
                className="mt-auto w-full bg-white hover:bg-slate-50 text-emerald-600 font-semibold py-4 rounded-lg transition flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                {loadingPriceId === 'price_1SHuMSFaQzrWkh95bdK2oZBA' ? 'Carregando...' : 'Assinar Plano Trimestral'}
              </button>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-slate-300 mb-4">
              Pagamento seguro processado pelo Stripe
            </p>
            <p className="text-slate-400 text-sm">
              Cancele a qualquer momento. Sem taxas ocultas.
            </p>
          </div>

          <div className="mt-12 bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-xl font-semibold text-white mb-4">
              Perguntas Frequentes
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-white font-medium mb-2">
                  Como funciona o período de teste?
                </h4>
                <p className="text-slate-400 text-sm">
                  Após o cadastro, o administrador ativa sua assinatura manualmente. Entre em
                  contato para ativar seu acesso.
                </p>
              </div>
              <div>
                <h4 className="text-white font-medium mb-2">Posso cancelar a qualquer momento?</h4>
                <p className="text-slate-400 text-sm">
                  Sim, você pode cancelar sua assinatura a qualquer momento. Seu acesso continua
                  até o fim do período pago.
                </p>
              </div>
              <div>
                <h4 className="text-white font-medium mb-2">
                  Como funciona o envio para o cliente?
                </h4>
                {/* --- TEXTO ATUALIZADO AQUI --- */}
                <p className="text-slate-400 text-sm">
                  Você seleciona as camisas que seu cliente tem interesse e a plataforma gera um catálogo online, exclusivo e personalizado, com um link único pronto para você enviar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}