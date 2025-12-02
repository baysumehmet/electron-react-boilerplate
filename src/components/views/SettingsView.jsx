import React, { useState, useEffect } from 'react';

const SettingsView = ({ account, onSaveSettings, onDelete }) => {
  const [commands, setCommands] = useState('');
  const [delay, setDelay] = useState(5);
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [saveState, setSaveState] = useState('idle');

  useEffect(() => {
    if (account) {
      setCommands(account.autoLoginCommands || '');
      setDelay(account.commandDelay || 5);
      setAutoReconnect(account.autoReconnect !== undefined ? account.autoReconnect : true);
    }
  }, [account]);

  const handleSave = () => {
    onSaveSettings(account.username, { 
      autoLoginCommands: commands, 
      commandDelay: delay,
      autoReconnect: autoReconnect,
    });
    setSaveState('saving');
    setTimeout(() => setSaveState('idle'), 2000);
  };

  return (
    <div className="p-6 bg-gray-900/50 rounded-lg max-w-2xl mx-auto">
      <h4 className="text-xl font-bold mb-6 text-white">Hesap Ayarları</h4>
      
      {/* Genel Ayarlar */}
      <div className="space-y-4 mb-8">
        <div>
          <label className="flex items-center cursor-pointer">
            <input 
              type="checkbox"
              checked={autoReconnect}
              onChange={(e) => setAutoReconnect(e.target.checked)}
              className="w-5 h-5 rounded text-indigo-500 bg-gray-700 border-gray-600 focus:ring-indigo-500"
            />
            <span className="ml-3 text-sm font-medium text-gray-300">Bağlantı kesildiğinde otomatik olarak yeniden bağlan</span>
          </label>
        </div>
      </div>

      {/* Otomatik Komutlar */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Otomatik Komutlar (Giriş Sonrası)</label>
          <p className="text-xs text-gray-400 mb-2">Her satıra bir komut yazın. Bot oyuna girdikten sonra bu komutları sırayla gönderecektir.</p>
          <textarea 
            value={commands} 
            onChange={(e) => setCommands(e.target.value)} 
            className="bg-gray-700 rounded-md p-3 w-full text-white font-mono border-2 border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition" 
            rows="5" 
            placeholder="/login <şifreniz>
/party accept <yakın arkadaşınız>
/is home"
          />
        </div>
        <div className="flex items-center space-x-3">
            <label htmlFor="cmd-delay" className="text-sm font-medium text-gray-300">Komutlar arası bekleme:</label>
            <input 
              type="number" 
              id="cmd-delay" 
              value={delay} 
              min="1" 
              onChange={(e) => setDelay(Number(e.target.value))} 
              className="bg-gray-700 rounded-md p-2 w-24 text-center text-white border-2 border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition"
            />
            <span className="text-sm text-gray-400">saniye</span>
        </div>
      </div>

      {/* Kaydet Butonu */}
      <div className="mt-8">
        <button 
          onClick={handleSave} 
          className={`w-full font-bold py-3 px-6 rounded-md transition-all duration-300 ease-in-out text-white text-lg ${
            saveState === 'saving' 
              ? 'bg-green-600 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50'
          }`} 
          disabled={saveState === 'saving'}
        >
          {saveState === 'saving' ? 'Kaydedildi!' : 'Ayarları Kaydet'}
        </button>
      </div>

      {/* Tehlikeli Alan */}
      <div className="border-t border-gray-700 mt-10 pt-6">
        <h5 className="text-lg font-semibold mb-3 text-red-500">Tehlikeli Alan</h5>
        <p className="text-sm text-gray-400 mb-4">Bu işlem geri alınamaz. Hesabınıza ait tüm ayarlar kalıcı olarak silinecektir.</p>
        <button 
          onClick={() => { if(window.confirm(`'${account.username}' adlı hesabı kalıcı olarak silmek istediğinizden emin misiniz?`)) onDelete(account.username) }} 
          className="bg-red-800 hover:bg-red-700 text-white font-bold py-2 px-5 rounded-md transition-colors w-full sm:w-auto"
        >
          Bu Hesabı Sil
        </button>
      </div>
    </div>
  );
};
export default SettingsView;
