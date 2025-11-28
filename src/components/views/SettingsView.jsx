import React, { useState, useEffect } from 'react';

const SettingsView = ({ account, onSaveSettings, onDelete }) => {
  const [commands, setCommands] = useState('');
  const [delay, setDelay] = useState(5);
  const [saveState, setSaveState] = useState('idle');

  useEffect(() => {
    if (account) {
      setCommands(account.autoLoginCommands || '');
      setDelay(account.commandDelay || 5);
    }
  }, [account]);

  const handleSave = () => {
    onSaveSettings(account.username, { autoLoginCommands: commands, commandDelay: delay });
    setSaveState('saving');
    setTimeout(() => setSaveState('idle'), 2000);
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg space-y-6">
      <div>
        <h4 className="text-lg font-semibold mb-2">Otomatik Komutlar (Giriş Sonrası)</h4>
        <p className="text-sm text-gray-400 mb-2">Her satıra bir komut yazın. Bot oyuna girdikten sonra bu komutları sırayla gönderecektir.</p>
        <textarea value={commands} onChange={(e) => setCommands(e.target.value)} className="bg-gray-700 rounded p-2 w-full text-white font-mono" rows="4" placeholder="/login şifreniz&#10;/skyblock"/>
        <div className="flex items-center space-x-2 mt-2">
            <label htmlFor="cmd-delay">Komutlar arası bekleme (saniye):</label>
            <input type="number" id="cmd-delay" value={delay} min="1" onChange={(e) => setDelay(Number(e.target.value))} className="bg-gray-700 rounded p-2 w-20 text-center"/>
        </div>
      </div>
      <div className="pt-2">
        <button onClick={handleSave} className={`font-bold py-2 px-6 rounded transition-colors duration-200 ${saveState === 'saving' ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`} disabled={saveState === 'saving'}>
            {saveState === 'saving' ? 'Kaydedildi!' : 'Ayarları Kaydet'}
        </button>
      </div>
      <div className="border-t border-gray-700"></div>
      <div>
        <h4 className="text-lg font-semibold mb-2 text-red-400">Tehlikeli Alan</h4>
        <button onClick={() => { if(window.confirm(`'${account.username}' adlı hesabı silmek istediğinizden emin misiniz?`)) onDelete(account.username) }} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Bu Hesabı Sil</button>
      </div>
    </div>
  );
};
export default SettingsView;