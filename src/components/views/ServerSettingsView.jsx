import React, { useState, useEffect } from 'react';

const ServerSettingsView = ({ initialServerInfo, onSave }) => {
  const [host, setHost] = useState('');
  const [port, setPort] = useState(''); // Default to empty string
  const [saveState, setSaveState] = useState('idle');

  useEffect(() => {
    if (initialServerInfo) {
      setHost(initialServerInfo.host || '');
      setPort(initialServerInfo.port || ''); // Can be empty
    }
  }, [initialServerInfo]);

  const handleSave = () => {
    // Only pass the port if it's not an empty string.
    const serverInfoToSave = { host, port: port ? Number(port) : undefined };
    onSave(serverInfoToSave);
    setSaveState('saving');
    setTimeout(() => setSaveState('idle'), 2000);
  };
  
  const handlePortChange = (e) => {
    const value = e.target.value;
    // Allow only numbers
    if (/^\d*$/.test(value)) {
      setPort(value);
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Sunucu Ayarları</h2>
      <div className="space-y-6 max-w-lg">
        <div>
          <label htmlFor="server-host" className="block text-sm font-medium text-gray-300 mb-1">
            Sunucu Adresi
          </label>
          <input
            type="text"
            id="server-host"
            value={host}
            onChange={e => setHost(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded p-2 w-full text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="ornek.sunucu.com"
          />
        </div>
        
        <div>
            <label htmlFor="server-port" className="block text-sm font-medium text-gray-300 mb-1">
              Port (isteğe bağlı)
            </label>
            <input
              type="text" // Use text to allow empty string
              pattern="\d*" // Suggest numeric input to browsers
              id="server-port"
              value={port}
              onChange={handlePortChange}
              className="bg-gray-700 border border-gray-600 rounded p-2 w-32 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="25565"
            />
             <p className="text-xs text-gray-400 mt-2">Boş bırakılırsa varsayılan (25565) kullanılır.</p>
        </div>

        <div className="pt-2">
          <button 
            onClick={handleSave} 
            className={`font-bold py-2 px-6 rounded transition-all duration-200 ease-in-out w-32 text-center ${
              saveState === 'saving' 
                ? 'bg-green-600 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`} 
            disabled={saveState === 'saving'}
          >
            {saveState === 'saving' ? 'Kaydedildi!' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default ServerSettingsView;
