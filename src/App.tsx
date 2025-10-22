import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'; // Adicionado useLocation
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LandingPage } from './components/LandingPage';
import { AdminDashboard } from './components/AdminDashboard';
import { UserCatalog } from './components/UserCatalog';
import { Header } from './components/Header';
import { PaymentPage } from './components/PaymentPage';
import { SuccessPage } from './components/SuccessPage';
import { SharedLinkView } from './components/SharedLinkView';
import { ProfilePage } from './components/ProfilePage';

// --- COMPONENTE DE LOADING PADRÃO ---
const LoadingSpinner = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
  </div>
);

// --- COMPONENTE DE SEGURANÇA (MAIS PACIENTE E INTELIGENTE) ---
function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, profile, loading, hasActiveSubscription, isAdmin } = useAuth();
  const location = useLocation(); // Pega a rota atual

  // --- PASSO 1: ESPERAR O CARREGAMENTO COMPLETO ---
  // Só continua se o loading geral E o carregamento do usuário E do perfil terminaram
  if (loading || (user && !profile)) { 
    return <LoadingSpinner />;
  }

  // --- PASSO 2: TOMAR A DECISÃO APÓS O CARREGAMENTO ---
  // Se NÃO está logado OU (está logado MAS não tem assinatura E não é admin)
  if (!user || (!hasActiveSubscription && !isAdmin)) {
    // Redireciona para /planos, guardando a rota que ele tentou acessar
    return <Navigate to="/planos" state={{ from: location }} replace />; 
  }

  // Se passou, permite o acesso
  return children;
}

// --- Componente para áreas públicas (MAIS INTELIGENTE) ---
function PublicArea({ children }: { children: JSX.Element }) {
  const { user, profile, loading, hasActiveSubscription, isAdmin } = useAuth();

  // Espera carregar tudo
  if (loading || (user && !profile)) {
    return <LoadingSpinner />;
  }

  // Se o usuário está logado E tem acesso (assinatura ou admin)...
  if (user && (hasActiveSubscription || isAdmin)) {
    // ...redireciona para o catálogo (ou dashboard se admin)
    return <Navigate to={isAdmin ? "/admin" : "/catalogo"} replace />; 
  }
  
  // Se não logado, OU logado mas sem acesso, mostra a página pública
  return children; 
}


// --- ROTA ESPECIAL PARA O LINK COMPARTILHADO ---
function PathRouter() {
  const pathname = window.location.pathname;
  const linkMatch = pathname.match(/^\/link\/([a-zA-Z0-9]+)$/);
  
  if (linkMatch) {
    const shortCode = linkMatch[1];
    return <SharedLinkView shortCode={shortCode} />;
  }
  return <MainAppRoutes />;
}

// --- ESTRUTURA PRINCIPAL DAS ROTAS ---
function MainAppRoutes() {
  return (
    <BrowserRouter>
      <Header /> 
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/" element={<PublicArea><LandingPage /></PublicArea>} />
        <Route path="/planos" element={<PublicArea><PaymentPage /></PublicArea>} />
        <Route path="/sucesso" element={<PublicArea><SuccessPage /></PublicArea>} />
        {/* Se tiver uma página de login separada, use PublicArea nela também */}
        {/* <Route path="/login" element={<PublicArea><LoginPage /></PublicArea>} /> */}

        {/* --- ROTAS PROTEGIDAS --- */}
        <Route path="/catalogo" element={<ProtectedRoute><AppArea /></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminArea /></ProtectedRoute>} />

        {/* Rota Catch-all -> Leva para Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// --- Componentes Auxiliares (sem alterações) ---
function AppArea() { const { isAdmin } = useAuth(); return isAdmin ? <AdminDashboard /> : <UserCatalog />; }
function AdminArea() { const { isAdmin } = useAuth(); return isAdmin ? <AdminDashboard /> : <Navigate to="/catalogo" replace />; }

// --- COMPONENTE RAIZ ---
function App() {
  return (
    <AuthProvider> 
      <PathRouter />
    </AuthProvider>
  );
}

export default App;