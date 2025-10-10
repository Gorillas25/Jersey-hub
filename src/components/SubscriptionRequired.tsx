import { Lock, CreditCard } from 'lucide-react';

export function SubscriptionRequired() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
          <Lock className="w-8 h-8 text-red-600" />
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-4">Assinatura Necessária</h2>

        <p className="text-slate-600 mb-6">
          Sua conta foi criada com sucesso! Para acessar o catálogo de camisas, você precisa de
          uma assinatura ativa.
        </p>

        <div className="bg-slate-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-slate-900 mb-3">Como ativar sua assinatura:</h3>
          <ol className="text-left text-sm text-slate-700 space-y-2">
            <li className="flex gap-2">
              <span className="font-bold">1.</span>
              <span>Entre em contato com o administrador</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">2.</span>
              <span>Realize o pagamento da assinatura</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">3.</span>
              <span>Aguarde a ativação pelo administrador</span>
            </li>
          </ol>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <h4 className="font-semibold text-emerald-900">Planos Disponíveis</h4>
          </div>
          <p className="text-sm text-emerald-800">
            <strong>Mensal:</strong> R$ 97/mês
            <br />
            <strong>Trimestral:</strong> R$ 247 (economize R$ 44)
          </p>
        </div>

        <p className="text-xs text-slate-500 mt-6">
          Você receberá acesso completo assim que sua assinatura for ativada
        </p>
      </div>
    </div>
  );
}
