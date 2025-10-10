import { useState, useEffect } from 'react';
import { Search, Filter, Send, X, CheckCircle2 } from 'lucide-react';
import { supabase, Jersey } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const WEBHOOK_URL = 'https://your-n8n-instance.com/webhook/jerseyhub';

export function UserCatalog() {
  const { user, profile } = useAuth();
  const [jerseys, setJerseys] = useState<Jersey[]>([]);
  const [filteredJerseys, setFilteredJerseys] = useState<Jersey[]>([]);
  const [selectedJerseys, setSelectedJerseys] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [clientPhone, setClientPhone] = useState('');
  const [sending, setSending] = useState(false);

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

  const handleSendToClient = async () => {
    if (!clientPhone || selectedJerseys.size === 0) {
      alert('Por favor, selecione camisas e digite o número do cliente');
      return;
    }

    setSending(true);

    try {
      const selectedJerseyData = jerseys.filter((j) => selectedJerseys.has(j.id));
      const imageUrls = selectedJerseyData.map((j) => j.image_url);

      const payload = {
        cliente: clientPhone,
        usuario: user?.email || profile?.email,
        imagens: imageUrls,
      };

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      await supabase.from('webhook_logs').insert({
        reseller_id: user?.id,
        client_phone: clientPhone,
        jersey_ids: Array.from(selectedJerseys),
        webhook_response: responseData,
        status: response.ok ? 'success' : 'failed',
      });

      if (response.ok) {
        alert('Camisas enviadas com sucesso para o cliente!');
        setSelectedJerseys(new Set());
        setClientPhone('');
        setShowSendModal(false);
      } else {
        alert('Erro ao enviar. Tente novamente.');
      }
    } catch (error) {
      console.error('Error sending:', error);
      alert('Erro ao enviar. Verifique sua conexão e tente novamente.');

      await supabase.from('webhook_logs').insert({
        reseller_id: user?.id,
        client_phone: clientPhone,
        jersey_ids: Array.from(selectedJerseys),
        webhook_response: { error: String(error) },
        status: 'failed',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Catálogo de Camisas</h1>
          <p className="text-slate-600">
            Selecione as camisas e envie para seus clientes no WhatsApp
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
              onClick={() => setShowSendModal(true)}
              className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              <Send className="w-5 h-5" />
              Enviar para cliente ({selectedJerseys.size})
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

        {showSendModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-slate-900">Enviar para Cliente</h3>
                <button
                  onClick={() => setShowSendModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-slate-600 mb-4">
                  Você selecionou <strong>{selectedJerseys.size}</strong> camisa
                  {selectedJerseys.size > 1 ? 's' : ''}
                </p>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Número do WhatsApp do cliente
                </label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+55 11 91234-5678"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Formato: +55 (DDD) número (ex: +55 11 91234-5678)
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSendModal(false)}
                  disabled={sending}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 rounded-lg transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSendToClient}
                  disabled={sending || !clientPhone}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
