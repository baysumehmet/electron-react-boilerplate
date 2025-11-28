import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { InventorySlot } from '../inventory/InventorySlot';
import DraggableItem from '../inventory/DraggableItem';

const InventoryView = ({ username }) => {
  const [inventorySlots, setInventorySlots] = useState(Array(46).fill(null));
  const [activeHotbar, setActiveHotbar] = useState(0); // 0-8 index
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    if (!username) return;
    let isMounted = true;
    
    window.api.getInventory(username).then(inv => {
      if (isMounted && inv && inv.slots) {
        setInventorySlots(inv.slots);
      }
    });

    const handleBotEvent = (data) => {
      if (!isMounted || data.username !== username) return;

      if (data.type === 'inventory') {
        setInventorySlots(data.data.slots);
      } else if (data.type === 'inventory-error') {
        console.error(`[Envanter Hatası - ${username}]:`, data.message);
      } else if (data.type === 'hotbar-update') {
        setActiveHotbar(data.data.activeSlot);
      }
    };
    const cleanup = window.api.onBotEvent(handleBotEvent);
    
    return () => {
      isMounted = false;
      if (typeof cleanup === 'function') { cleanup(); }
    };
  }, [username]);

  const handleDropItem = (draggedItem, destinationSlot) => {
    // Optimistic update
    setInventorySlots(currentSlots => {
      const newSlots = [...currentSlots];
      const sourceSlot = draggedItem.slot;
      const sourceItem = newSlots[sourceSlot];
      const destinationItem = newSlots[destinationSlot];
      newSlots[destinationSlot] = { ...sourceItem, slot: destinationSlot };
      newSlots[sourceSlot] = destinationItem ? { ...destinationItem, slot: sourceSlot } : null;
      return newSlots;
    });
  };

  const handleSlotClick = (slotNumber) => {
    // Tıklanan slotu seçili olarak ayarla veya seçimini kaldır
    setSelectedSlot(prev => (prev === slotNumber ? null : slotNumber));
  };

  const handleTossSelected = () => {
    if (selectedSlot !== null) {
      window.api.tossItemStack({ username, sourceSlot: selectedSlot });
      setSelectedSlot(null); // Eşya atıldıktan sonra seçimi kaldır
    }
  };

  const handleClearInventory = () => {
    window.api.clearInventory(username);
    setSelectedSlot(null);
  };
  
  const renderSlot = (slotNumber) => {
    const item = inventorySlots[slotNumber];
    const isHotbar = slotNumber >= 36 && slotNumber <= 44;
    const isActive = isHotbar && (slotNumber === activeHotbar + 36);
    const isSelected = slotNumber === selectedSlot;

    return (
      <InventorySlot
        key={slotNumber}
        slotNumber={slotNumber}
        username={username}
        onDropItem={handleDropItem}
        onClick={() => handleSlotClick(slotNumber)}
        isActive={isActive}
        isSelected={isSelected}
      >
        {item && <DraggableItem item={item} />}
      </InventorySlot>
    );
  };
  
  const renderGrid = (start, end) => {
    const slots = [];
    for (let i = start; i <= end; i++) {
      slots.push(renderSlot(i));
    }
    return slots;
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-4 bg-gray-800 rounded-lg text-white">
        <div className="flex flex-col sm:flex-row gap-8">
          
          {/* Karakter, Zırh ve Offhand Alanı */}
          <div className="flex-shrink-0 flex justify-center items-start gap-4">
            {/* Armor slots */}
            <div className="flex flex-col gap-1 mt-5">
              {renderGrid(5, 8)}
            </div>
            
            <img 
              src={`https://mc-heads.net/body/${username}/128`} 
              alt="Character"
              className="w-32 h-32"
              style={{ imageRendering: 'pixelated' }}
            />

            {/* Offhand slot */}
            <div className="mt-5">
              {renderSlot(45)}
            </div>
          </div>

          <div className="flex-grow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold">Envanter</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => window.api.setActiveHotbar({ username, slot: selectedSlot })}
                  disabled={selectedSlot === null || selectedSlot < 36 || selectedSlot > 44}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Aktif Hotbar Yap
                </button>
                <button 
                  onClick={handleTossSelected} 
                  disabled={selectedSlot === null}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Seçili Eşyayı At
                </button>
                <button 
                  onClick={handleClearInventory} 
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
                >
                  Envanteri Boşalt
                </button>
              </div>
            </div>
            {/* Main Inventory */}
            <div className="grid grid-cols-9 gap-1">
              {renderGrid(9, 35)}
            </div>
            {/* Hotbar */}
            <div className="grid grid-cols-9 gap-1 mt-2 pt-2 border-t-2 border-gray-700">
              {renderGrid(36, 44)}
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default InventoryView;