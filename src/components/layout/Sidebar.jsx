import React from 'react';

const AccountIcon = ({ account, isActive, onSelect }) => {
  const headUrl = `https://mc-heads.net/avatar/${account.username}/48`;
  return (
    <button onClick={() => onSelect(account.username)} title={account.username} className={`w-full flex flex-col items-center justify-center p-1 space-y-1 rounded-md transition-all duration-200 ${isActive ? 'bg-blue-600/30' : 'hover:bg-gray-700'}`}>
      <div className={`relative w-12 h-12`}>
        <div className={`absolute left-[-8px] top-1/2 -translate-y-1/2 h-8 w-1 bg-white rounded-r-full transition-transform duration-300 ${isActive ? 'scale-y-100' : 'scale-y-0'}`}></div>
        <img src={headUrl} alt={account.username} className={`w-12 h-12 transition-all duration-200 ${isActive ? 'rounded-2xl' : 'rounded-full'}`} />
      </div>
      <span className="text-xs text-gray-300 w-full text-center truncate">{account.username}</span>
    </button>
  );
};

const Sidebar = ({ accounts, activeAccount, onAccountSelect, onAddAccount, onGoHome }) => {
  return (
    <div className="w-24 bg-gray-800 p-2 flex flex-col items-center space-y-2">
      <button onClick={onGoHome} title="Sunucu Ayarları" className="w-16 h-16 p-2 flex items-center justify-center font-bold text-xl text-white transition-colors duration-200 hover:bg-gray-700 rounded-2xl">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
      </button>
      <div className="border-t border-gray-700 w-full my-0"></div>
      <div className="flex-grow w-full space-y-2 overflow-y-auto">
        {accounts.map(acc => (<AccountIcon key={acc.username} account={acc} isActive={activeAccount === acc.username} onSelect={onAccountSelect} />))}
      </div>
      <div className="border-t border-gray-700 w-full my-0"></div>
      <button onClick={onAddAccount} title="Yeni Hesap Ekle" className="w-12 h-12 bg-gray-700 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-2xl cursor-pointer hover:bg-green-500 transition-all duration-200">+</button>
    </div>
  );
};

export default Sidebar;
