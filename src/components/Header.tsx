import { LogOut, Shirt } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Header() {
  const { profile, signOut } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 w-10 h-10 rounded-lg flex items-center justify-center">
              <Shirt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">JerseyHub</h1>
              {profile && (
                <p className="text-xs text-slate-600">
                  {profile.role === 'admin' ? 'Administrador' : 'Revendedor'}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {profile && (
              <>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-slate-900">{profile.email}</p>
                  <p className="text-xs text-slate-600">
                    {profile.subscription_status === 'active' ? (
                      <span className="text-emerald-600 font-medium">Assinatura Ativa</span>
                    ) : (
                      <span className="text-red-600 font-medium">Assinatura Inativa</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
