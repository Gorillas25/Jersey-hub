import { useState } from 'react';
import { LogOut, UserCircle, ChevronDown, ChevronUp, Shirt } from 'lucide-react'; // Adicionei Shirt de volta
import { Link, useNavigate } from 'react-router-dom'; // Importamos useNavigate
import { useAuth } from '../contexts/AuthContext';
// Removido import do supabase, pois signOut agora vem do contexto

export function Header() {
  // Pegamos a função signOut do contexto AGORA
  const { user, profile, isAdmin, signOut } = useAuth(); 
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate(); // Hook para navegação programática

  const handleSignOut = async () => {
    await signOut(); // Chama a função signOut do contexto (que agora limpa user e profile)
    setDropdownOpen(false); 
    navigate('/'); // FORÇA o redirecionamento para a página inicial
  };

  const getInitials = (email: string | undefined | null) => { // Adicionado | null
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
          {/* Mostra a Role apenas se o perfil estiver carregado */}
          {profile && ( 
            <span className="text-sm bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full ml-2">
              {isAdmin ? 'Admin' : 'Revendedor'}
            </span>
          )}
        </Link>

        {/* User Info & Actions - Só mostra se user e profile existirem */}
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
                <div className="px-4 py-2 border-b border-slate-200 md:hidden"> 
                  <p className="text-sm font-medium text-slate-800">{profile.full_name || user.email}</p>
                  <p className="text-xs text-emerald-600 font-semibold">
                    {profile.subscription_status === 'active' ? 'Assinatura Ativa' : 'Assinatura Inativa'}
                  </p>
                </div>
                <Link
                  to="/perfil"
                  onClick={() => setDropdownOpen(false)} 
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