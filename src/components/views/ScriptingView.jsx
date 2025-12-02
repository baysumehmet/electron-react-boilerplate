import React, { useState } from 'react';
import { toast } from 'react-toastify';

const CommandComponent = ({ command, onUpdate, onRemove, executionState, onAddChild, onUpdateChild, onRemoveChild, parentId = null }) => {
    const getCommandUI = () => {
        switch (command.type) {
            case 'move':
                return <MoveCommand command={command} onUpdate={onUpdate} onRemove={onRemove} />;
            case 'wait':
                return <WaitCommand command={command} onUpdate={onUpdate} onRemove={onRemove} />;
            case 'say':
                return <SayCommand command={command} onUpdate={onUpdate} onRemove={onRemove} />;
            case 'break-block':
                return <BreakBlockCommand command={command} onUpdate={onUpdate} onRemove={onRemove} />;
            case 'open-chest-at':
                return <OpenChestAtCommand command={command} onUpdate={onUpdate} onRemove={onRemove} />;
            case 'open-nearest-chest':
                return <OpenNearestChestCommand command={command} onUpdate={onUpdate} onRemove={onRemove} />;
            case 'repeat':
                return <RepeatCommand 
                    command={command} 
                    onUpdate={onUpdate} 
                    onRemove={onRemove}
                    executionState={executionState}
                    onAddChild={onAddChild}
                    onUpdateChild={onUpdateChild}
                    onRemoveChild={onRemoveChild}
                />;
            default:
                return null;
        }
    };
    
    const { isRunning, currentCommandId, completedCommandIds, errorCommandId } = executionState;
    let borderColor = 'border-transparent';

    if (isRunning) {
        if (completedCommandIds.has(command.id)) borderColor = 'border-blue-500'; // Tamamlandı
        else if (currentCommandId === command.id) borderColor = 'border-green-500'; // Çalışıyor
        else borderColor = 'border-gray-600'; // Bekliyor
        if (errorCommandId === command.id) borderColor = 'border-red-500'; // Hata
    }

    return (
        <div className={`border-2 rounded-lg transition-colors duration-300 ${borderColor}`}>
            {getCommandUI()}
        </div>
    );
};


const AddCommandModal = ({ isOpen, onClose, onAddCommand }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="p-6 bg-gray-800 rounded-lg text-white max-w-md w-full">
                <h3 className="text-lg font-bold mb-4">Yeni Komut Ekle</h3>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => onAddCommand({ type: 'move', params: { x: '', y: '', z: '' } })} className="p-3 bg-blue-600 hover:bg-blue-700 rounded-lg">Taşı (Move)</button>
                    <button onClick={() => onAddCommand({ type: 'wait', params: { milliseconds: 1000 } })} className="p-3 bg-purple-600 hover:bg-purple-700 rounded-lg">Bekle (Wait)</button>
                    <button onClick={() => onAddCommand({ type: 'say', params: { message: '' } })} className="p-3 bg-green-600 hover:bg-green-700 rounded-lg">Sohbet Et (Say)</button>
                    <button onClick={() => onAddCommand({ type: 'break-block', params: { x: '', y: '', z: '' } })} className="p-3 bg-red-600 hover:bg-red-700 rounded-lg">Blok Kır (Break)</button>
                    <button onClick={() => onAddCommand({ type: 'open-nearest-chest' })} className="p-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg">En Yakın Sandığı Aç</button>
                    <button onClick={() => onAddCommand({ type: 'open-chest-at', params: { x: '', y: '', z: '' } })} className="p-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg">Sandık Aç (Koordinat)</button>
                    <button onClick={() => onAddCommand({ type: 'repeat', params: { times: 2 }, children: [] })} className="p-3 bg-pink-600 hover:bg-pink-700 rounded-lg col-span-2">Döngü (Repeat)</button>
                </div>
                <button onClick={onClose} className="mt-6 w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">İptal</button>
            </div>
        </div>
    );
};

