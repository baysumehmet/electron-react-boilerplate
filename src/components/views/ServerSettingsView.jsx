import React, { useState, useEffect } from 'react';

// Hardcode the list of versions as requested by the user.
const SUPPORTED_VERSIONS = [
  '1.8', '1.9', '1.10', '1.11', '1.12', '1.13', '1.14', '1.15', '1.16', 
  '1.17', '1.18', '1.19', '1.20'
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
    <div className="bg-gray-900 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src="src/logos/afkplustext.png" alt="AFK Plus" className="max-w-xs" />
        </div>
        <div className="bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="space-y-6">
            <div>
              <label htmlFor="server-host" className="block text-sm font-medium text-gray-300 mb-2">
                Sunucu Adresi
              </label>
              <input
                type="text"
                id="server-host"
                value={host}
                onChange={e => setHost(e.target.value)}
                className="bg-gray-700 border-2 border-gray-600 rounded-md p-3 w-full text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition"
                placeholder="ornek.sunucu.com"
              />
            </div>
            
            <div className="flex space-x-4">
              <div className="flex-1">
                <label htmlFor="server-port" className="block text-sm font-medium text-gray-300 mb-2">
                  Port
                </label>
                <input
                  type="text"
                  pattern="\d*"
                  id="server-port"
                  value={port}
                  onChange={handlePortChange}
                  className="bg-gray-700 border-2 border-gray-600 rounded-md p-3 w-full text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition"
                  placeholder="25565"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="server-version" className="block text-sm font-medium text-gray-300 mb-2">
                  Sürüm
                </label>
                <select
                  id="server-version"
                  value={version}
                  onChange={e => setVersion(e.target.value)}
                  className="bg-gray-700 border-2 border-gray-600 rounded-md p-3 w-full text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition appearance-none"
                >
                  <option value="">Otomatik</option>
                  {SUPPORTED_VERSIONS.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4">
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
          </div>
        </div>
        <p className="text-center text-gray-500 text-xs mt-6">
          Gerekli alanları doldurduktan sonra ana ekrana yönlendirileceksiniz.
        </p>
      </div>
    </div>
  );
};

export default ServerSettingsView;