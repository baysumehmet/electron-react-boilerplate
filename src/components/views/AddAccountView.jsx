import React, { useState } from 'react';

const AddAccountView = ({ accounts, onAdd }) => {
  const [username, setUsername] = useState('');
  const [auth, setAuth] = useState('offline');
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Kullanıcı adı boş bırakılamaz.');
      return;
    }
    // Check for duplicates (case-insensitive)
    const isDuplicate = accounts.some(
      (acc) => acc.username.toLowerCase() === username.toLowerCase()
    );

    if (isDuplicate) {
      setError('Bu kullanıcı adına sahip bir hesap zaten mevcut.');
      return;
    }
    
    // If all checks pass, clear any previous error and call onAdd
    setError(null);
    onAdd({ username, auth });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src="src/logos/afkplustext.png" alt="AFK Plus" className="max-w-xs" />
        </div>
        <div className="bg-surface rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-center text-text-primary">Yeni Hesap Ekle</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="acc-username" className="block text-sm font-medium text-text-secondary mb-2">Kullanıcı Adı</label>
              <input 
                type="text" 
                id="acc-username" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                className="bg-background border-2 border-surface rounded-md p-3 w-full text-text-primary focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition" 
                required 
              />
              {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
            </div>
            <div>
              <label htmlFor="acc-auth" className="block text-sm font-medium text-text-secondary mb-2">Kimlik Doğrulama</label>
              <select 
                id="acc-auth" 
                value={auth} 
                onChange={e => setAuth(e.target.value)} 
                className="bg-background border-2 border-surface rounded-md p-3 w-full text-text-primary focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition appearance-none"
              >
                <option value="offline">Çevrimdışı (Crackli)</option>
                <option value="microsoft" disabled>Microsoft (Yakında)</option>
              </select>
            </div>
            <div className="pt-4">
              <button 
                type="submit" 
                className="w-full font-bold py-3 px-6 rounded-md transition-all duration-300 ease-in-out text-white text-lg bg-primary hover:bg-primary-hover focus:ring-4 focus:ring-primary focus:ring-opacity-50"
              >
                Hesabı Ekle
              </button>
            </div>
          </form>
        </div>
        <p className="text-center text-text-secondary text-xs mt-6">
          Eklemek istediğiniz hesabın bilgilerini girin.
        </p>
      </div>
    </div>
  );
};
export default AddAccountView;