const MoveCommand = ({ command, onUpdate, onRemove }) => (
    <div className="p-3 bg-gray-700/50 rounded-lg flex items-center gap-4">
        <span className="font-bold text-blue-400">Taşı</span>
        <input type="text" value={command.params.x} onChange={e => onUpdate(command.id, { ...command, params: { ...command.params, x: e.target.value }})} className="bg-gray-800 rounded p-1 w-20 text-center" placeholder="x" />
        <input type="text" value={command.params.y} onChange={e => onUpdate(command.id, { ...command, params: { ...command.params, y: e.target.value }})} className="bg-gray-800 rounded p-1 w-20 text-center" placeholder="y" />
        <input type="text" value={command.params.z} onChange={e => onUpdate(command.id, { ...command, params: { ...command.params, z: e.target.value }})} className="bg-gray-800 rounded p-1 w-20 text-center" placeholder="z" />
        <button onClick={() => onRemove(command.id)} className="ml-auto text-red-500 hover:text-red-400 font-bold">X</button>
    </div>
);

const WaitCommand = ({ command, onUpdate, onRemove }) => (
     <div className="p-3 bg-gray-700/50 rounded-lg flex items-center gap-4">
        <span className="font-bold text-purple-400">Bekle</span>
        <input type="number" min="0" value={command.params.milliseconds} onChange={e => onUpdate(command.id, { ...command, params: { ...command.params, milliseconds: parseInt(e.target.value) || 0 }})} className="bg-gray-800 rounded p-1 w-24 text-center" />
        <span className="text-gray-400">ms</span>
        <button onClick={() => onRemove(command.id)} className="ml-auto text-red-500 hover:text-red-400 font-bold">X</button>
    </div>
);

const SayCommand = ({ command, onUpdate, onRemove }) => (
    <div className="p-3 bg-gray-700/50 rounded-lg flex items-center gap-4">
        <span className="font-bold text-green-400">Söyle</span>
        <input type="text" value={command.params.message} onChange={e => onUpdate(command.id, { ...command, params: { ...command.params, message: e.target.value }})} className="bg-gray-800 rounded p-1 flex-grow" placeholder="Sohbet mesajı..." />
        <button onClick={() => onRemove(command.id)} className="ml-auto text-red-500 hover:text-red-400 font-bold">X</button>
    </div>
);

const BreakBlockCommand = ({ command, onUpdate, onRemove }) => (
    <div className="p-3 bg-gray-700/50 rounded-lg flex items-center gap-4">
        <span className="font-bold text-red-400">Blok Kır</span>
        <input type="text" value={command.params.x} onChange={e => onUpdate(command.id, { ...command, params: { ...command.params, x: e.target.value }})} className="bg-gray-800 rounded p-1 w-20 text-center" placeholder="x" />
        <input type="text" value={command.params.y} onChange={e => onUpdate(command.id, { ...command, params: { ...command.params, y: e.target.value }})} className="bg-gray-800 rounded p-1 w-20 text-center" placeholder="y" />
        <input type="text" value={command.params.z} onChange={e => onUpdate(command.id, { ...command, params: { ...command.params, z: e.target.value }})} className="bg-gray-800 rounded p-1 w-20 text-center" placeholder="z" />
        <button onClick={() => onRemove(command.id)} className="ml-auto text-red-500 hover:text-red-400 font-bold">X</button>
    </div>
);

const OpenChestAtCommand = ({ command, onUpdate, onRemove }) => (
    <div className="p-3 bg-gray-700/50 rounded-lg flex items-center gap-4">
        <span className="font-bold text-yellow-400">Sandık Aç</span>
        <input type="text" value={command.params.x} onChange={e => onUpdate(command.id, { ...command, params: { ...command.params, x: e.target.value }})} className="bg-gray-800 rounded p-1 w-20 text-center" placeholder="x" />
        <input type="text" value={command.params.y} onChange={e => onUpdate(command.id, { ...command, params: { ...command.params, y: e.target.value }})} className="bg-gray-800 rounded p-1 w-20 text-center" placeholder="y" />
        <input type="text" value={command.params.z} onChange={e => onUpdate(command.id, { ...command, params: { ...command.params, z: e.target.value }})} className="bg-gray-800 rounded p-1 w-20 text-center" placeholder="z" />
        <button onClick={() => onRemove(command.id)} className="ml-auto text-red-500 hover:text-red-400 font-bold">X</button>
    </div>
);

const OpenNearestChestCommand = ({ onRemove, command }) => (
    <div className="p-3 bg-gray-700/50 rounded-lg flex items-center gap-4">
        <span className="font-bold text-yellow-400">En Yakın Sandığı Aç</span>
        <button onClick={() => onRemove(command.id)} className="ml-auto text-red-500 hover:text-red-400 font-bold">X</button>
    </div>
);

