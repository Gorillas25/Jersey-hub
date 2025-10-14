import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LandingPage } from './components/LandingPage';
import { AdminDashboard } from './components/AdminDashboard';
import { UserCatalog } from './components/UserCatalog';
import { Header } from './components/Header';
import { PaymentPage } from './components/PaymentPage';
import { SuccessPage } from './components/SuccessPage';
import { SharedLinkView } from './components/SharedLinkView';

// --- COMPONENTE DE SEGURANÇA (O Porteiro Inteligente) ---
function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { profile, loading, hasActiveSubscription } = useAuth();

  if (loading) {
    return ( // Mostra um loading enquanto verifica a autenticação
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!hasActiveSubscription) {
    // Se não tem assinatura ativa, expulsa o usuário para a página de planos
    return <Navigate to="/planos" replace />;
  }

  // Se passou na verificação, deixa o usuário entrar
  return children;
}

// --- ROTA ESPECIAL PARA O LINK COMPARTILHADO ---
// Lida com a rota /link/:shortCode fora do roteamento principal
function PathRouter() {
  const pathname = window.location.pathname;
  const linkMatch = pathname.match(/^\/link\/([a-zA-Z0-9]+)$/);
  
  if (linkMatch) {
    const shortCode = linkMatch[1];
    return <SharedLinkView shortCode={shortCode} />;
  }

  // Se não for um link compartilhado, renderiza o roteamento principal do app
  return <MainAppRoutes />;
}

// --- ESTRUTURA PRINCIPAL DAS ROTAS ---
function MainAppRoutes() {
  const { user, profile, loading, isAdmin } = useAuth();
  
  return (
    <BrowserRouter>
      {/* O Header agora só aparece se o usuário estiver logado */}
      {user && profile && <Header />}
      
      <Routes>
        {/* Rota Principal: Se logado, vai pro catálogo. Se não, pra Landing Page. */}
        <Route 
          path="/" 
          element={user ? (isAdmin ? <AdminDashboard /> : <UserCatalog />) : <LandingPage />} 
        />
        
        {/* Rota de Planos: Acessível para todos */}
        <Route path="/planos" element={<PaymentPage />} />

        {/* Rota do Catálogo: Protegida pelo segurança */}
        <Route 
          path="/catalogo" 
          element={
            <ProtectedRoute>
              {isAdmin ? <AdminDashboard /> : <UserCatalog />}
            </ProtectedRoute>
          } 
        />
        
        {/* Rota de Sucesso do Pagamento */}
        <Route path="/sucesso" element={<SuccessPage />} />

        {/* Adicione outras rotas como /login aqui se precisar */}
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <PathRouter />
    </AuthProvider>
  );
}

export default App;