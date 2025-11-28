import React, { useState, useEffect } from 'react';
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
  const [botsState, setBotsState] = useState({});
  const [view, setView] = useState('dashboard');
  const [chest, setChest] = useState({ isOpen: false, title: '', slots: [] });

  useEffect(() => {
    const loadData = async () => {
      const loadedAccounts = await window.api.loadAccounts();
      const loadedServerInfo = await window.api.loadServerInfo();
      setAccounts(loadedAccounts);
      if (loadedServerInfo) setServerInfo(loadedServerInfo);
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
      const { username, type } = data;

      // Only update state if the event is for the active account (for UI-related events)
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
          case 'spawn': botState.isConnected = true; botState.chat = [...botState.chat, data]; break;
          case 'end': botState.isConnected = false; botState.chat = [...botState.chat, data]; break;
          case 'health': botState.health = data.data?.health; botState.food = data.data?.food; break;
          case 'inventory':
          case 'hotbar-update':
          case 'chest-open':
          case 'chest-close':
            break;
          default: botState.chat = [...botState.chat, data]; break;
        }
        newState[username] = botState;
        return newState;
      });
    });
    return cleanup;
  }, [activeAccount]); // Depend on activeAccount to ensure correct context

  const handleAccountSelect = (username) => {
    setView('dashboard');
    setActiveAccount(username);
    // Close chest window when switching accounts
    setChest({ isOpen: false, title: '', slots: [] });
  };

  const saveAndSetAccounts = (newAccounts) => { setAccounts(newAccounts); window.api.saveAccounts(newAccounts); };
  const handleAddAccount = (newAccount) => { const newAccounts = [...accounts, { ...newAccount, autoLoginCommands: '', commandDelay: 5 }]; saveAndSetAccounts(newAccounts); setView('dashboard'); setActiveAccount(newAccount.username); };
  const handleDeleteAccount = (usernameToDelete) => { const newAccounts = accounts.filter(acc => acc.username !== usernameToDelete); saveAndSetAccounts(newAccounts); if (activeAccount === usernameToDelete) setActiveAccount(newAccounts.length > 0 ? newAccounts[0].username : null); };
  const handleUpdateAccountSettings = (username, newSettings) => { const newAccounts = accounts.map(acc => (acc.username === username) ? { ...acc, ...newSettings } : acc); saveAndSetAccounts(newAccounts);};
  const handleSaveServerInfo = (newServerInfo) => { setServerInfo(newServerInfo); window.api.saveServerInfo(newServerInfo); };
  const handleConnect = (account) => { if (!account) return; const options = { ...serverInfo, ...account }; setBotsState(prev => ({...prev, [options.username]: { health: 20, food: 20, chat: [], isConnected: false }})); window.api.connectBot(options); };
  const handleDisconnect = (username) => { window.api.disconnectBot(username); };
  const handleConnectAll = () => { accounts.forEach(acc => handleConnect(acc)); };
  const handleDisconnectAll = () => { accounts.forEach(acc => handleDisconnect(acc.username)); };

  const activeBotCurrentState = botsState[activeAccount] || { health: 20, food: 20, chat: [], isConnected: false };
  const activeAccountDetails = accounts.find(acc => acc.username === activeAccount);

  const renderView = () => {
    if (view === 'add-account') return <AddAccountView onAdd={handleAddAccount} />;
    if (view === 'server-settings') return <ServerSettingsView initialServerInfo={serverInfo} onSave={handleSaveServerInfo} />;
    return (<>
        <Header status={{ ...activeBotCurrentState, username: activeAccountDetails?.username, server: serverInfo.host }} onConnectAll={handleConnectAll} onDisconnectAll={handleDisconnectAll} />
        <MainContent 
            key={activeAccount} 
            account={activeAccountDetails} 
            events={activeBotCurrentState.chat} 
            isConnected={activeBotCurrentState.isConnected}
            chest={chest}
            onConnect={() => handleConnect(activeAccountDetails)} 
            onDisconnect={handleDisconnect} 
            onDelete={handleDeleteAccount} 
            onSaveSettings={handleUpdateAccountSettings} 
        />
    </>);
  };

  return (
    <div className="bg-gray-900 text-white h-screen flex font-sans">
      <Sidebar 
        accounts={accounts} 
        activeAccount={activeAccount} 
        onAccountSelect={handleAccountSelect}
        onAddAccount={() => setView('add-account')} 
        onGoHome={() => setView('server-settings')}
      />
      <div className="flex-1 flex flex-col">{renderView()}</div>
    </div>
  );
}

export default App;