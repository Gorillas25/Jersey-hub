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

// --- COMPONENTE DE SEGURANÇA (O Porteiro Paciente) ---
function ProtectedRoute({ children }: { children: JSX.Element }) {
  // Pegamos isAdmin também para permitir acesso mesmo sem assinatura ativa
  const { profile, loading, hasActiveSubscription, isAdmin } = useAuth(); 

  // --- PASSO 1: ESPERAR O CARREGAMENTO ---
  if (loading) {
    // Enquanto loading for true, apenas mostramos o spinner e NÃO redirecionamos
    return ( 
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // --- PASSO 2: TOMAR A DECISÃO APÓS O CARREGAMENTO ---
  // SOMENTE SE loading for false E o usuário não tiver acesso...
  if (!loading && !hasActiveSubscription && !isAdmin) { 
    // ...então redirecionamos para /planos.
    return <Navigate to="/planos" replace />;
  }

  // Se loading for false E o usuário tiver acesso (assinatura ativa ou é admin),
  // renderizamos a página protegida.
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
// Este componente NÃO chama useAuth diretamente
function MainAppRoutes() {
  return (
    <BrowserRouter>
      {/* O Header chamará useAuth internamente para decidir o que mostrar */}
      <Header /> 
      
      <Routes>
        {/* Rota Principal: Usa PublicArea para decidir */}
        <Route path="/" element={<PublicArea><LandingPage /></PublicArea>} />

        {/* Rota de Planos: Usa PublicArea */}
        <Route path="/planos" element={<PublicArea><PaymentPage /></PublicArea>} />
        
         {/* Rota de Sucesso: Usa PublicArea */}
        <Route path="/sucesso" element={<PublicArea><SuccessPage /></PublicArea>} />

        {/* Rota de Login (se existir como página separada) */}
        <Route path="/login" element={<PublicArea><LandingPage /></PublicArea>} /> 

        {/* --- ROTAS PROTEGIDAS --- */}
        {/* A rota /catalogo agora decide entre Admin e User DENTRO da AppArea */}
        <Route 
          path="/catalogo" 
          element={<ProtectedRoute><AppArea /></ProtectedRoute>} 
        />
        <Route
          path="/perfil"
          element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
        />
        {/* Rota específica /admin (se necessário) */}
        <Route 
          path="/admin"
          element={<ProtectedRoute><AdminArea /></ProtectedRoute>}
        />

        {/* Rota Catch-all (Opcional): Redireciona para home se rota não existir */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

// --- Componentes Auxiliares para Lógica de Roteamento ---

// Componente para áreas públicas
function PublicArea({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return (
     <div className="min-h-screen bg-slate-50 flex items-center justify-center">
       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
     </div>
  );
  // Se usuário JÁ estiver logado, redireciona para o catálogo, não importa qual página pública ele tentou acessar
  if (user) return <Navigate to="/catalogo" replace />; 
  return children; // Se não logado, mostra a página pública (Landing, Planos, Sucesso...)
}

// Componente que decide entre Catálogo e Admin DENTRO da área protegida
function AppArea() {
  const { isAdmin } = useAuth();
  // ProtectedRoute já garantiu que o usuário tem acesso (assinatura ou admin)
  return isAdmin ? <AdminDashboard /> : <UserCatalog />;
}

// Componente específico para a área de Admin
function AdminArea() {
  const { isAdmin } = useAuth();
  // ProtectedRoute garantiu que o user tem acesso. Aqui verificamos se é ADMIN.
  return isAdmin ? <AdminDashboard /> : <Navigate to="/catalogo" replace />; // Se não for admin, volta pro catálogo
}


// --- COMPONENTE RAIZ ---
function App() {
  return (
    <AuthProvider> 
      <PathRouter />
    </AuthProvider>
  );
}

export default App;