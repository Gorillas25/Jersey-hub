import { CheckCircle, Mail, Lock } from 'lucide-react';

export function SuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500 rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Pagamento Confirmado!
          </h1>
          <p className="text-xl text-slate-600">
            Sua assinatura do JerseyHub foi ativada com sucesso
          </p>
        </div>

        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4 mb-4">
            <Mail className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-emerald-900 mb-2">
                Verifique seu email
              </h3>
              <p className="text-emerald-800 text-sm">
                Enviamos suas credenciais de acesso (email e senha) para o email cadastrado no
                checkout. Pode levar alguns minutos para chegar.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Lock className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-emerald-900 mb-2">
                Primeiros passos
              </h3>
              <ol className="text-emerald-800 text-sm space-y-2">
                <li>1. Abra o email com o assunto "Sua conta JerseyHub foi criada"</li>
                <li>2. Copie suas credenciais de acesso</li>
                <li>3. Faça login na plataforma</li>
                <li>4. Comece a usar o catálogo!</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <a
            href="/"
            className="block w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-4 rounded-lg transition text-center"
          >
            Fazer Login Agora
          </a>

          <div className="bg-slate-50 rounded-lg p-6">
            <h3 className="font-semibold text-slate-900 mb-3">
              O que você recebeu:
            </h3>
            <ul className="space-y-2 text-slate-700 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Acesso completo ao catálogo de camisas
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Envio ilimitado para clientes via WhatsApp
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Atualizações automáticas do catálogo
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Suporte prioritário
              </li>
            </ul>
          </div>

          <div className="border-t pt-6">
            <p className="text-slate-600 text-sm text-center">
              Não recebeu o email?{' '}
              <br className="md:hidden" />
              Verifique sua caixa de spam ou entre em contato com o suporte.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
