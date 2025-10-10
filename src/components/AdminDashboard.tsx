import { useState, useEffect } from 'react';
import { Upload, Trash2, Edit2, X, Users, ShoppingBag } from 'lucide-react';
import { supabase, Jersey, Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function AdminDashboard() {
  const { user } = useAuth();
  const [jerseys, setJerseys] = useState<Jersey[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingJersey, setEditingJersey] = useState<Jersey | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'jerseys' | 'users'>('jerseys');

  const [formData, setFormData] = useState({
    title: '',
    team_name: '',
    tags: '',
    image: null as File | null,
  });

  useEffect(() => {
    loadJerseys();
    loadUsers();
  }, []);

  const loadJerseys = async () => {
    const { data, error } = await supabase
      .from('jerseys')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setJerseys(data);
    }
  };

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUsers(data);
    }
  };

  const handleImageUpload = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('jerseys')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data } = supabase.storage.from('jerseys').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = editingJersey?.image_url || '';

      if (formData.image) {
        const uploadedUrl = await handleImageUpload(formData.image);
        if (!uploadedUrl) {
          alert('Erro ao fazer upload da imagem');
          setLoading(false);
          return;
        }
        imageUrl = uploadedUrl;
      }

      const tags = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      if (editingJersey) {
        const { error } = await supabase
          .from('jerseys')
          .update({
            title: formData.title,
            team_name: formData.team_name,
            tags,
            image_url: imageUrl,
          })
          .eq('id', editingJersey.id);

        if (error) throw error;
        alert('Camisa atualizada com sucesso!');
      } else {
        const { error } = await supabase.from('jerseys').insert({
          title: formData.title,
          team_name: formData.team_name,
          tags,
          image_url: imageUrl,
          created_by: user?.id,
        });

        if (error) throw error;
        alert('Camisa cadastrada com sucesso!');
      }

      setFormData({ title: '', team_name: '', tags: '', image: null });
      setShowUploadForm(false);
      setShowEditForm(false);
      setEditingJersey(null);
      loadJerseys();
    } catch (error) {
      console.error('Error:', error);
      alert('Erro ao salvar camisa');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, imageUrl: string) => {
    if (!confirm('Tem certeza que deseja deletar esta camisa?')) return;

    try {
      const { error } = await supabase.from('jerseys').delete().eq('id', id);

      if (error) throw error;

      const fileName = imageUrl.split('/').pop();
      if (fileName) {
        await supabase.storage.from('jerseys').remove([fileName]);
      }

      alert('Camisa deletada com sucesso!');
      loadJerseys();
    } catch (error) {
      console.error('Error:', error);
      alert('Erro ao deletar camisa');
    }
  };

  const handleEdit = (jersey: Jersey) => {
    setEditingJersey(jersey);
    setFormData({
      title: jersey.title,
      team_name: jersey.team_name,
      tags: jersey.tags.join(', '),
      image: null,
    });
    setShowEditForm(true);
  };

  const handleUpdateUserSubscription = async (
    userId: string,
    status: 'active' | 'inactive',
    endDate: string | null
  ) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: status,
          subscription_end_date: endDate,
        })
        .eq('id', userId);

      if (error) throw error;
      alert('Assinatura atualizada!');
      loadUsers();
    } catch (error) {
      console.error('Error:', error);
      alert('Erro ao atualizar assinatura');
    }
  };

  const FormModal = ({ title, onClose }: { title: string; onClose: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Título da Camisa
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Ex: Flamengo Home 2024"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nome do Time
            </label>
            <input
              type="text"
              value={formData.team_name}
              onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Ex: Flamengo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tags (separadas por vírgula)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Ex: 2024, home, titular"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Imagem {editingJersey && '(deixe em branco para manter a atual)'}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setFormData({ ...formData, image: e.target.files?.[0] || null })
              }
              required={!editingJersey}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Salvando...' : editingJersey ? 'Atualizar' : 'Cadastrar'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 rounded-lg transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Painel Administrativo</h1>
          <p className="text-slate-600">Gerencie o catálogo e usuários</p>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('jerseys')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'jerseys'
                ? 'bg-emerald-500 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            Camisas
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'users'
                ? 'bg-emerald-500 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Users className="w-5 h-5" />
            Usuários
          </button>
        </div>

        {activeTab === 'jerseys' && (
          <>
            <button
              onClick={() => setShowUploadForm(true)}
              className="mb-6 flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              <Upload className="w-5 h-5" />
              Cadastrar Nova Camisa
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {jerseys.map((jersey) => (
                <div
                  key={jersey.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden"
                >
                  <img
                    src={jersey.image_url}
                    alt={jersey.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-900 mb-1">{jersey.title}</h3>
                    <p className="text-sm text-slate-600 mb-2">{jersey.team_name}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {jersey.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(jersey)}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm transition"
                      >
                        <Edit2 className="w-4 h-4" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(jersey.id, jersey.image_url)}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm transition"
                      >
                        <Trash2 className="w-4 h-4" />
                        Deletar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                    Email
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                    Função
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100">
                    <td className="px-6 py-4 text-sm text-slate-900">{user.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {user.role === 'admin' ? 'Admin' : 'Revendedor'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          user.subscription_status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {user.subscription_status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.subscription_status === 'active' ? (
                        <button
                          onClick={() => handleUpdateUserSubscription(user.id, 'inactive', null)}
                          className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          Desativar
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const endDate = new Date();
                            endDate.setMonth(endDate.getMonth() + 1);
                            handleUpdateUserSubscription(
                              user.id,
                              'active',
                              endDate.toISOString()
                            );
                          }}
                          className="text-sm text-green-600 hover:text-green-700 font-medium"
                        >
                          Ativar (1 mês)
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showUploadForm && (
          <FormModal
            title="Cadastrar Nova Camisa"
            onClose={() => {
              setShowUploadForm(false);
              setFormData({ title: '', team_name: '', tags: '', image: null });
            }}
          />
        )}

        {showEditForm && (
          <FormModal
            title="Editar Camisa"
            onClose={() => {
              setShowEditForm(false);
              setEditingJersey(null);
              setFormData({ title: '', team_name: '', tags: '', image: null });
            }}
          />
        )}
      </div>
    </div>
  );
}
