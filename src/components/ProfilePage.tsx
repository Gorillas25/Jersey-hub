import { useState, useEffect } from 'react';
import { Phone, Lock, Save, AlertCircle } from 'lucide-react';
import InputMask from 'react-input-mask';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [phoneSuccess, setPhoneSuccess] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Preenche o campo de telefone quando o perfil carrega
  useEffect(() => {
    if (profile?.phone) {
      setPhone(profile.phone);
    }
  }, [profile]);

  const handleSavePhone = async () => {
    setPhoneError('');
    setPhoneSuccess('');
    if (!phone.trim() || phone.includes('_')) {
      setPhoneError('Por favor, preencha o número de telefone completo.');
      return;
    }
    setIsSavingPhone(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ phone: phone })
        .eq('id', user!.id);

      if (error) throw error;
      
      setPhoneSuccess('Telefone atualizado com sucesso!');
      await refreshProfile(); // Atualiza o perfil no AuthContext

    } catch (error: any) {
      console.error("Erro ao salvar o telefone:", error.message);
      setPhoneError('Não foi possível salvar seu telefone. Tente novamente.');
    } finally {
      setIsSavingPhone(false);
    }
  };

  const handleSavePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');
    if (newPassword.length < 6) {
      setPasswordError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem.');
      return;
    }
    setIsSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) throw error;

      setPasswordSuccess('Senha alterada com sucesso!');
      setNewPassword(''); // Limpa os campos após sucesso
      setConfirmPassword('');

    } catch (error: any) {
      console.error("Erro ao alterar a senha:", error.message);
      setPasswordError('Não foi possível alterar a senha. Tente novamente.');
    } finally {
      setIsSavingPassword(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-100">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Meus Dados</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* --- SEÇÃO ALTERAR TELEFONE --- */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <Phone className="w-5 h-5 text-emerald-600" />
              Alterar Telefone
            </h2>

            {phoneError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> {phoneError}
              </div>
            )}
            {phoneSuccess && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm">
                {phoneSuccess}
              </div>
            )}

            <div className="mb-4">
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
              <p className="text-xs text-slate-500 mt-1">Este número será usado para seus clientes entrarem em contato.</p>
            </div>
            <button
              onClick={handleSavePhone}
              disabled={isSavingPhone}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {isSavingPhone ? 'Salvando...' : 'Salvar Telefone'}
            </button>
          </div>

          {/* --- SEÇÃO ALTERAR SENHA --- */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-600" />
              Alterar Senha
            </h2>

             {passwordError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                 <AlertCircle className="w-5 h-5" /> {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm">
                {passwordSuccess}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nova Senha
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Pelo menos 6 caracteres"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Confirmar Nova Senha
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSavePassword}
              disabled={isSavingPassword}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {isSavingPassword ? 'Salvando...' : 'Salvar Nova Senha'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}