import React, { useState, useEffect, useRef } from 'react';
import SettingsView from '../views/SettingsView.jsx';
import InventoryView from '../views/InventoryView.jsx';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ChestView from '../views/ChestView.jsx';
import ScriptingView from '../views/ScriptingView.jsx';


// --- CHAT VE ANTI-AFK (Değişiklik yok) ---
const ChatView = ({ events, activeBotUsername }) => {
    const chatEndRef = useRef(null);
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [events]);
    const [chatMessage, setChatMessage] = useState('');
    const handleSend = (e) => { e.preventDefault(); if (!chatMessage.trim() || !activeBotUsername) return; window.api.sendChatMessage(activeBotUsername, chatMessage); setChatMessage(''); };
    
    return (
        <div className="h-full flex flex-col">
            <div className="flex-grow relative bg-background rounded-t-lg p-4">
                <div className="absolute top-0 left-0 right-0 bottom-0 overflow-y-auto font-mono text-sm p-4">
                    {events.length > 0 ? events.map((event, index) => {
                        if (event.type === 'chat') return (<div key={index} className="break-words mb-2"><span className="text-blue-400 font-semibold">{`<${event.data.sender}>`}</span><span className="text-text-primary ml-2">{event.data.message}</span></div>);
                        return (<div key={index} className="text-text-secondary italic break-words mb-1 text-xs">* {event.message} ({event.username})</div>);
                    }) : <div className="text-text-secondary">Bağlantı bekleniyor...</div>}
                    <div ref={chatEndRef} />
                </div>
            </div>
            <form onSubmit={handleSend} className="mt-2 flex space-x-2 flex-shrink-0 bg-transparent p-4">
                <input type="text" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} className="flex-grow bg-background rounded-md p-3 text-text-primary border-2 border-surface focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition" placeholder="Sohbete mesaj yaz..." disabled={!activeBotUsername} />
                <button type="submit" className="bg-primary hover:bg-primary-hover text-white font-bold px-6 py-3 rounded-md transition-all" disabled={!activeBotUsername}>Gönder</button>
            </form>
        </div>
    );
};

const AntiAfkView = ({ activeBotUsername }) => {
    const [isEnabled, setIsEnabled] = useState(false);
    const [interval, setInterval] = useState(5);
    useEffect(() => { if (!activeBotUsername) return; if (isEnabled) { window.api.startAntiAFK(activeBotUsername, interval); } return () => { if (activeBotUsername) window.api.stopAntiAFK(activeBotUsername); }; }, [isEnabled, interval, activeBotUsername]);
    
    return (
        <div className="p-6 bg-background rounded-lg max-w-md mx-auto">
            <h4 className="text-xl font-bold mb-6 text-text-primary text-center">Anti-AFK</h4>
            <div className="flex flex-col items-center space-y-6">
                <label className="flex items-center cursor-pointer">
                    <div className="relative">
                        <input type="checkbox" className="sr-only" checked={isEnabled} onChange={() => setIsEnabled(!isEnabled)} />
                        <div className={`block w-16 h-9 rounded-full transition-all ${isEnabled ? 'bg-green-500' : 'bg-surface'}`}></div>
                        <div className={`dot absolute left-1.5 top-1.5 bg-text-primary w-6 h-6 rounded-full transition-transform ${isEnabled ? 'translate-x-7' : ''}`}></div>
                    </div>
                    <div className="ml-4 text-lg text-text-primary font-medium">Anti-AFK Aktif</div>
                </label>
                <div className={`flex items-center space-x-4 transition-opacity duration-300 ${isEnabled ? 'opacity-100' : 'opacity-50'}`}>
                    <input 
                        type="number" 
                        value={interval} 
                        min="1" 
                        onChange={(e) => setInterval(Number(e.target.value))} 
                        className="bg-background rounded-md p-3 w-28 text-center text-text-primary text-lg font-semibold border-2 border-surface focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition" 
                        disabled={!isEnabled} 
                    />
                    <span className="text-lg text-text-secondary">saniyede bir hareket et</span>
                </div>
            </div>
        </div>
    );
};


// --- ANA YAPI ---

