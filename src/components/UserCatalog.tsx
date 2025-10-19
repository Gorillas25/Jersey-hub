import { useState, useEffect } from 'react';
import { Search, Filter, Link as LinkIcon, X, CheckCircle2, Copy, Check } from 'lucide-react';
import InputMask from 'react-input-mask';
import { supabase, Jersey } from '../lib/supabase'; // Certifique-se que Jersey está exportado em supabase.ts
import { useAuth } from '../contexts/AuthContext';

// --- COMPONENTE DE LOADING "ESTILO JOGO" ---
const ProgressOverlay = ({ message }: { message: string }) => (
  <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[60]">
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle className="text-slate-700" strokeWidth="8" stroke="currentColor" fill="transparent" r="42" cx="50" cy="50" />
          <circle
            className="text-emerald-500 animate-spin-slow" // Garanta que 'animate-spin-slow' esteja definido no seu tailwind.config.js e CSS
            strokeWidth="8"
            strokeDasharray="264"
            strokeDashoffset="198"
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="42"
            cx="50"
            cy="50"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <LinkIcon className="w-10 h-10 text-slate-400" />
        </div>
      </div>
      <p className="text-white text-lg font-semibold">{message}</p>
    </div>
  </div>
);

// --- COMPONENTE PhoneModal ---
const PhoneModal = ({ onClose, onSave }: { onClose: () => void; onSave: (phone: string) => void; }) => {
  const { user } = useAuth();
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveClick = () => {
    if (!phone.trim() || phone.includes('_')) {
      alert('Por favor, preencha o número de telefone completo.');
      return;
    }
    setIsSaving(true);
    onSave(phone);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-slate-900">Contato para Clientes</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
        </div>
        <div className="mb-6">
          <p className="text-slate-600 mb-4">
            Para que seus clientes possam te contatar com 1 clique, salve seu número de WhatsApp. Você só precisa fazer isso uma vez.
          </p>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Seu número de WhatsApp
          </label>
          <InputMask
            mask="+55 (99) 99999-9999"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          >
            {(inputProps: any) => (
              <input {...inputProps} type="tel" placeholder="+55 (11) 99999-8888" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
            )}
          </InputMask>
        </div>
        <button
          onClick={handleSaveClick}
          disabled={isSaving}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSaving ? 'Salvando...' : 'Salvar e Gerar Link'}
        </button>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL UserCatalog ---
export function UserCatalog() {
  const { user, profile, setProfile, refreshProfile, isAdmin } = useAuth();
  const [jerseys, setJerseys] = useState<Jersey[]>([]); // Assume que Jersey inclui team_name agora
  const [filteredJerseys, setFilteredJerseys] = useState<Jersey[]>([]);
  const [selectedJerseys, setSelectedJerseys] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [generating, setGenerating] = useState(false); // Renomeado de isLoading para evitar conflito com AuthContext
  const [loadingMessage, setLoadingMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true); // Estado de loading para o catálogo inicial

  useEffect(() => {
    loadJerseys();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [jerseys, searchTerm, filterTags]); // Depende de 'jerseys' que agora inclui team_name

  useEffect(() => {
    if (profile && !isAdmin && !profile.phone) {
      setShowOnboardingModal(true);
    }
  }, [profile, isAdmin]);

  // --- FUNÇÃO loadJerseys ATUALIZADA ---
  const loadJerseys = async () => {
    setCatalogLoading(true); 
    try {
      const { data, error } = await supabase
        .from('jerseys')
        .select(`
          id, title, team_id, category_id, season, image_url, tags, created_at, 
          teams ( name ) 
        `) 
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedData = data.map(j => ({
          ...j,
          team_name: j.teams?.name || 'Time Desconhecido' 
        }));
        
        setJerseys(formattedData as Jersey[]); 

        // --- LÓGICA DE FILTRO INTELIGENTE AQUI ---
        const tags = new Set<string>();
        formattedData.forEach((jersey) => {
          // Para cada tag da camisa...
          (jersey.tags || []).forEach((tag: string) => {
            // ...só adiciona na lista de filtros se a tag NÃO for igual ao nome do time
            if (tag && tag.toLowerCase() !== (jersey.team_name || '').toLowerCase()) {
              tags.add(tag);
            }
          });
        });
        setAllTags(Array.from(tags).sort());
        // --- FIM DA LÓGICA DE FILTRO ---
      }
    } catch (error) {
      console.error("Erro ao carregar as camisas:", error);
    } finally {
      setCatalogLoading(false);
    }
  };

  // --- FUNÇÃO applyFilters ATUALIZADA ---
  const applyFilters = () => {
    let filtered = jerseys; 

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (jersey) =>
          (jersey.title || '').toLowerCase().includes(lowerSearchTerm) ||
          (jersey.team_name || '').toLowerCase().includes(lowerSearchTerm) // Agora busca pelo team_name!
      );
    }

    if (filterTags.length > 0) {
      filtered = filtered.filter((jersey) =>
        filterTags.some((tag) => (jersey.tags || []).includes(tag))
      );
    }
    
    setFilteredJerseys(filtered);
  };

  const toggleJerseySelection = (jerseyId: string) => {
    const newSelected = new Set(selectedJerseys);
    if (newSelected.has(jerseyId)) newSelected.delete(jerseyId);
    else newSelected.add(jerseyId);
    setSelectedJerseys(newSelected);
  };

  const toggleTagFilter = (tag: string) => {
    setFilterTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const handleGenerateLink = async () => {
    if (selectedJerseys.size === 0) return alert('Por favor, selecione pelo menos uma camisa');
    if (profile && !profile.phone) return setShowOnboardingModal(true);

    setGenerating(true); // Usa o estado 'generating' para o botão de gerar link
    setLoadingMessage('Gerando seu link...');

    try {
      const shortCode = await generateShortCode();
      const { error } = await supabase.from('shared_links').insert({ short_code: shortCode, user_id: user?.id, jersey_ids: Array.from(selectedJerseys) });
      if (error) throw error;
      const link = `${window.location.origin}/link/${shortCode}`;
      setGeneratedLink(link);
      setShowLinkModal(true);
    } catch (error: any) {
      console.error("ERRO AO GERAR LINK:", error);
      alert('Erro ao gerar link. Verifique o console para detalhes.');
    } finally {
      setGenerating(false);
      setLoadingMessage('');
    }
  };

  const generateShortCode = async () => {
    const { data, error } = await supabase.rpc('generate_short_code');
    if (error || !data) {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      let code = '';
      for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
      return code;
    }
    return data;
  };

  // --- FUNÇÃO DE ONBOARDING COM UI OTIMISTA ---
  const handleSavePhoneAndGenerate = (phone: string) => {
    setShowOnboardingModal(false);
    if (profile) {
      setProfile({ ...profile, phone: phone }); // Atualização otimista
    }
    // Não chama handleGenerateLink aqui, pois a função original já faz isso
    // Apenas dispara o salvamento em background
    supabase
      .from('user_profiles')
      .update({ phone })
      .eq('id', user!.id)
      .then(({ error }) => {
        if (error) {
          console.error("Erro ao salvar o telefone nos bastidores:", error);
          // Opcional: Reverter a atualização otimista ou mostrar erro discreto
          refreshProfile(); // Busca o perfil real para corrigir a "mentira"
        }
        // Se deu certo, o refreshProfile opcional pode ser chamado aqui também
        // refreshProfile(); // Garante que o profile está 100% sincronizado
      });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCloseLinkModal = () => {
    setShowLinkModal(false);
    setGeneratedLink('');
    setSelectedJerseys(new Set());
    setCopied(false);
  };

  // --- RENDERIZAÇÃO DO CATÁLOGO ---
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mostra o overlay se estiver gerando link OU se o catálogo inicial estiver carregando */}
      {(generating || catalogLoading) && <ProgressOverlay message={generating ? loadingMessage : 'Carregando catálogo...'} />}
      
      {showOnboardingModal && (
        <OnboardingPhoneModal 
          onSaveSuccess={async () => {
             // A lógica aqui é só atualizar o perfil e fechar,
             // o useEffect vai detectar a mudança e esconder o modal
             await refreshProfile(); 
             setShowOnboardingModal(false);
          }} 
        />
      )}
      
      {/* Adiciona blur e desabilita cliques se o onboarding estiver ativo */}
      <div className={`container mx-auto px-4 py-8 ${showOnboardingModal ? 'blur-sm pointer-events-none' : ''}`}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Catálogo de Camisas</h1>
          <p className="text-slate-600">Selecione as camisas e gere um link para compartilhar com seus clientes</p>
        </div>
        
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar por título ou time..." className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
          </div>
          <button onClick={() => setShowFilterModal(true)} className="flex items-center justify-center gap-2 bg-white border border-slate-300 px-6 py-3 rounded-lg hover:bg-slate-50 transition">
            <Filter className="w-5 h-5" />
            Filtros
            {filterTags.length > 0 && <span className="bg-emerald-500 text-white text-xs px-2 py-1 rounded-full">{filterTags.length}</span>}
          </button>
          {selectedJerseys.size > 0 && (
            <button onClick={handleGenerateLink} disabled={generating} className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50">
              <LinkIcon className="w-5 h-5" />
              {generating ? loadingMessage : `Gerar Link (${selectedJerseys.size})`}
            </button>
          )}
        </div>
        
        {filterTags.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {filterTags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm">
                {tag}
                <button onClick={() => toggleTagFilter(tag)} className="hover:text-emerald-900"><X className="w-4 h-4" /></button>
              </span>
            ))}
          </div>
        )}

        {/* --- MOSTRA LOADING ENQUANTO O CATÁLOGO CARREGA --- */}
        {catalogLoading ? (
           <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
              <p className="text-slate-500 text-lg">Carregando camisas...</p>
           </div>
        ) : filteredJerseys.length === 0 ? (
          <div className="text-center py-16"><p className="text-slate-500 text-lg">Nenhuma camisa encontrada</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredJerseys.map((jersey) => {
              const isSelected = selectedJerseys.has(jersey.id);
              return (
                <div key={jersey.id} onClick={() => toggleJerseySelection(jersey.id)} className={`bg-white rounded-xl shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden relative ${ isSelected ? 'ring-4 ring-emerald-500' : '' }`}>
                  {isSelected && <div className="absolute top-3 right-3 bg-emerald-500 text-white rounded-full p-1 z-10"><CheckCircle2 className="w-6 h-6" /></div>}
                  <img src={jersey.image_url} alt={jersey.title} className="w-full h-48 object-cover" />
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-900 mb-1">{jersey.title}</h3>
                    {/* Exibe o nome do time que agora vem nos dados */}
                    <p className="text-sm text-slate-600 mb-2">{jersey.team_name}</p> 
                    <div className="flex flex-wrap gap-1">
                      {(jersey.tags || []).map((tag, idx) => <span key={idx} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">{tag}</span>)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {showFilterModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-bold text-slate-900">Filtros</h3><button onClick={() => setShowFilterModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button></div>
              <div className="space-y-2 max-h-96 overflow-y-auto">{allTags.map((tag) => <label key={tag} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer"><input type="checkbox" checked={filterTags.includes(tag)} onChange={() => toggleTagFilter(tag)} className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-500" /><span className="text-slate-700">{tag}</span></label>)}</div>
              <div className="mt-6 flex gap-3"><button onClick={() => setFilterTags([])} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 rounded-lg transition">Limpar</button><button onClick={() => setShowFilterModal(false)} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-lg transition">Aplicar</button></div>
            </div>
          </div>
        )}

        {showLinkModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-lg w-full p-6">
              <div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-bold text-slate-900">Link Gerado!</h3><button onClick={handleCloseLinkModal} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button></div>
              <div className="mb-6">
                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 mb-4"><div className="flex items-center gap-2 mb-2"><CheckCircle2 className="w-5 h-5 text-emerald-600" /><span className="text-emerald-900 font-semibold">Link criado com sucesso!</span></div><p className="text-emerald-800 text-sm">Você selecionou {selectedJerseys.size} camisa{selectedJerseys.size > 1 ? 's' : ''}</p></div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Link para compartilhar</label>
                <div className="flex gap-2">
                  <input type="text" value={generatedLink} readOnly className="flex-1 px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 font-mono text-sm" />
                  <button onClick={handleCopyLink} className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition flex items-center gap-2">{copied ? <><Check className="w-5 h-5" />Copiado!</> : <><Copy className="w-5 h-5" />Copiar</>}</button>
                </div>
                <p className="text-xs text-slate-500 mt-2">Compartilhe este link com seu cliente. Ele poderá ver apenas as camisas selecionadas.</p>
              </div>
              <button onClick={handleCloseLinkModal} className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 rounded-lg transition">Fechar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Lembrete: Garanta que a definição do tipo 'Jersey' em lib/supabase.ts
// agora inclua a propriedade opcional 'team_name?: string;'
// e que 'teams' no select seja tratado como objeto: { name: string } | null