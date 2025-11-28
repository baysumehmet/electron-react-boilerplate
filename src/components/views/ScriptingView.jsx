import React, { useState } from 'react';

// Placeholders for now
const AddCommandModal = ({ isOpen, onClose, onAddCommand }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="p-6 bg-gray-800 rounded-lg text-white max-w-sm w-full">
                <h3 className="text-lg font-bold mb-4">Yeni Komut Ekle</h3>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => onAddCommand({ id: Date.now(), type: 'move', params: { x: '', y: '', z: '' } })} className="p-3 bg-blue-600 hover:bg-blue-700 rounded-lg">Taşı (Move)</button>
                    <button onClick={() => onAddCommand({ id: Date.now(), type: 'wait', params: { milliseconds: 1000 } })} className="p-3 bg-purple-600 hover:bg-purple-700 rounded-lg">Bekle (Wait)</button>
                    <button onClick={() => onAddCommand({ id: Date.now(), type: 'say', params: { message: '' } })} className="p-3 bg-green-600 hover:bg-green-700 rounded-lg">Sohbet Et (Say)</button>
                    <button onClick={() => onAddCommand({ id: Date.now(), type: 'break-block', params: { x: '', y: '', z: '' } })} className="p-3 bg-red-600 hover:bg-red-700 rounded-lg">Blok Kır (Break)</button>
                    <button onClick={() => onAddCommand({ id: Date.now(), type: 'open-nearest-chest' })} className="p-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg">En Yakın Sandığı Aç</button>
                    <button onClick={() => onAddCommand({ id: Date.now(), type: 'open-chest-at', params: { x: '', y: '', z: '' } })} className="p-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg">Sandık Aç (Koordinat)</button>
                </div>
                <button onClick={onClose} className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">İptal</button>
            </div>
        </div>
    );
};

const MoveCommand = ({ command, onUpdate, onRemove }) => (
    <div className="p-3 bg-gray-700 rounded-lg flex items-center gap-4">
        <span className="font-bold text-blue-400">Taşı</span>
        <input type="text" value={command.params.x} onChange={e => onUpdate(command.id, { ...command.params, x: e.target.value })} className="bg-gray-800 rounded p-1 w-20 text-center" placeholder="x" />
        <input type="text" value={command.params.y} onChange={e => onUpdate(command.id, { ...command.params, y: e.target.value })} className="bg-gray-800 rounded p-1 w-20 text-center" placeholder="y" />
        <input type="text" value={command.params.z} onChange={e => onUpdate(command.id, { ...command.params, z: e.target.value })} className="bg-gray-800 rounded p-1 w-20 text-center" placeholder="z" />
        <button onClick={() => onRemove(command.id)} className="ml-auto text-red-500 hover:text-red-400 font-bold">X</button>
    </div>
);

const WaitCommand = ({ command, onUpdate, onRemove }) => (
     <div className="p-3 bg-gray-700 rounded-lg flex items-center gap-4">
        <span className="font-bold text-purple-400">Bekle</span>
        <input type="number" min="0" value={command.params.milliseconds} onChange={e => onUpdate(command.id, { ...command.params, milliseconds: parseInt(e.target.value) || 0 })} className="bg-gray-800 rounded p-1 w-24 text-center" />
        <span className="text-gray-400">ms</span>
        <button onClick={() => onRemove(command.id)} className="ml-auto text-red-500 hover:text-red-400 font-bold">X</button>
    </div>
);

const SayCommand = ({ command, onUpdate, onRemove }) => (
    <div className="p-3 bg-gray-700 rounded-lg flex items-center gap-4">
        <span className="font-bold text-green-400">Söyle</span>
        <input type="text" value={command.params.message} onChange={e => onUpdate(command.id, { ...command.params, message: e.target.value })} className="bg-gray-800 rounded p-1 flex-grow" placeholder="Sohbet mesajı..." />
        <button onClick={() => onRemove(command.id)} className="ml-auto text-red-500 hover:text-red-400 font-bold">X</button>
    </div>
);

const BreakBlockCommand = ({ command, onUpdate, onRemove }) => (
    <div className="p-3 bg-gray-700 rounded-lg flex items-center gap-4">
        <span className="font-bold text-red-400">Blok Kır</span>
        <input type="text" value={command.params.x} onChange={e => onUpdate(command.id, { ...command.params, x: e.target.value })} className="bg-gray-800 rounded p-1 w-20 text-center" placeholder="x" />
        <input type="text" value={command.params.y} onChange={e => onUpdate(command.id, { ...command.params, y: e.target.value })} className="bg-gray-800 rounded p-1 w-20 text-center" placeholder="y" />
        <input type="text" value={command.params.z} onChange={e => onUpdate(command.id, { ...command.params, z: e.target.value })} className="bg-gray-800 rounded p-1 w-20 text-center" placeholder="z" />
        <button onClick={() => onRemove(command.id)} className="ml-auto text-red-500 hover:text-red-400 font-bold">X</button>
    </div>
);

