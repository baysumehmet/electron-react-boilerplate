import React, { useState, useEffect } from 'react';

// Hardcode the list of versions as requested by the user.
const SUPPORTED_VERSIONS = [
  '1.8', '1.9', '1.10', '1.11', '1.12', '1.13', '1.14', '1.15', '1.16', 
  '1.17', '1.18', '1.19', '1.20', '1.21.8'
];

const ServerSettingsView = ({ initialServerInfo, onSave }) => {
  const [host, setHost] = useState('');
  const [port, setPort] = useState('');
  const [version, setVersion] = useState('');
  const [saveState, setSaveState] = useState('idle');

  // Set initial form values from props
  useEffect(() => {
    if (initialServerInfo) {
      setHost(initialServerInfo.host || '');
      setPort(initialServerInfo.port || '');
      setVersion(initialServerInfo.version || ''); 
    }
  }, [initialServerInfo]);

  const handleSave = () => {
    const serverInfoToSave = { 
      host, 
      port: port ? Number(port) : undefined,
      version: version || false
    };
    onSave(serverInfoToSave);
    setSaveState('saving');
    setTimeout(() => setSaveState('idle'), 2000);
  };
  
  const handlePortChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setPort(value);
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Sunucu Ayarları</h2>
      <div className="space-y-6 max-w-lg">
        {/* Host and Port inputs remain the same */}
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
              type="text"
              pattern="\d*"
              id="server-port"
              value={port}
              onChange={handlePortChange}
              className="bg-gray-700 border border-gray-600 rounded p-2 w-32 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="25565"
            />
             <p className="text-xs text-gray-400 mt-2">Boş bırakılırsa varsayılan (25565) kullanılır.</p>
        </div>

        {/* Version dropdown using the hardcoded list */}
        <div>
            <label htmlFor="server-version" className="block text-sm font-medium text-gray-300 mb-1">
              Sürüm (isteğe bağlı)
            </label>
            <select
              id="server-version"
              value={version}
              onChange={e => setVersion(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded p-2 w-full text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Otomatik Algıla</option>
              {SUPPORTED_VERSIONS.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
             <p className="text-xs text-gray-400 mt-2">Boş bırakılırsa en uygun sürüm otomatik olarak denenir.</p>
        </div>

        {/* Save button remains the same */}
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