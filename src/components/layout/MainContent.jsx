import React, { useState, useEffect, useRef } from 'react';
import SettingsView from '../views/SettingsView.jsx';
import InventoryView from '../views/InventoryView.jsx';


// --- CHAT VE ANTI-AFK (Değişiklik yok) ---
const ChatView = ({ events, activeBotUsername }) => {
    const chatEndRef = useRef(null);
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [events]);
    const [chatMessage, setChatMessage] = useState('');
    const handleSend = (e) => { e.preventDefault(); if (!chatMessage.trim() || !activeBotUsername) return; window.api.sendChatMessage(activeBotUsername, chatMessage); setChatMessage(''); };
    return (<div className="h-full flex flex-col"><div className="flex-grow relative"><div className="absolute top-0 left-0 right-0 bottom-0 overflow-y-auto font-mono text-sm pr-2">{events.length > 0 ? events.map((event, index) => {if (event.type === 'chat') return (<div key={index} className="break-words"><span className="text-blue-400">{`<${event.data.sender}>`}</span><span className="text-white ml-2">{event.data.message}</span></div>); return (<div key={index} className="text-gray-400 italic break-words">* {event.message} ({event.username})</div>);}) : <div className="text-gray-500">Bağlantı bekleniyor...</div>}<div ref={chatEndRef} /></div></div><form onSubmit={handleSend} className="mt-2 flex space-x-2 flex-shrink-0"><input type="text" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} className="flex-grow bg-gray-700 rounded p-2 text-white" placeholder="Sohbete mesaj yaz..." disabled={!activeBotUsername} /><button type="submit" className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-4 py-2 rounded" disabled={!activeBotUsername}>Gönder</button></form></div>);
};
const AntiAfkView = ({ activeBotUsername }) => {
    const [isEnabled, setIsEnabled] = useState(false);
    const [interval, setInterval] = useState(5);
    useEffect(() => { if (!activeBotUsername) return; if (isEnabled) { window.api.startAntiAFK(activeBotUsername, interval); } return () => { if (activeBotUsername) window.api.stopAntiAFK(activeBotUsername); }; }, [isEnabled, interval, activeBotUsername]);
    return (<div className="p-4 bg-gray-800 rounded-lg"><h4 className="text-lg font-semibold mb-4">Anti-AFK</h4><div className="flex items-center space-x-4"><label className="flex items-center cursor-pointer"><div className="relative"><input type="checkbox" className="sr-only" checked={isEnabled} onChange={() => setIsEnabled(!isEnabled)} /><div className={`block w-14 h-8 rounded-full ${isEnabled ? 'bg-green-500' : 'bg-gray-600'}`}></div><div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isEnabled ? 'translate-x-6' : ''}`}></div></div><div className="ml-3 text-white font-medium">Aktif</div></label><div className="flex items-center space-x-2"><input type="number" value={interval} min="1" onChange={(e) => setInterval(Number(e.target.value))} className="bg-gray-700 rounded p-2 w-20 text-center" disabled={!isEnabled} /><span>saniye</span></div></div></div>);
};


// --- ANA YAPI ---

const BASE_TABS = ['Sohbet', 'Anti-AFK', 'Ayarlar'];
const CONNECTED_TABS = ['Sohbet', 'Envanter', 'Anti-AFK', 'Ayarlar'];

const MainContent = ({ account, events, isConnected, onConnect, onDisconnect, onDelete, onSaveSettings }) => {
    const TABS = isConnected ? CONNECTED_TABS : BASE_TABS;
    const [activeTab, setActiveTab] = useState(TABS[0]);

    useEffect(() => {
        // Hesap değiştirildiğinde veya bağlantı kesildiğinde sekmeyi sıfırla/ayarla
        if (!isConnected && activeTab === 'Envanter') {
            setActiveTab('Sohbet');
        } else if (TABS.indexOf(activeTab) === -1) {
            setActiveTab(TABS[0]);
        }
    }, [account, isConnected]);

    if (!account) return <main className="flex-1 p-4 flex items-center justify-center text-gray-400">Lütfen soldaki menüden bir hesap seçin veya yeni bir hesap ekleyin.</main>;

    return (
        <main className="flex-1 p-4 flex flex-col overflow-y-hidden">
            <div className="flex-shrink-0 p-4 bg-gray-800 rounded-lg">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-semibold">Hesap: {account.username}</h3>
                        <p className="text-sm text-gray-400">Durum: {isConnected ? <span className="text-green-400">Bağlı</span> : <span className="text-red-400">Bağlı Değil</span>}</p>
                    </div>
                    {isConnected ? (<button onClick={() => onDisconnect(account.username)} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded h-10">Bağlantıyı Kes</button>) : (<button onClick={onConnect} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded h-10">Bağlan</button>)}
                </div>
            </div>
            <div className="flex-shrink-0 mt-4 border-b border-gray-700"><nav className="-mb-px flex space-x-6">
                {TABS.map(tab => {
                    const buttonClasses = `whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === tab ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-300'}`;
                    return <button key={tab} onClick={() => setActiveTab(tab)} className={buttonClasses}>{tab}</button>;
                })}
            </nav></div>
            <div className="mt-4 flex-grow overflow-y-auto">
                {activeTab === 'Sohbet' && <ChatView events={events} activeBotUsername={account.username} />}
                {activeTab === 'Anti-AFK' && <AntiAfkView activeBotUsername={account.username} />}
                {activeTab === 'Ayarlar' && <SettingsView account={account} onSaveSettings={onSaveSettings} onDelete={onDelete} />}
                {activeTab === 'Envanter' && isConnected && <InventoryView username={account.username} />}
            </div>
        </main>
    );
};

export default MainContent;