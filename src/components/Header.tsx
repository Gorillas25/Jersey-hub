import { useState } from 'react';
import { LogOut, UserCircle, ChevronDown, ChevronUp, Shirt } from 'lucide-react';
import { Link } from 'react-router-dom'; // PASSO 1: Importamos o Link
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase'; // Assumindo que você importe o supabase aqui para o signOut

export function Header() {
  const { user, profile, isAdmin } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setDropdownOpen(false); // Fecha o dropdown ao sair
    // O onAuthStateChange no AuthContext vai lidar com a atualização do estado
  };

  const getInitials = (email: string | undefined) => {
    return email ? email.substring(0, 2).toUpperCase() : '?';
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-emerald-500 p-2 rounded-lg">
            <Shirt className="w-6 h-6 text-white" /> 
          </div>
          <span className="text-xl font-bold text-slate-900">JerseyHub</span>
          {profile && (
            <span className="text-sm bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full ml-2">
              {isAdmin ? 'Admin' : 'Revendedor'}
            </span>
          )}
        </Link>

        {/* User Info & Actions */}
        {user && profile && (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-semibold text-sm">
                {getInitials(user.email)}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-slate-800">{profile.full_name || user.email}</p>
                <p className="text-xs text-emerald-600 font-semibold">
                  {profile.subscription_status === 'active' ? 'Assinatura Ativa' : 'Assinatura Inativa'}
                </p>
              </div>
              {dropdownOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-200 md:hidden"> {/* Mostra email/status no mobile */}
                  <p className="text-sm font-medium text-slate-800">{profile.full_name || user.email}</p>
                  <p className="text-xs text-emerald-600 font-semibold">
                    {profile.subscription_status === 'active' ? 'Assinatura Ativa' : 'Assinatura Inativa'}
                  </p>
                </div>
                {/* --- PASSO 2: ADICIONAMOS O LINK "MEUS DADOS" AQUI --- */}
                <Link
                  to="/perfil"
                  onClick={() => setDropdownOpen(false)} // Fecha dropdown ao clicar
                  className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition"
                >
                  <UserCircle className="w-5 h-5" />
                  Meus Dados
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition"
                >
                  <LogOut className="w-5 h-5" />
                  Sair
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

// Pequena melhoria adicionada: um dropdown para organizar as ações do usuário.
// O link "Meus Dados" foi colocado dentro desse dropdown.