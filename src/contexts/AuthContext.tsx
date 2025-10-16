import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

// --- PASSO 1: ATUALIZAMOS O TIPO PARA INCLUIR AS NOVAS FUNÇÕES ---
type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  hasActiveSubscription: boolean;
  refreshProfile: () => Promise<void>; // Função para recarregar o perfil
  setProfile: (profile: Profile | null) => void; // Função para atualizar o perfil localmente
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  // --- PASSO 2: CRIAMOS A FUNÇÃO refreshProfile ---
  const refreshProfile = async () => {
    if (user) {
      // Não ativamos o 'loading' para ser uma atualização silenciosa
      await loadProfile(user.id);
    }
  };

  // Lógica de verificação de admin (já ajustada para super_admin também)
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  const hasActiveSubscription =
    profile?.subscription_status === 'active' &&
    (!profile?.subscription_end_date || new Date(profile.subscription_end_date) > new Date());

  return (
    <AuthContext.Provider
      // --- PASSO 3: EXPORTAMOS AS NOVAS FUNÇÕES ---
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        isAdmin,
        hasActiveSubscription,
        refreshProfile,
        setProfile, // Exportamos a função 'setProfile' do nosso useState
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}