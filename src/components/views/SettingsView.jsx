import React, { useState, useEffect } from 'react';

const SettingsView = ({ account, onSaveSettings, onDelete }) => {
  const [commands, setCommands] = useState('');
  const [delay, setDelay] = useState(5);
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [proxyEnabled, setProxyEnabled] = useState(false);
  const [proxy, setProxy] = useState({ type: 'SOCKS5', host: '', port: '', username: '', password: '' });
  const [saveState, setSaveState] = useState('idle');

  useEffect(() => {
    if (account) {
      setCommands(account.autoLoginCommands || '');
      setDelay(account.commandDelay || 5);
      setAutoReconnect(account.autoReconnect !== undefined ? account.autoReconnect : true);
      setProxyEnabled(!!account.proxy);
      if (account.proxy) {
        setProxy(account.proxy);
      }
    }
  }, [account]);

  const handleSave = () => {
    const settingsToSave = { 
      autoLoginCommands: commands, 
      commandDelay: delay,
      autoReconnect: autoReconnect,
      proxy: proxyEnabled ? proxy : null,
    };
    onSaveSettings(account.username, settingsToSave);
    setSaveState('saving');
    setTimeout(() => setSaveState('idle'), 2000);
  };

  return (
    <div className="p-6 bg-background rounded-lg max-w-2xl mx-auto">
      <h4 className="text-xl font-bold mb-6 text-text-primary">Hesap Ayarları</h4>
      
      {/* Genel Ayarlar */}
      <div className="space-y-4 mb-8">
        <div>
          <label className="flex items-center cursor-pointer">
            <input 
              type="checkbox"
              checked={autoReconnect}
              onChange={(e) => setAutoReconnect(e.target.checked)}
              className="w-5 h-5 rounded text-primary bg-surface border-background focus:ring-primary"
            />
            <span className="ml-3 text-sm font-medium text-text-secondary">Bağlantı kesildiğinde otomatik olarak yeniden bağlan</span>
          </label>
        </div>
      </div>

      {/* Proxy Ayarları */}
      <div className="space-y-4 mb-8 border-t border-background pt-6">
        <h5 className="text-lg font-semibold mb-3 text-text-primary">Proxy Ayarları</h5>
        <label className="flex items-center cursor-pointer">
          <input 
            type="checkbox"
            checked={proxyEnabled}
            onChange={(e) => setProxyEnabled(e.target.checked)}
            className="w-5 h-5 rounded text-primary bg-surface border-background focus:ring-primary"
          />
          <span className="ml-3 text-sm font-medium text-text-secondary">Proxy ile bağlan</span>
        </label>
        {proxyEnabled && (
          <div className="space-y-4 pl-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Proxy Tipi</label>
                <select value={proxy.type} onChange={e => setProxy({...proxy, type: e.target.value})} className="bg-surface border-2 border-background rounded-md p-3 w-full text-text-primary focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition appearance-none">
                  <option value="SOCKS5">SOCKS5</option>
                  <option value="HTTP">HTTP/HTTPS</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Sunucu</label>
                <input type="text" value={proxy.host} onChange={e => setProxy({...proxy, host: e.target.value})} placeholder="127.0.0.1" className="bg-surface border-2 border-background rounded-md p-3 w-full text-text-primary focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Port</label>
                <input type="number" value={proxy.port} onChange={e => setProxy({...proxy, port: e.target.value})} placeholder="9050" className="bg-surface border-2 border-background rounded-md p-3 w-full text-text-primary focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Kullanıcı Adı (İsteğe Bağlı)</label>
                <input type="text" value={proxy.username} onChange={e => setProxy({...proxy, username: e.target.value})} className="bg-surface border-2 border-background rounded-md p-3 w-full text-text-primary focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Şifre (İsteğe Bağlı)</label>
                <input type="password" value={proxy.password} onChange={e => setProxy({...proxy, password: e.target.value})} className="bg-surface border-2 border-background rounded-md p-3 w-full text-text-primary focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Otomatik Komutlar */}
      <div className="space-y-4 border-t border-background pt-6">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Otomatik Komutlar (Giriş Sonrası)</label>
          <p className="text-xs text-text-secondary mb-2">Her satıra bir komut yazın. Bot oyuna girdikten sonra bu komutları sırayla gönderecektir.</p>
          <textarea 
            value={commands} 
            onChange={(e) => setCommands(e.target.value)} 
            className="bg-surface rounded-md p-3 w-full text-text-primary font-mono border-2 border-background focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition" 
            rows="5" 
            placeholder="/login <şifreniz>
/party accept <yakın arkadaşınız>
/is home"
          />
        </div>
        <div className="flex items-center space-x-3">
            <label htmlFor="cmd-delay" className="text-sm font-medium text-text-secondary">Komutlar arası bekleme:</label>
            <input 
              type="number" 
              id="cmd-delay" 
              value={delay} 
              min="1" 
              onChange={(e) => setDelay(Number(e.target.value))} 
              className="bg-surface rounded-md p-2 w-24 text-center text-text-primary border-2 border-background focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition"
            />
            <span className="text-sm text-text-secondary">saniye</span>
        </div>
      </div>

      {/* Kaydet Butonu */}
      <div className="mt-8">
        <button 
          onClick={handleSave} 
          className={`w-full font-bold py-3 px-6 rounded-md transition-all duration-300 ease-in-out text-white text-lg ${
            saveState === 'saving' 
              ? 'bg-green-600 cursor-not-allowed' 
              : 'bg-primary hover:bg-primary-hover focus:ring-4 focus:ring-primary focus:ring-opacity-50'
          }`} 
          disabled={saveState === 'saving'}
        >
          {saveState === 'saving' ? 'Kaydedildi!' : 'Ayarları Kaydet'}
        </button>
      </div>

      {/* Tehlikeli Alan */}
      <div className="border-t border-background mt-10 pt-6">
        <h5 className="text-lg font-semibold mb-3 text-red-500">Tehlikeli Alan</h5>
        <p className="text-sm text-text-secondary mb-4">Bu işlem geri alınamaz. Hesabınıza ait tüm ayarlar kalıcı olarak silinecektir.</p>
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
