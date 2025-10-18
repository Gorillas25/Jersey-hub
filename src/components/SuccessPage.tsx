import { CheckCircle, Mail, Lock, AlertTriangle } from 'lucide-react'; // Adicionamos o AlertTriangle
import { Link } from 'react-router-dom'; // Usamos o Link para uma navegação mais fluida

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
            Sua assinatura do JerseyHub foi ativada com sucesso.
          </p>
        </div>

        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <Mail className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-emerald-900 mb-2">
                Verifique seu e-mail
              </h3>
              {/* --- MUDANÇA 1: AVISO DE SPAM PROATIVO --- */}
              <p className="text-emerald-800 text-sm mb-3">
                Enviamos suas credenciais de acesso para o e-mail cadastrado no checkout.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 flex items-start gap-2 text-sm text-yellow-900">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-px" />
                <span>
                  <strong>Importante:</strong> Se não encontrar na caixa de entrada, verifique sua pasta de <strong>spam</strong> ou lixo eletrônico.
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <Lock className="w-6 h-6 text-slate-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                Primeiros passos
              </h3>
              <ol className="text-slate-700 text-sm space-y-2">
                {/* --- MUDANÇA 2: ASSUNTO DO E-MAIL CORRIGIDO --- */}
                <li>1. Abra o e-mail com o assunto "<strong>✅ Seu acesso ao JerseyHub está liberado!</strong>"</li>
                <li>2. Copie suas credenciais de acesso (login e senha)</li>
                <li>3. Volte aqui e clique no botão abaixo para fazer login</li>
                <li>4. Comece a usar o catálogo!</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Link
            to="/"
            className="block w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-4 rounded-lg transition text-center"
          >
            Ir para a Página Inicial e Fazer Login
          </Link>
        </div>
      </div>
    </div>
  );
}