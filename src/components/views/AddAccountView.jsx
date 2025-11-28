import React, { useState } from 'react';

const AddAccountView = ({ onAdd }) => {
  const [username, setUsername] = useState('');
  const [auth, setAuth] = useState('offline');
  const handleSubmit = (e) => { e.preventDefault(); if (!username.trim()) { alert('Kullanıcı adı boş bırakılamaz.'); return; } onAdd({ username, auth, }); };
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Yeni Hesap Ekle</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <div>
          <label htmlFor="acc-username" className="block text-sm font-medium text-gray-300">Kullanıcı Adı</label>
          <input type="text" id="acc-username" value={username} onChange={e => setUsername(e.target.value)} className="mt-1 bg-gray-700 rounded p-2 w-full text-white" required />
        </div>
        <div>
          <label htmlFor="acc-auth" className="block text-sm font-medium text-gray-300">Kimlik Doğrulama</label>
          <select id="acc-auth" value={auth} onChange={e => setAuth(e.target.value)} className="mt-1 bg-gray-700 rounded p-2 w-full text-white">
            <option value="offline">Çevrimdışı (Offline)</option>
            <option value="microsoft" disabled>Microsoft (Yakında)</option>
          </select>
        </div>
        <div className="pt-4"><button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded">Hesabı Ekle</button></div>
      </form>
    </div>
  );
};
export default AddAccountView;
