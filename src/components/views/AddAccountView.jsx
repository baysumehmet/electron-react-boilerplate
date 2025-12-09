import React, { useState } from 'react';

const AddAccountView = ({ accounts, onAdd, onImportAccounts, onExportAccounts }) => {
  const [username, setUsername] = useState('');
  const [auth, setAuth] = useState('offline');
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Kullanıcı adı boş bırakılamaz.');
      return;
    }
    const isDuplicate = accounts.some(acc => acc.username.toLowerCase() === username.toLowerCase());
    if (isDuplicate) {
      setError('Bu kullanıcı adına sahip bir hesap zaten mevcut.');
      return;
    }
    
    let accountData = { username, auth };

    setError(null);
    onAdd(accountData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-8">
          <img src="src/logos/afkplustext.png" alt="AFK Plus" className="max-w-xs" />
        </div>
        <div className="bg-surface rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-center text-text-primary">Yeni Hesap Ekle</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account Info */}
            <div>
              <label htmlFor="acc-username" className="block text-sm font-medium text-text-secondary mb-2">Kullanıcı Adı</label>
              <input type="text" id="acc-username" value={username} onChange={e => setUsername(e.target.value)} className="bg-background border-2 border-surface rounded-md p-3 w-full text-text-primary focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition" required />
              {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
            </div>
            <div>
              <label htmlFor="acc-auth" className="block text-sm font-medium text-text-secondary mb-2">Kimlik Doğrulama</label>
              <select id="acc-auth" value={auth} onChange={e => setAuth(e.target.value)} className="bg-background border-2 border-surface rounded-md p-3 w-full text-text-primary focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition appearance-none">
                <option value="offline">Çevrimdışı (Crackli)</option>
                <option value="microsoft" disabled>Microsoft (Yakında)</option>
              </select>
            </div>

            <div className="pt-4">
              <button type="submit" className="w-full font-bold py-3 px-6 rounded-md transition-all duration-300 ease-in-out text-white text-lg bg-primary hover:bg-primary-hover focus:ring-4 focus:ring-primary focus:ring-opacity-50">
                Hesabı Ekle
              </button>
            </div>
          </form>
        </div>

        {/* Import/Export Section */}
        <div className="bg-surface rounded-lg shadow-lg p-6 mt-6">
            <h3 className="text-lg font-semibold text-center text-text-primary mb-4">Hesapları Yönet</h3>
            <div className="flex gap-x-4">
                <label className="flex-1 w-full bg-background hover:bg-opacity-80 text-text-primary font-semibold py-3 px-4 rounded-lg text-center cursor-pointer transition-all text-sm">
                    <i className="fas fa-upload mr-2"></i> İçe Aktar (.json)
                    <input type="file" accept=".json" className="hidden" onChange={onImportAccounts} />
                </label>
                <button onClick={onExportAccounts} className="flex-1 w-full bg-background hover:bg-opacity-80 text-text-primary font-semibold py-3 px-4 rounded-lg transition-all text-sm">
                    <i className="fas fa-download mr-2"></i> Dışa Aktar
                </button>
            </div>
            <p className="text-center text-text-secondary text-xs mt-4">
                Mevcut hesap listenizi bir JSON dosyası olarak içeri veya dışarı aktarın.
            </p>
        </div>

        <p className="text-center text-text-secondary text-xs mt-6">
          Hesap ekledikten sonra ana ekrana yönlendirileceksiniz.
        </p>
      </div>
    </div>
  );
};
export default AddAccountView;