const RepeatCommand = ({ command, onUpdate, onRemove, executionState, onAddChild, onUpdateChild, onRemoveChild }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="p-3 bg-gray-700/50 rounded-lg">
            <AddCommandModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddCommand={(newCmd) => onAddChild(command.id, newCmd)} />
            <div className="flex items-center gap-4 mb-3">
                <span className="font-bold text-pink-400">Döngü</span>
                <input type="number" min="1" value={command.params.times} onChange={e => onUpdate(command.id, { ...command, params: { ...command.params, times: parseInt(e.target.value) || 1 }})} className="bg-gray-800 rounded p-1 w-20 text-center" />
                <span className="text-gray-400">kez tekrarla</span>
                <button onClick={() => onRemove(command.id)} className="ml-auto text-red-500 hover:text-red-400 font-bold">X</button>
            </div>
            <div className="pl-6 border-l-2 border-pink-400/30 space-y-2">
                {command.children && command.children.map(child => 
                     <CommandComponent 
                        key={child.id} 
                        command={child}
                        executionState={executionState}
                        onUpdate={(childId, newChildData) => onUpdateChild(command.id, childId, newChildData)}
                        onRemove={(childId) => onRemoveChild(command.id, childId)}
                        onAddChild={onAddChild}
                        onUpdateChild={onUpdateChild}
                        onRemoveChild={onRemoveChild}
                    />
                )}
                <button onClick={() => setIsModalOpen(true)} className="w-full p-2 bg-gray-600/50 hover:bg-gray-600 rounded-lg text-lg font-bold text-gray-400">+</button>
            </div>
        </div>
    );
};

// --- Recursive script modification helpers ---
const recursiveUpdate = (commands, id, newCommandData) => {
    return commands.map(cmd => {
        if (cmd.id === id) return newCommandData;
        if (cmd.children) {
            return { ...cmd, children: recursiveUpdate(cmd.children, id, newCommandData) };
        }
        return cmd;
    });
};

const recursiveRemove = (commands, id) => {
    return commands.filter(cmd => cmd.id !== id).map(cmd => {
        if (cmd.children) {
            return { ...cmd, children: recursiveRemove(cmd.children, id) };
        }
        return cmd;
    });
};

const recursiveAddChild = (commands, parentId, newChildData) => {
     return commands.map(cmd => {
        if (cmd.id === parentId) {
            const newChild = { ...newChildData, id: Date.now() };
            return { ...cmd, children: [...(cmd.children || []), newChild] };
        }
        if (cmd.children) {
            return { ...cmd, children: recursiveAddChild(cmd.children, parentId, newChildData) };
        }
        return cmd;
    });
};

