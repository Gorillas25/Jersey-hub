import { useState, useEffect } from 'react';
import { Search, Filter, Link as LinkIcon, X, CheckCircle2, Copy, Check, CheckSquare, Square } from 'lucide-react';
import InputMask from 'react-input-mask';
import { supabase, Jersey, Profile } from '../lib/supabase'; // Garanta que Jersey e Profile estão exportados
import { useAuth } from '../contexts/AuthContext';

// --- CONSTANTE PARA PAGINAÇÃO ---
const ITEMS_PER_PAGE = 20; // Quantas camisas carregar por vez

// --- COMPONENTE DE LOADING "ESTILO JOGO" ---
const ProgressOverlay = ({ message }: { message: string }) => (
  <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[60]">
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle className="text-slate-700" strokeWidth="8" stroke="currentColor" fill="transparent" r="42" cx="50" cy="50" />
          <circle
            className="text-emerald-500 animate-spin-slow" // Garanta que 'animate-spin-slow' esteja no tailwind.config.js e CSS
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

// --- COMPONENTE MODAL DE ONBOARDING ---
const OnboardingPhoneModal = ({ onSaveSuccess }: { onSaveSuccess: () => void; }) => {
  const { user } = useAuth();
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!phone.trim() || phone.includes('_')) {
      alert('Por favor, preencha o número de telefone completo.');
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ phone: phone })
        .eq('id', user!.id);

      if (error) throw error;

      alert('Número salvo! Bem-vindo ao JerseyHub!');
      onSaveSuccess();

    } catch (error: any) {
      console.error("Erro ao salvar o telefone:", error.message);
      alert('Não foi possível salvar seu telefone. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full p-8 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Bem-vindo ao JerseyHub!</h2>
        <p className="text-slate-600 mb-6">
          Para começar e ativar todas as funcionalidades, por favor, insira seu número de WhatsApp. Você só precisa fazer isso uma vez.
        </p>
        <div className="mb-6 text-left">
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
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSaving ? 'Salvando...' : 'Salvar e Começar a Usar'}
        </button>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL UserCatalog ---
export function UserCatalog() {
  const { user, profile, setProfile, refreshProfile, isAdmin } = useAuth();
  const [jerseys, setJerseys] = useState<Jersey[]>([]);
  const [filteredJerseys, setFilteredJerseys] = useState<Jersey[]>([]);
  const [selectedJerseys, setSelectedJerseys] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [generating, setGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [allFilteredSelected, setAllFilteredSelected] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => { loadJerseys(); }, []);

  useEffect(() => {
    if (filteredJerseys.length > 0) {
      const allVisibleAreSelected = filteredJerseys.every(j => selectedJerseys.has(j.id));
      setAllFilteredSelected(allVisibleAreSelected);
    } else {
      setAllFilteredSelected(false);
    }
  }, [selectedJerseys, filteredJerseys]);

  useEffect(() => { applyFilters(); }, [jerseys, searchTerm, filterTags]);
  useEffect(() => {
    if (profile && !isAdmin && !profile.phone) {
      setShowOnboardingModal(true);
    }
  }, [profile, isAdmin]);

  const loadJerseys = async (isInitialLoad = true) => {
    if(isInitialLoad) {
      setCatalogLoading(true);
      setHasMore(true);
      setCurrentPage(0);
    } else {
      setLoadingMore(true);
    }

    const pageToLoad = isInitialLoad ? 0 : currentPage + 1;
    const from = pageToLoad * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    try {
      const { data, error } = await supabase
        .from('jerseys')
        .select(`id, title, team_id, category_id, season, image_url, tags, created_at, teams ( name ) `)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (data) {
        const formattedData = data.map(j => ({ ...j, team_name: j.teams?.name || 'Time Desconhecido' }));

        if (isInitialLoad) {
          setJerseys(formattedData as Jersey[]);
          // Extrai tags apenas na carga inicial para evitar recalcular a cada "Carregar Mais"
          const tags = new Set<string>();
          formattedData.forEach((jersey) => {
            (jersey.tags || []).forEach((tag: string) => {
              if (tag && tag.toLowerCase() !== (jersey.team_name || '').toLowerCase()) tags.add(tag);
            });
          });
          setAllTags(Array.from(tags).sort());
        } else {
          // Adiciona os novos itens aos existentes
          setJerseys(prevJerseys => [...prevJerseys, ...(formattedData as Jersey[])]);
        }
        
        setCurrentPage(pageToLoad); // Atualiza a página atual
        if (data.length < ITEMS_PER_PAGE) setHasMore(false); // Chegou ao fim

      } else {
        if(isInitialLoad) setJerseys([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error(`Erro ao carregar ${isInitialLoad ? '' : 'mais '}camisas:`, error);
      setHasMore(false);
    } finally {
      if(isInitialLoad) setCatalogLoading(false);
      else setLoadingMore(false);
    }
  };

  // Renomeado para loadMoreJerseys para clareza
  const handleLoadMore = () => {
     if (!loadingMore && hasMore) {
        loadJerseys(false); // Chama a função principal com isInitialLoad = false
     }
  }

  const applyFilters = () => {
    let filtered = jerseys;
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter((j) => (j.title || '').toLowerCase().includes(lowerSearchTerm) || (j.team_name || '').toLowerCase().includes(lowerSearchTerm));
    }
    if (filterTags.length > 0) {
      filtered = filtered.filter((j) => filterTags.some((tag) => (j.tags || []).includes(tag)));
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

    setGenerating(true);
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
    if (!error && data) { return data; }
    console.warn("Falha ao chamar RPC generate_short_code. Gerando código no frontend.", error);
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) { code += chars.charAt(Math.floor(Math.random() * chars.length)); }
    return code;
  };

  const handleSavePhoneAndGenerate = (phone: string) => {
    setShowOnboardingModal(false);
    if (profile) setProfile({ ...profile, phone: phone });
    handleGenerateLink();
    supabase.from('user_profiles').update({ phone }).eq('id', user!.id)
      .then(({ error }) => { if (error) { console.error("Erro(BG):", error); refreshProfile(); } });
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

  const handleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedJerseys(new Set());
    } else {
      const filteredIds = filteredJerseys.map(j => j.id);
      setSelectedJerseys(new Set(filteredIds));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {generating && <ProgressOverlay message={loadingMessage} />}

      {showOnboardingModal && ( <OnboardingPhoneModal onSaveSuccess={async () => { await refreshProfile(); setShowOnboardingModal(false); }} /> )}

      <div className={`container mx-auto px-4 py-8 ${showOnboardingModal ? 'blur-sm pointer-events-none' : ''}`}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Catálogo de Camisas</h1>
          <p className="text-slate-600">Selecione as camisas e gere um link para compartilhar com seus clientes</p>
        </div>

        <div className="mb-6 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar por título ou time..." className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
          </div>

          <div className="flex gap-4 w-full md:w-auto flex-wrap">
            <button onClick={() => setShowFilterModal(true)} className="flex items-center justify-center gap-2 bg-white border border-slate-300 px-4 py-3 rounded-lg hover:bg-slate-50 transition text-sm flex-shrink-0">
              <Filter className="w-5 h-5" />
              Filtros
              {filterTags.length > 0 && <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">{filterTags.length}</span>}
            </button>

            {filteredJerseys.length > 0 && (
              <button
                onClick={handleSelectAllFiltered}
                className={`flex items-center justify-center gap-2 border px-4 py-3 rounded-lg transition text-sm flex-shrink-0 ${ allFilteredSelected ? 'bg-slate-200 border-slate-300 text-slate-600 hover:bg-slate-300' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50' }`}
              >
                {allFilteredSelected ? <Square className="w-5 h-5" /> : <CheckSquare className="w-5 h-5" />}
                {allFilteredSelected ? 'Limpar Seleção' : 'Selecionar Todas'}
              </button>
            )}

            {selectedJerseys.size > 0 && (
              <button onClick={handleGenerateLink} disabled={generating} className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-lg font-semibold transition disabled:opacity-50 text-sm flex-shrink-0">
                <LinkIcon className="w-5 h-5" />
                {generating ? loadingMessage : `Gerar Link (${selectedJerseys.size})`}
              </button>
            )}
          </div>
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

        {catalogLoading ? (
           <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
              <p className="text-slate-500 text-lg">Carregando camisas...</p>
           </div>
        ) : filteredJerseys.length === 0 && !searchTerm && filterTags.length === 0 ? (
           <div className="text-center py-16"><p className="text-slate-500 text-lg">Nenhuma camisa cadastrada ainda.</p></div>
        ) : filteredJerseys.length === 0 ? (
           <div className="text-center py-16"><p className="text-slate-500 text-lg">Nenhuma camisa encontrada para os filtros selecionados.</p></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredJerseys.map((jersey) => {
              const isSelected = selectedJerseys.has(jersey.id);
              return (
                <div key={jersey.id} onClick={() => toggleJerseySelection(jersey.id)} className={`bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 cursor-pointer overflow-hidden relative border-2 ${ isSelected ? 'border-emerald-500' : 'border-transparent' } group`}>
                  {isSelected && <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1 z-10 shadow-md"><CheckCircle2 className="w-5 h-5" /></div>}
                  <img src={jersey.image_url || '/placeholder.jpg'} alt={jersey.title || 'Camisa'} className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105" />
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-800 mb-1 truncate" title={jersey.title || 'Sem título'}>{jersey.title || 'Sem título'}</h3>
                    <p className="text-sm text-slate-500 mb-2 truncate" title={jersey.team_name || 'Sem time'}>{jersey.team_name || 'Sem time'}</p>
                    <div className="flex flex-wrap gap-1">
                      {(jersey.tags || []).slice(0, 3).map((tag, idx) => <span key={idx} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{tag}</span>)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* --- BOTÃO CARREGAR MAIS --- */}
        {!catalogLoading && hasMore && (
          <div className="text-center mt-12">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 px-8 rounded-lg transition disabled:opacity-50"
            >
              {loadingMore ? 'Carregando...' : 'Carregar Mais Camisas'}
            </button>
          </div>
        )}

        {showFilterModal && (
           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
             <div className="bg-white rounded-xl max-w-md w-full p-6 flex flex-col" style={{maxHeight: '90vh'}}>
               <div className="flex justify-between items-center mb-6 flex-shrink-0"><h3 className="text-2xl font-bold text-slate-900">Filtros</h3><button onClick={() => setShowFilterModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button></div>
               <div className="space-y-2 overflow-y-auto mb-6 flex-grow">{allTags.map((tag) => <label key={tag} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer"><input type="checkbox" checked={filterTags.includes(tag)} onChange={() => toggleTagFilter(tag)} className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-500" /><span className="text-slate-700">{tag}</span></label>)}</div>
               <div className="mt-auto flex gap-3 flex-shrink-0"><button onClick={() => setFilterTags([])} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 rounded-lg transition">Limpar</button><button onClick={() => setShowFilterModal(false)} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-lg transition">Aplicar</button></div>
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

// Lembretes Finais:
// 1. Garanta que a animação 'animate-spin-slow' está definida no seu tailwind.config.js e CSS.
// 2. Garanta que a definição do tipo 'Jersey' em lib/supabase.ts inclua 'team_name?: string;' e 'teams: { name: string } | null;'.
// 3. Importe os ícones CheckSquare e Square de lucide-react.