const OpenChestAtCommand = ({ command, onUpdate, onRemove }) => (
    <div className="p-3 bg-gray-700 rounded-lg flex items-center gap-4">
        <span className="font-bold text-yellow-400">Sandık Aç</span>
        <input type="text" value={command.params.x} onChange={e => onUpdate(command.id, { ...command.params, x: e.target.value })} className="bg-gray-800 rounded p-1 w-20 text-center" placeholder="x" />
        <input type="text" value={command.params.y} onChange={e => onUpdate(command.id, { ...command.params, y: e.target.value })} className="bg-gray-800 rounded p-1 w-20 text-center" placeholder="y" />
        <input type="text" value={command.params.z} onChange={e => onUpdate(command.id, { ...command.params, z: e.target.value })} className="bg-gray-800 rounded p-1 w-20 text-center" placeholder="z" />
        <button onClick={() => onRemove(command.id)} className="ml-auto text-red-500 hover:text-red-400 font-bold">X</button>
    </div>
);

const OpenNearestChestCommand = ({ onRemove, command }) => (
    <div className="p-3 bg-gray-700 rounded-lg flex items-center gap-4">
        <span className="font-bold text-yellow-400">En Yakın Sandığı Aç</span>
        <button onClick={() => onRemove(command.id)} className="ml-auto text-red-500 hover:text-red-400 font-bold">X</button>
    </div>
);

const ScriptingView = ({ username, script, setScript }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const addCommand = (command) => {
        setScript(prev => [...prev, command]);
        setIsModalOpen(false);
    };

    const updateCommand = (id, newParams) => {
        setScript(prev => prev.map(cmd => (cmd.id === id ? { ...cmd, params: newParams } : cmd)));
    };

    const removeCommand = (id) => {
        setScript(prev => prev.filter(cmd => cmd.id !== id));
    };
    
    const handleExportScript = () => {
        if (script.length === 0) {
            alert("Dışa aktarılacak komut yok.");
            return;
        }
        const scriptJson = JSON.stringify(script, null, 2);
        const blob = new Blob([scriptJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `script-${username}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImportScript = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedScript = JSON.parse(e.target.result);
                setScript(importedScript);
            } catch (error) {
                alert("Geçersiz script dosyası.");
            }
        };
        reader.readAsText(file);
    };

    const handleRunScript = async () => {
        console.log("Çalıştırılan script:", script);
        try {
            for (const command of script) {
                if (command.type === 'move') {
                    const { x, y, z } = command.params;
                    console.log(`Hareket ediliyor: ${x}, ${y}, ${z}`);
                    await window.api.moveTo(username, String(x), String(y), String(z));
                    console.log("Hareket tamamlandı.");
                } else if (command.type === 'wait') {
                    const delay = command.params.milliseconds;
                    if (delay > 0) {
                        console.log(`${delay}ms bekleniyor...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                } else if (command.type === 'say') {
                    window.api.sendChatMessage(username, command.params.message);
                } else if (command.type === 'break-block') {
                    console.log(`Blok kırılıyor: ${command.params.x}, ${command.params.y}, ${command.params.z}`);
                    const { x, y, z } = command.params;
                    await window.api.breakBlock(username, String(x), String(y), String(z));
                } else if (command.type === 'open-nearest-chest') {
                    console.log("En yakın sandık açılıyor...");
                    await window.api.openNearestChest(username);
                } else if (command.type === 'open-chest-at') {
                    const { x, y, z } = command.params;
                    console.log(`Koordinattaki sandık açılıyor: ${x}, ${y}, ${z}`);
                    await window.api.openChestAt(username, String(x), String(y), String(z));
                }
            }
        } catch (error) {
            console.error("Script çalıştırılırken bir hata oluştu:", error);
            // Arayüzde bir bildirim gösterebilirsiniz.
        }
        console.log("Script tamamlandı.");
    };

    const renderCommand = (command) => {
        switch (command.type) {
            case 'move':
                return <MoveCommand key={command.id} command={command} onUpdate={updateCommand} onRemove={removeCommand} />;
            case 'wait':
                return <WaitCommand key={command.id} command={command} onUpdate={updateCommand} onRemove={removeCommand} />;
            case 'say':
                return <SayCommand key={command.id} command={command} onUpdate={updateCommand} onRemove={removeCommand} />;
            case 'break-block':
                return <BreakBlockCommand key={command.id} command={command} onUpdate={updateCommand} onRemove={removeCommand} />;
            case 'open-chest-at':
                return <OpenChestAtCommand key={command.id} command={command} onUpdate={updateCommand} onRemove={removeCommand} />;
            case 'open-nearest-chest':
                return <OpenNearestChestCommand key={command.id} command={command} onRemove={removeCommand} />;
            default:
                return null;
        }
    };

    return (
        <div className="p-4 bg-gray-800 rounded-lg text-white">
            <AddCommandModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddCommand={addCommand} />
            
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Script Editörü</h3>
                <div className="flex gap-2">
                    <button onClick={handleExportScript} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded text-sm">Dışa Aktar</button>
                    <label className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm cursor-pointer">
                        İçe Aktar
                        <input type="file" accept=".json" className="hidden" onChange={handleImportScript} />
                    </label>
                    <button onClick={handleRunScript} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                        Script'i Çalıştır
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                {script.map(renderCommand)}
                 <button onClick={() => setIsModalOpen(true)} className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-2xl font-bold text-gray-400">
                    +
                </button>
            </div>
        </div>
    );
};

export default ScriptingView;
