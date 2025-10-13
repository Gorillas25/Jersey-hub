import { useState, useEffect } from 'react';
import { Search, Filter, Link as LinkIcon, X, CheckCircle2, Copy, Check } from 'lucide-react';
import { supabase, Jersey } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// --- NOVO COMPONENTE: MODAL DE TELEFONE --- //
// Para deixar o código principal mais limpo, criei um componente separado para o modal
const PhoneModal = ({ onClose, onSaveSuccess }: { onClose: () => void; onSaveSuccess: () => void; }) => {
  const { user } = useAuth();
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!phone.trim()) {
      alert('Por favor, insira um número de telefone válido.');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ phone: phone })
        .eq('id', user!.id);

      if (error) {
        // Se o Supabase retornar um erro, nós o jogamos para o catch
        throw error;
      }
      
      // Essa linha só será alcançada se não houver erro
      onSaveSuccess();

    } catch (error: any) {
      // --- DEBUGGING: ERRO DETALhado AO SALVAR TELEFONE --- //
      console.log("==============================================");
      console.error("ERRO COMPLETO AO SALVAR:", error);
      console.error("MENSAGEM DO ERRO:", error.message);
      console.error("DETALHES DO ERRO:", error.details);
      console.error("DICA DO ERRO:", error.hint);
      console.log("==============================================");
      
      alert('Não foi possível salvar seu telefone. Verifique o console (F12) para detalhes.');
    } finally {
      setSaving(false);
    }
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
            Seu número de WhatsApp (Ex: 5511999998888)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Insira seu número com DDD"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar e Gerar Link'}
        </button>
      </div>
    </div>
  );
};


// --- COMPONENTE PRINCIPAL (UserCatalog) --- //
export function UserCatalog() {
  const { user, profile, refreshProfile } = useAuth(); 
  const [jerseys, setJerseys] = useState<Jersey[]>([]);
  const [filteredJerseys, setFilteredJerseys] = useState<Jersey[]>([]);
  const [selectedJerseys, setSelectedJerseys] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false); 
  const [generatedLink, setGeneratedLink] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadJerseys();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [jerseys, searchTerm, filterTags]);

  const loadJerseys = async () => {
    const { data, error } = await supabase
      .from('jerseys')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setJerseys(data);
      const tags = new Set<string>();
      data.forEach((jersey) => {
        jersey.tags.forEach((tag: string) => tags.add(tag));
      });
      setAllTags(Array.from(tags).sort());
    }
  };

  const applyFilters = () => {
    let filtered = jerseys;
    if (searchTerm) {
      filtered = filtered.filter(
        (jersey) =>
          jersey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          jersey.team_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterTags.length > 0) {
      filtered = filtered.filter((jersey) =>
        filterTags.some((tag) => jersey.tags.includes(tag))
      );
    }
    setFilteredJerseys(filtered);
  };

  const toggleJerseySelection = (jerseyId: string) => {
    const newSelected = new Set(selectedJerseys);
    if (newSelected.has(jerseyId)) {
      newSelected.delete(jerseyId);
    } else {
      newSelected.add(jerseyId);
    }
    setSelectedJerseys(newSelected);
  };

  const toggleTagFilter = (tag: string) => {
    setFilterTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleGenerateLink = async () => {
    if (selectedJerseys.size === 0) {
      alert('Por favor, selecione pelo menos uma camisa');
      return;
    }

    if (profile && !profile.phone) {
      setShowPhoneModal(true); 
      return; 
    }

    setGenerating(true);

    try {
      const shortCode = await generateShortCode();

      const { error } = await supabase.from('shared_links').insert({
        short_code: shortCode,
        user_id: user?.id,
        jersey_ids: Array.from(selectedJerseys),
      });

      if (error) throw error;

      const link = `${window.location.origin}/link/${shortCode}`;
      setGeneratedLink(link);
      setShowLinkModal(true);
    } catch (error: any) {
      console.error("ERRO COMPLETO:", error);
      console.error("MENSAGEM DO ERRO:", error.message);
      alert('Erro ao gerar link. Verifique o console (F12) para detalhes.');
    } finally {
      setGenerating(false);
    }
  };

  const generateShortCode = async () => {
    const { data, error } = await supabase.rpc('generate_short_code');
    if (error || !data) {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    }
    return data;
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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Catálogo de Camisas</h1>
          <p className="text-slate-600">
            Selecione as camisas e gere um link para compartilhar com seus clientes
          </p>
        </div>

        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por time ou título..."
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={() => setShowFilterModal(true)}
            className="flex items-center justify-center gap-2 bg-white border border-slate-300 px-6 py-3 rounded-lg hover:bg-slate-50 transition"
          >
            <Filter className="w-5 h-5" />
            Filtros
            {filterTags.length > 0 && (
              <span className="bg-emerald-500 text-white text-xs px-2 py-1 rounded-full">
                {filterTags.length}
              </span>
            )}
          </button>

          {selectedJerseys.size > 0 && (
            <button
              onClick={handleGenerateLink}
              disabled={generating}
              className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50"
            >
              <LinkIcon className="w-5 h-5" />
              {generating ? 'Gerando...' : `Gerar Link (${selectedJerseys.size})`}
            </button>
          )}
        </div>

        {filterTags.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {filterTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm"
              >
                {tag}
                <button
                  onClick={() => toggleTagFilter(tag)}
                  className="hover:text-emerald-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredJerseys.map((jersey) => {
            const isSelected = selectedJerseys.has(jersey.id);
            return (
              <div
                key={jersey.id}
                onClick={() => toggleJerseySelection(jersey.id)}
                className={`bg-white rounded-xl shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden relative ${
                  isSelected ? 'ring-4 ring-emerald-500' : ''
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 bg-emerald-500 text-white rounded-full p-1 z-10">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                )}
                <img
                  src={jersey.image_url}
                  alt={jersey.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 mb-1">{jersey.title}</h3>
                  <p className="text-sm text-slate-600 mb-2">{jersey.team_name}</p>
                  <div className="flex flex-wrap gap-1">
                    {jersey.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredJerseys.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-500 text-lg">Nenhuma camisa encontrada</p>
          </div>
        )}
        
        {showPhoneModal && (
          <PhoneModal 
            onClose={() => setShowPhoneModal(false)}
            onSaveSuccess={async () => {
              await refreshProfile?.(); 
              setShowPhoneModal(false);
              handleGenerateLink();
            }}
          />
        )}

        {showFilterModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-slate-900">Filtros</h3>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {allTags.map((tag) => (
                  <label
                    key={tag}
                    className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filterTags.includes(tag)}
                      onChange={() => toggleTagFilter(tag)}
                      className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-500"
                    />
                    <span className="text-slate-700">{tag}</span>
                  </label>
                ))}
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setFilterTags([])}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 rounded-lg transition"
                >
                  Limpar
                </button>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-lg transition"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        )}

        {showLinkModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-lg w-full p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-slate-900">Link Gerado!</h3>
                <button
                  onClick={handleCloseLinkModal}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="mb-6">
                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="text-emerald-900 font-semibold">
                      Link criado com sucesso!
                    </span>
                  </div>
                  <p className="text-emerald-800 text-sm">
                    Você selecionou {selectedJerseys.size} camisa{selectedJerseys.size > 1 ? 's' : ''}
                  </p>
                </div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Link para compartilhar
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={generatedLink}
                    readOnly
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 font-mono text-sm"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-5 h-5" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        Copiar
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Compartilhe este link com seu cliente. Ele poderá ver apenas as camisas selecionadas.
                </p>
              </div>
              <button
                onClick={handleCloseLinkModal}
                className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 rounded-lg transition"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}