import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import MainContent from './components/layout/MainContent';
import AddAccountView from './components/views/AddAccountView';
import ServerSettingsView from './components/views/ServerSettingsView';
import ChestView from './components/views/ChestView';

const DEFAULT_SERVER_INFO = { host: 'xmital123123.aternos.me', port: 64540 };

function App() {
  const [accounts, setAccounts] = useState([]);
  const [serverInfo, setServerInfo] = useState(DEFAULT_SERVER_INFO);
  const [activeAccount, setActiveAccount] = useState(null);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [botsState, setBotsState] = useState({});
  const [view, setView] = useState('dashboard');
  const [chest, setChest] = useState({ isOpen: false, title: '', slots: [] });
  const [scripts, setScripts] = useState({});

  useEffect(() => {
    const loadData = async () => {
      const loadedAccounts = await window.api.loadAccounts();
      const loadedServerInfo = await window.api.loadServerInfo();
      const loadedScripts = await window.api.loadScripts();
      
      setAccounts(loadedAccounts);
      if (loadedServerInfo) setServerInfo(loadedServerInfo);
      setScripts(loadedScripts || {});

      if (loadedAccounts.length > 0) {
        setActiveAccount(loadedAccounts[0].username);
        setView('dashboard');
      } else {
        setView('server-settings');
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const cleanup = window.api.onBotEvent((data) => {
      const { username, type, message } = data;

      // --- Tost Bildirimleri ---
      switch (type) {
        case 'login':
          toast.success(`${username}: ${message}`);
          break;
        case 'spawn':
          toast.info(`${username}: ${message}`);
          break;
        case 'end':
        case 'reconnecting':
          toast.warn(`${username}: ${message}`);
          break;
        case 'error':
        case 'inventory-error':
          toast.error(`${username}: ${message}`);
          break;
        case 'info':
           toast.info(`${username}: ${message}`);
           break;
        case 'goal_reached':
            toast.success(`${username}: ${message}`);
            break;
      }


      // --- Arayüz Durum Güncellemeleri ---
      if (username === activeAccount) {
        if (type === 'chest-open') {
          setChest({ isOpen: true, title: data.data.title, slots: data.data.slots });
        } else if (type === 'chest-close') {
          setChest({ isOpen: false, title: '', slots: [] });
        }
      }

      setBotsState(prev => {
        const newState = { ...prev };
        const botState = newState[username] || { health: 20, food: 20, chat: [], isConnected: false };
        
        switch (type) {
          case 'spawn':
            botState.isConnected = true;
            break;
          case 'end':
            botState.isConnected = false;
            break;
          case 'health':
            botState.health = data.data?.health;
            botState.food = data.data?.food;
            break;
          case 'chat':
             botState.chat = [...botState.chat, data];
             break;
          case 'inventory':
          case 'hotbar-update':
          case 'chest-open':
          case 'chest-close':
            break;
        }
        
        newState[username] = botState;
        return newState;
      });
    });

    return cleanup;
  }, [activeAccount]);

  const handleAccountSelect = (username) => {
    setView('dashboard');
    setActiveAccount(username);
    setChest({ isOpen: false, title: '', slots: [] });
  };
  
  const handleAccountToggle = (username) => {
    setSelectedAccounts(prev => 
      prev.includes(username) 
        ? prev.filter(u => u !== username)
        : [...prev, username]
    );
  };

  const handleExportAccounts = () => {
    if (accounts.length === 0) {
      toast.warn("Dışa aktarılacak hesap bulunmuyor.");
      return;
    }
    const accountsJson = JSON.stringify(accounts, null, 2);
    const blob = new Blob([accountsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'afkplus-accounts.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${accounts.length} hesap dışa aktarıldı.`);
  };

  const handleImportAccounts = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedAccounts = JSON.parse(e.target.result);
        if (Array.isArray(importedAccounts)) {
          // Merge imported accounts with existing ones, overwriting duplicates
          const newAccountsMap = new Map(accounts.map(acc => [acc.username, acc]));
          importedAccounts.forEach(acc => newAccountsMap.set(acc.username, acc));
          const mergedAccounts = Array.from(newAccountsMap.values());

          saveAndSetAccounts(mergedAccounts);
          toast.success(`${importedAccounts.length} hesap başarıyla içe aktarıldı/güncellendi.`);
        } else {
          toast.error("Geçersiz dosya. Hesap listesi bir dizi olmalıdır.");
        }
      } catch (error) {
        toast.error("Hesaplar içe aktarılırken bir hata oluştu: " + error.message);
      }
    };
    reader.onerror = () => {
      toast.error("Dosya okunurken bir hata oluştu.");
    };
    reader.readAsText(file);
    // Reset file input so the same file can be selected again
    event.target.value = null;
  };

  const saveAndSetAccounts = (newAccounts) => { setAccounts(newAccounts); window.api.saveAccounts(newAccounts); };
  const handleAddAccount = (newAccount) => { const newAccounts = [...accounts, { ...newAccount, autoLoginCommands: '', commandDelay: 5, autoReconnect: true }]; saveAndSetAccounts(newAccounts); setView('dashboard'); setActiveAccount(newAccount.username); };
  const handleDeleteAccount = (usernameToDelete) => { 
    const newAccounts = accounts.filter(acc => acc.username !== usernameToDelete);
    const newScripts = { ...scripts };
    delete newScripts[usernameToDelete];
    saveAndSetAccounts(newAccounts); 
    setScripts(newScripts);
    window.api.saveScripts(newScripts);
    if (activeAccount === usernameToDelete) setActiveAccount(newAccounts.length > 0 ? newAccounts[0].username : null); 
  };
  const handleUpdateAccountSettings = (username, newSettings) => { const newAccounts = accounts.map(acc => (acc.username === username) ? { ...acc, ...newSettings } : acc); saveAndSetAccounts(newAccounts);};
  const handleSaveServerInfo = (newServerInfo) => { setServerInfo(newServerInfo); window.api.saveServerInfo(newServerInfo); };
  const handleUpdateScript = (newScript) => {
    if (!activeAccount) return;
    const newScripts = { ...scripts, [activeAccount]: newScript };
    setScripts(newScripts);
    window.api.saveScripts(newScripts);
  };
  
  const handleConnect = (accountsToConnect) => {
    accountsToConnect.forEach(account => {
      if (!account) return;
      // Ensure autoReconnect is enabled, even for older account configurations
      const options = { ...serverInfo, ...account, autoReconnect: account.autoReconnect !== undefined ? account.autoReconnect : true };
      setBotsState(prev => ({...prev, [options.username]: { health: 20, food: 20, chat: [], isConnected: false }}));
      window.api.connectBot(options);
    });
  };

  const handleDisconnect = (usernamesToDisconnect) => {
    usernamesToDisconnect.forEach(username => window.api.disconnectBot(username, true));
  };
  
  const handleConnectSelected = () => {
    const accountsToConnect = accounts.filter(acc => 
      selectedAccounts.includes(acc.username) && !botsState[acc.username]?.isConnected
    );
    if (accountsToConnect.length > 0) {
        handleConnect(accountsToConnect);
    } else {
        toast.info("Seçili hesapların tümü zaten bağlı.");
    }
  };
  
  const handleDisconnectSelected = () => {
    handleDisconnect(selectedAccounts);
  };

  const activeBotCurrentState = botsState[activeAccount] || { health: 20, food: 20, chat: [], isConnected: false };
  const activeAccountDetails = accounts.find(acc => acc.username === activeAccount);
  const activeScript = scripts[activeAccount] || [];

  const renderView = () => {
    if (view === 'add-account') return <AddAccountView accounts={accounts} onAdd={handleAddAccount} onImportAccounts={handleImportAccounts} onExportAccounts={handleExportAccounts} />;
    if (view === 'server-settings') return <ServerSettingsView initialServerInfo={serverInfo} onSave={handleSaveServerInfo} />;
    return (<>
        <Header status={{ ...activeBotCurrentState, username: activeAccountDetails?.username, server: serverInfo.host }} />
        <MainContent 
            key={activeAccount} 
            account={activeAccountDetails} 
            events={activeBotCurrentState.chat} 
            isConnected={activeBotCurrentState.isConnected}
            chest={chest}
            script={activeScript}
            onUpdateScript={handleUpdateScript}
            onConnect={() => handleConnect([activeAccountDetails])} 
            onDisconnect={() => handleDisconnect([activeAccountDetails.username])} 
            onDelete={handleDeleteAccount} 
            onSaveSettings={handleUpdateAccountSettings} 
        />
    </>);
  };

  return (
    <div className="h-screen flex font-mono">
      <ToastContainer position="bottom-right" theme="dark" />
      <Sidebar 
        accounts={accounts}
        botsState={botsState}
        activeAccount={activeAccount}
        selectedAccounts={selectedAccounts}
        onAccountSelect={handleAccountSelect}
        onAccountToggle={handleAccountToggle}
        onAddAccount={() => setView('add-account')} 
        onGoHome={() => setView('server-settings')}
        onConnectSelected={handleConnectSelected}
        onDisconnectSelected={handleDisconnectSelected}
        onImportAccounts={handleImportAccounts}
        onExportAccounts={handleExportAccounts}
      />
      <div className="flex-1 flex flex-col">{renderView()}</div>
    </div>
  );
}

export default App;