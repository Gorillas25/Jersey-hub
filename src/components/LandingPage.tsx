import { useState } from 'react';
import { Shirt, Smartphone, Lock, Zap, CreditCard, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const STRIPE_PRICE_MONTHLY = 'price_MONTHLY_ID';
const STRIPE_PRICE_QUARTERLY = 'price_QUARTERLY_ID';

export function LandingPage() {
  const [showLogin, setShowLogin] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Email ou senha incorretos');
        } else {
          setError(error.message);
        }
      }
    } catch (err) {
      setError('Erro ao processar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (priceId: string) => {
    setCheckoutLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ priceId }),
        }
      );

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        alert(`Erro ao criar checkout: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao criar checkout:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (showLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-full mb-4">
              <Shirt className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Entrar</h2>
            <p className="text-slate-600 mt-2">Acesse seu catálogo</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-slate-600 text-sm">
              Ainda não tem conta?{' '}
              <button
                onClick={() => {
                  setShowLogin(false);
                  setShowPlans(true);
                }}
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Assine agora
              </button>
            </p>
            <button
              onClick={() => setShowLogin(false)}
              className="text-slate-500 hover:text-slate-700 text-sm"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showPlans) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4 py-16">
          <button
            onClick={() => setShowPlans(false)}
            className="text-slate-400 hover:text-white mb-8 flex items-center gap-2"
          >
            ← Voltar
          </button>

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
              <div className="bg-white rounded-2xl p-8 shadow-2xl">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Plano Mensal</h3>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-5xl font-bold text-slate-900">R$ 97</span>
                    <span className="text-slate-600">/mês</span>
                  </div>
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
                    <span className="text-slate-700">
                      Envio ilimitado para clientes no WhatsApp
                    </span>
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
                  onClick={() => handleCheckout(STRIPE_PRICE_MONTHLY)}
                  disabled={checkoutLoading}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-4 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CreditCard className="w-5 h-5" />
                  {checkoutLoading ? 'Carregando...' : 'Assinar Plano Mensal'}
                </button>
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-8 shadow-2xl relative">
                <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold">
                  Mais Popular
                </div>

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Plano Trimestral</h3>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-bold text-white">R$ 247</span>
                    <span className="text-emerald-100">/3 meses</span>
                  </div>
                  <p className="text-emerald-100 text-sm">Economize R$ 44</p>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-white flex-shrink-0 mt-1" />
                    <span className="text-white">Acesso completo ao catálogo de camisas</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-white flex-shrink-0 mt-1" />
                    <span className="text-white">
                      Envio ilimitado para clientes no WhatsApp
                    </span>
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
                    <span className="text-white font-semibold">Desconto de 15% no total</span>
                  </li>
                </ul>

                <button
                  onClick={() => handleCheckout(STRIPE_PRICE_QUARTERLY)}
                  disabled={checkoutLoading}
                  className="w-full bg-white hover:bg-slate-50 text-emerald-600 font-semibold py-4 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CreditCard className="w-5 h-5" />
                  {checkoutLoading ? 'Carregando...' : 'Assinar Plano Trimestral'}
                </button>
              </div>
            </div>

            <div className="mt-12 text-center">
              <p className="text-slate-300 mb-2">Pagamento seguro processado pelo Stripe</p>
              <p className="text-slate-400 text-sm">
                Cancele a qualquer momento. Sem taxas ocultas.
              </p>
              <p className="text-slate-300 mt-4">
                Já tem conta?{' '}
                <button
                  onClick={() => {
                    setShowPlans(false);
                    setShowLogin(true);
                  }}
                  className="text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  Fazer login
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500 rounded-full mb-6">
            <Shirt className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            JerseyHub
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-8 leading-relaxed">
            Catálogo privado de camisas de time para revendedores — envie direto para o cliente
            no WhatsApp com um clique
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowPlans(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-lg font-semibold px-8 py-4 rounded-lg transition transform hover:scale-105 shadow-lg"
            >
              Assinar e acessar catálogo
            </button>
            <button
              onClick={() => setShowLogin(true)}
              className="bg-slate-700 hover:bg-slate-600 text-white text-lg font-semibold px-8 py-4 rounded-lg transition shadow-lg"
            >
              Já sou assinante
            </button>
          </div>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto mb-16">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-emerald-500 transition">
            <div className="bg-emerald-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Acesso Exclusivo</h3>
            <p className="text-slate-400">Catálogo privado apenas para assinantes pagantes</p>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-emerald-500 transition">
            <div className="bg-emerald-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Shirt className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Catálogo Completo</h3>
            <p className="text-slate-400">
              Todas as camisas organizadas por time e temporada
            </p>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-emerald-500 transition">
            <div className="bg-emerald-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Envio Direto</h3>
            <p className="text-slate-400">
              Selecione as camisas e envie para o cliente no WhatsApp
            </p>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-emerald-500 transition">
            <div className="bg-emerald-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Rápido e Fácil</h3>
            <p className="text-slate-400">Sem downloads, tudo automatizado em segundos</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto bg-slate-800 rounded-xl p-8 border border-slate-700">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">Como funciona?</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-emerald-500 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="text-white font-semibold mb-1">Assine um dos planos</h4>
                <p className="text-slate-400">
                  Escolha entre mensal ou trimestral e receba suas credenciais por email
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-emerald-500 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="text-white font-semibold mb-1">Navegue pelo catálogo</h4>
                <p className="text-slate-400">
                  Explore todas as camisas disponíveis com filtros por time e tags
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-emerald-500 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="text-white font-semibold mb-1">Selecione e envie</h4>
                <p className="text-slate-400">
                  Escolha as camisas, digite o número do cliente e envie direto no WhatsApp
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