const BASE_TABS = ['Sohbet', 'Anti-AFK', 'Ayarlar'];
const CONNECTED_TABS = ['Sohbet', 'Envanter', 'Scripting', 'Anti-AFK', 'Ayarlar'];

const MainContent = ({ account, events, isConnected, chest, script, onUpdateScript, onConnect, onDisconnect, onDelete, onSaveSettings }) => {
    const TABS = isConnected ? CONNECTED_TABS : BASE_TABS;
    const [activeTab, setActiveTab] = useState(TABS[0]);

    useEffect(() => {
        // Hesap değiştirildiğinde veya bağlantı kesildiğinde sekmeyi sıfırla/ayarla
        if (!isConnected && (activeTab === 'Envanter' || activeTab === 'Scripting')) {
            setActiveTab('Sohbet');
        } else if (TABS.indexOf(activeTab) === -1) {
            setActiveTab(TABS[0]);
        }
    }, [account, isConnected]);

    if (!account) return <main className="flex-1 p-4 flex items-center justify-center text-text-secondary">Lütfen soldaki menüden bir hesap seçin veya yeni bir hesap ekleyin.</main>;

    const isInventoryTab = activeTab === 'Envanter' && isConnected;

    return (
        <main className="flex-1 p-6 flex flex-col overflow-y-hidden">
            {/* KULLANICI KARTI VE BAĞLANTI BUTONLARI */}
            <div className="flex-shrink-0 p-5 bg-surface rounded-xl shadow-2xl border border-background">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-x-5">
                         <img 
                            src={`https://mc-heads.net/avatar/${account.username}/64`} 
                            alt={account.username} 
                            className="w-16 h-16 rounded-lg shadow-md border-2 border-background"
                        />
                        <div>
                            <p className="text-sm text-text-secondary">Aktif Hesap</p>
                            <h3 className="text-3xl font-bold text-text-primary tracking-wide">{account.username}</h3>
                            <p className={`mt-1 text-sm font-semibold flex items-center gap-x-1.5 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                                <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                {isConnected ? 'Bağlı' : 'Bağlı Değil'}
                            </p>
                        </div>
                    </div>
                    {isConnected 
                        ? (<button onClick={() => onDisconnect([account.username])} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg h-12 transition-all shadow-md transform hover:scale-105">Bağlantıyı Kes</button>) 
                        : (<button onClick={onConnect} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg h-12 transition-all shadow-md transform hover:scale-105">Bağlan</button>)
                    }
                </div>
            </div>
            
            {/* TAB NAVİGASYONU */}
            <div className="flex-shrink-0 mt-6 border-b-2 border-background">
                <nav className="-mb-px flex space-x-2">
                    {TABS.map(tab => (
                        <button 
                            key={tab} 
                            onClick={() => setActiveTab(tab)} 
                            className={`whitespace-nowrap py-3 px-5 font-semibold text-sm rounded-t-lg transition-colors duration-200 focus:outline-none ${
                                activeTab === tab 
                                    ? 'bg-surface border-b-4 border-primary text-text-primary' 
                                    : 'border-b-4 border-transparent text-text-secondary hover:text-text-primary hover:bg-surface/50'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>
            
            {/* TAB İÇERİĞİ */}
            <div className="mt-0 flex-grow overflow-y-auto bg-surface rounded-b-lg rounded-tr-lg border-x border-b border-background p-6">
                {activeTab === 'Sohbet' && <ChatView events={events} activeBotUsername={account.username} />}
                {activeTab === 'Anti-AFK' && <AntiAfkView activeBotUsername={account.username} />}
                {activeTab === 'Ayarlar' && <SettingsView account={account} onSaveSettings={onSaveSettings} onDelete={onDelete} />}
                {activeTab === 'Scripting' && isConnected && <ScriptingView username={account.username} script={script} setScript={onUpdateScript} />}
                {isInventoryTab && (
                    <DndProvider backend={HTML5Backend}>
                        <InventoryView username={account.username} chest={chest} />
                        {chest.isOpen && (
                            <div className="mt-4">
                                <ChestView title={chest.title} slots={chest.slots} username={account.username} onClose={() => window.api.closeWindow(account.username)} />
                            </div>
                        )}
                    </DndProvider>
                )}
            </div>
        </main>
    );
};

export default MainContent;