import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LandingPage } from './components/LandingPage';
import { AdminDashboard } from './components/AdminDashboard';
import { UserCatalog } from './components/UserCatalog';
import { Header } from './components/Header';
import { PaymentPage } from './components/PaymentPage'; 
import { SuccessPage } from './components/SuccessPage';
import { SharedLinkView } from './components/SharedLinkView';

function AppContent() {
  const { user, profile, loading, isAdmin, hasActiveSubscription } = useAuth();

  const pathname = window.location.pathname;
  const params = new URLSearchParams(window.location.search);

  const linkMatch = pathname.match(/^\/link\/([a-zA-Z0-9]+)$/);
  if (linkMatch) {
    const shortCode = linkMatch[1];
    return <SharedLinkView shortCode={shortCode} />;
  }

  const isSuccessPage = pathname === '/sucesso' || params.has('session_id');

  if (isSuccessPage) {
    return <SuccessPage />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
     if (pathname === '/planos') 
      return <PaymentPage />;
    }

  if (!hasActiveSubscription && !isAdmin) {
    return (
      <>
        <PaymentPage/>;
      </>
    );
  }

  return (
    <>
      <Header />
      {isAdmin ? <AdminDashboard /> : <UserCatalog />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