const ScriptingView = ({ username, script, setScript }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [executionState, setExecutionState] = useState({ isRunning: false, currentCommandId: null, completedCommandIds: new Set(), errorCommandId: null });

    // Defensively ensure `script` is an array to prevent crashes.
    const safeScript = Array.isArray(script) ? script : [];

    const addCommand = (command) => {
        const newCommand = { ...command, id: Date.now() };
        setScript([...safeScript, newCommand]);
        setIsModalOpen(false);
    };

    const updateCommand = (id, newCommandData) => {
        setScript(recursiveUpdate(safeScript, id, newCommandData));
    };

    const removeCommand = (id) => {
        setScript(recursiveRemove(safeScript, id));
    };

    const addChildCommand = (parentId, newChildData) => {
        setScript(recursiveAddChild(safeScript, parentId, newChildData));
    };
    
    const findCommand = (commands, id) => {
        for (const cmd of commands) {
            if (cmd.id === id) return cmd;
            if (cmd.children) {
                const found = findCommand(cmd.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    const updateChildCommand = (parentId, childId, newChildData) => {
        const newScript = JSON.parse(JSON.stringify(safeScript)); // Deep copy
        const parent = findCommand(newScript, parentId);
        if (parent && parent.children) {
            const childIndex = parent.children.findIndex(c => c.id === childId);
            if (childIndex > -1) {
                parent.children[childIndex] = newChildData;
                setScript(newScript);
            }
        }
    };

    const removeChildCommand = (parentId, childId) => {
        const newScript = JSON.parse(JSON.stringify(safeScript)); // Deep copy
        const parent = findCommand(newScript, parentId);
        if (parent && parent.children) {
            parent.children = parent.children.filter(c => c.id !== childId);
            setScript(newScript);
        }
    };
    
    const handleExportScript = () => {
        if (!safeScript || safeScript.length === 0) {
            toast.warn("Dışa aktarılacak komut yok.");
            return;
        }
        const scriptJson = JSON.stringify(safeScript, null, 2);
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
                if (Array.isArray(importedScript)) {
                    setScript(importedScript);
                } else {
                   toast.error("Geçersiz script dosyası. Script bir dizi olmalı.");
                }
            } catch (error) {
                toast.error("Script içe aktarılırken hata: " + error.message);
            }
        };
        reader.readAsText(file);
        event.target.value = null; // Reset file input
    };

    const executeCommands = async (commandsToExecute) => {
        if (!Array.isArray(commandsToExecute)) return;

        for (const command of commandsToExecute) {
            if (executionState.errorCommandId) throw new Error("Script durduruldu.");

            setExecutionState(prev => ({ ...prev, currentCommandId: command.id }));

            if (command.type === 'repeat') {
                for (let i = 0; i < command.params.times; i++) {
                    await executeCommands(command.children || []);
                    if (executionState.errorCommandId) throw new Error("Script durduruldu.");
                }
            } else if (command.type === 'move') {
                await window.api.moveTo(username, String(command.params.x), String(command.params.y), String(command.params.z));
            } else if (command.type === 'wait') {
                await new Promise(resolve => setTimeout(resolve, command.params.milliseconds));
            } else if (command.type === 'say') {
                window.api.sendChatMessage(username, command.params.message);
            } else if (command.type === 'break-block') {
                await window.api.breakBlock(username, String(command.params.x), String(command.params.y), String(command.params.z));
            } else if (command.type === 'open-nearest-chest') {
                await window.api.openNearestChest(username);
            } else if (command.type === 'open-chest-at') {
                await window.api.openChestAt(username, String(command.params.x), String(command.params.y), String(command.params.z));
            }
            
            setExecutionState(prev => ({ ...prev, completedCommandIds: new Set(prev.completedCommandIds).add(command.id) }));
        }
    };

    const handleRunScript = async () => {
        const initialExecutionState = { isRunning: true, currentCommandId: null, completedCommandIds: new Set(), errorCommandId: null };
        setExecutionState(initialExecutionState);
        
        try {
            await executeCommands(safeScript);
        } catch (error) {
            console.error("Script hatası:", error);
            setExecutionState(prev => ({ ...prev, errorCommandId: prev.currentCommandId, isRunning: false }));
        } finally {
            // isRunning'i sadece hata durumunda false yap, başarılı durumda bir süre sonra resetle
            if (!executionState.errorCommandId) {
                 setTimeout(() => setExecutionState({ isRunning: false, currentCommandId: null, completedCommandIds: new Set(), errorCommandId: null }), 2000);
            } else {
                 setExecutionState(prev => ({ ...prev, isRunning: false }));
            }
        }
    };

    return (
        <div className="p-4 bg-gray-800/80 rounded-lg text-white border border-gray-700/50">
            <AddCommandModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddCommand={addCommand} />
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Script Editörü</h3>
                <div className="flex gap-2">
                    <button onClick={handleExportScript} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded text-sm">Dışa Aktar</button>
                    <label className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm cursor-pointer">
                        İçe Aktar <input type="file" accept=".json" className="hidden" onChange={handleImportScript} />
                    </label>
                    <button onClick={handleRunScript} disabled={executionState.isRunning} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500 disabled:cursor-not-allowed">
                        {executionState.isRunning ? 'Çalışıyor...' : "Script'i Çalıştır"}
                    </button>
                </div>
            </div>
            <div className="space-y-3">
                {safeScript.map(cmd => 
                    <CommandComponent 
                        key={cmd.id} 
                        command={cmd}
                        executionState={executionState}
                        onUpdate={updateCommand}
                        onRemove={removeCommand}
                        onAddChild={addChildCommand}
                        onUpdateChild={updateChildCommand}
                        onRemoveChild={removeChildCommand}
                    />
                )}
                 <button onClick={() => setIsModalOpen(true)} className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-2xl font-bold text-gray-400 transition-colors">
                    +
                </button>
            </div>
        </div>
    );
};

export default ScriptingView;