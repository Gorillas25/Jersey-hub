import { useState, useEffect } from 'react';
import { Shirt, Eye } from 'lucide-react';
import { supabase, Jersey } from '../lib/supabase';

export function SharedLinkView({ shortCode }: { shortCode: string }) {
  const [jerseys, setJerseys] = useState<Jersey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSharedLink();
  }, [shortCode]);

  const loadSharedLink = async () => {
    try {
      const { data: linkData, error: linkError } = await supabase
        .from('shared_links')
        .select('*')
        .eq('short_code', shortCode)
        .maybeSingle();

      if (linkError) throw linkError;

      if (!linkData) {
        setError('Link não encontrado ou expirado');
        setLoading(false);
        return;
      }

      if (linkData.expires_at && new Date(linkData.expires_at) < new Date()) {
        setError('Este link expirou');
        setLoading(false);
        return;
      }

      await supabase.rpc('increment_link_view_count', { link_code: shortCode });

      const { data: jerseysData, error: jerseysError } = await supabase
        .from('jerseys')
        .select('*')
        .in('id', linkData.jersey_ids);

      if (jerseysError) throw jerseysError;

      setJerseys(jerseysData || []);
    } catch (err) {
      console.error('Error loading shared link:', err);
      setError('Erro ao carregar as camisas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Carregando camisas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
            <Shirt className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Ops!</h2>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500 rounded-full mb-6">
            <Shirt className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Seleção de Camisas
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Confira as camisas selecionadas especialmente para você
          </p>
        </header>

        {jerseys.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400 text-lg">Nenhuma camisa encontrada neste link</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {jerseys.map((jersey) => (
              <div
                key={jersey.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition overflow-hidden"
              >
                <div className="relative">
                  <img
                    src={jersey.image_url}
                    alt={jersey.title}
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-emerald-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    Disponível
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{jersey.title}</h3>
                  <p className="text-slate-600 mb-4">{jersey.team_name}</p>
                  <div className="flex flex-wrap gap-2">
                    {jersey.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-16 max-w-2xl mx-auto bg-slate-800 rounded-xl p-8 border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-4 text-center">
            Interessado?
          </h2>
          <p className="text-slate-300 text-center mb-6">
            Entre em contato com o revendedor para mais informações sobre preços,
            tamanhos disponíveis e formas de pagamento.
          </p>
          <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
            <Shirt className="w-4 h-4" />
            <span>Mostrando {jerseys.length} camisa{jerseys.length > 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
