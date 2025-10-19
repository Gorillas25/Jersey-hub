import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LandingPage } from './components/LandingPage';
import { AdminDashboard } from './components/AdminDashboard';
import { UserCatalog } from './components/UserCatalog';
import { Header } from './components/Header';
import { PaymentPage } from './components/PaymentPage';
import { SuccessPage } from './components/SuccessPage';
import { SharedLinkView } from './components/SharedLinkView';
import { ProfilePage } from './components/ProfilePage';

// --- COMPONENTE DE SEGURANÇA (Verifica Assinatura) ---
// Este componente AGORA chama useAuth
function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { profile, loading, hasActiveSubscription, isAdmin } = useAuth(); // useAuth é chamado AQUI

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Permite acesso se tiver assinatura OU for admin
  if (!hasActiveSubscription && !isAdmin) { 
    return <Navigate to="/planos" replace />;
  }

  return children;
}

// --- ROTA ESPECIAL PARA O LINK COMPARTILHADO ---
// Não precisa de autenticação, então fica fora do MainAppRoutes
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
// Este componente NÃO chama mais useAuth diretamente
function MainAppRoutes() {
  return (
    <BrowserRouter>
      {/* O Header SÓ é renderizado aqui se precisarmos dele em TODAS as rotas internas. 
          Se ele precisa saber se o user está logado, ele mesmo chamará useAuth. */}
      <Header /> 
      
      <Routes>
        {/* Rota Principal: LandingPage para não logados */}
        <Route path="/" element={<PublicArea><LandingPage /></PublicArea>} />

        {/* Rota de Planos: Acessível para todos */}
        <Route path="/planos" element={<PublicArea><PaymentPage /></PublicArea>} />
        
         {/* Rota de Sucesso: Acessível para todos */}
        <Route path="/sucesso" element={<PublicArea><SuccessPage /></PublicArea>} />

        {/* Rota de Login (geralmente tratada na Landing Page) */}
        <Route path="/login" element={<PublicArea><LandingPage /></PublicArea>} /> 

        {/* --- ROTAS PROTEGIDAS --- */}
        <Route 
          path="/catalogo" 
          element={<ProtectedRoute><AppArea /></ProtectedRoute>} 
        />
        <Route
          path="/perfil"
          element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
        />
        {/* Adicione outras rotas protegidas aqui (ex: /admin) */}
        <Route 
          path="/admin"
          element={<ProtectedRoute><AdminArea /></ProtectedRoute>}
        />

      </Routes>
    </BrowserRouter>
  );
}

// --- Componentes Auxiliares para Lógica de Roteamento ---

// Componente para áreas públicas (se usuário logado, redireciona para catálogo)
function PublicArea({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Carregando...</div>; // Ou um spinner melhor
  if (user) return <Navigate to="/catalogo" replace />; // Se já logado, manda pro catálogo
  return children; // Se não logado, mostra a página pública
}

// Componente que decide entre Catálogo e Admin DENTRO da área protegida
function AppArea() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminDashboard /> : <UserCatalog />;
}

// Componente específico para a área de Admin (se precisar de mais lógica)
function AdminArea() {
  const { isAdmin } = useAuth();
  // Poderia ter uma verificação extra aqui se nem todo admin pudesse ver tudo
  return isAdmin ? <AdminDashboard /> : <Navigate to="/catalogo" replace />; // Se não for admin, volta pro catálogo
}


// --- COMPONENTE RAIZ ---
function App() {
  return (
    // AuthProvider continua sendo o componente mais externo
    <AuthProvider> 
      <PathRouter />
    </AuthProvider>
  );
}

export default App;