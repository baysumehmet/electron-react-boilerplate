import React from 'react';

const AccountListItem = ({ account, botState, isActive, isSelected, onSelect, onToggle }) => {
  const headUrl = `https://mc-heads.net/avatar/${account.username}/40`;
  const isConnected = botState?.isConnected || false;

  const handleCheckboxClick = (e) => {
    e.stopPropagation(); // Butona tıklanmasını engelle
    onToggle(account.username);
  };
  
  return (
    <div 
        onClick={() => onSelect(account.username)}
        className={`w-full flex items-center p-2 rounded-lg cursor-pointer transition-all duration-200 ${isActive ? 'bg-primary/30' : 'hover:bg-background'}`}
    >
        <div className="flex items-center mr-3" onClick={handleCheckboxClick}>
            <input 
                type="checkbox" 
                checked={isSelected}
                readOnly
                className="w-5 h-5 rounded-md text-primary bg-surface border-gray-600 focus:ring-primary"
            />
        </div>
        <img src={headUrl} alt={account.username} className="w-10 h-10 rounded-lg mr-3" />
        <div className="flex-grow">
            <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-text-primary truncate">{account.username}</span>
                <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} title={isConnected ? 'Bağlı' : 'Bağlı Değil'}></span>
            </div>
        </div>
    </div>
  );
};


const Sidebar = ({ 
    accounts, 
    botsState, 
    activeAccount, 
    selectedAccounts,
    onAccountSelect, 
    onAccountToggle,
    onAddAccount, 
    onGoHome,
    onConnectSelected,
    onDisconnectSelected,
    onImportAccounts,
    onExportAccounts,
}) => {
  return (
    <div className="w-72 bg-surface p-3 flex flex-col">
      <button onClick={onGoHome} title="Sunucu Ayarları" className="w-full p-3 flex items-center justify-center text-text-primary transition-colors duration-200 hover:bg-background rounded-lg mb-3">
        <img src="src/logos/afkpluslogoclear.png" alt="Sunucu Ayarları" className="h-10 w-10 rounded-full mr-3" />
        <span className="font-bold text-xl">AFKPlus</span>
      </button>
      
      <div className="flex-grow w-full space-y-2 overflow-y-auto pr-1">
        {accounts.map(acc => (
          <AccountListItem 
            key={acc.username} 
            account={acc}
            botState={botsState[acc.username]}
            isActive={activeAccount === acc.username} 
            isSelected={selectedAccounts.includes(acc.username)}
            onSelect={onAccountSelect}
            onToggle={onAccountToggle}
          />
        ))}
      </div>
      
      <div className="mt-auto flex-shrink-0 pt-3 border-t border-gray-600">
        <div className="space-y-2">
           <button 
            onClick={onConnectSelected} 
            disabled={selectedAccounts.length === 0}
            className="w-full bg-green-600 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center transition-all shadow-md hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            Seçilileri Başlat
          </button>
          <button 
            onClick={onDisconnectSelected} 
            disabled={selectedAccounts.length === 0}
            className="w-full bg-red-600 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center transition-all shadow-md hover:bg-red-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            Seçilileri Durdur
          </button>
        </div>
        <button 
          onClick={onAddAccount} 
          title="Yeni Hesap Ekle" 
          className="w-full mt-3 bg-primary rounded-lg flex items-center justify-center py-2.5 font-bold text-lg cursor-pointer hover:bg-primary-hover transition-all"
        >
          + Yeni Hesap
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
