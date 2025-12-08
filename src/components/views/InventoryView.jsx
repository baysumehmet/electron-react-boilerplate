import React, { useState, useEffect } from 'react';
import { InventorySlot } from '../inventory/InventorySlot';
import DraggableItem from '../inventory/DraggableItem';

const InventoryView = ({ username, chest }) => {
  const [inventorySlots, setInventorySlots] = useState(Array(46).fill(null));
  const [activeHotbar, setActiveHotbar] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const isChestOpen = chest && chest.isOpen;

  useEffect(() => {
    // Only fetch player inventory if no chest is open.
    // If a chest is open, the data comes from the chest prop.
    if (!username || isChestOpen) return;
    
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
  }, [username, isChestOpen]); // Re-run if chest opens/closes

  // When a chest is open, the coordinate system changes.
  // We need to figure out the correct slots from the combined window array.
  const slots = isChestOpen ? chest.slots : inventorySlots;
  const chestSlotCount = isChestOpen ? slots.length - 36 : 0;
  
  // Armor is always separate from the chest window, so we always render from base inventory state
  const armorSlots = inventorySlots.slice(5, 9);

  const handleDropItem = () => {
    // Optimistic updates are disabled. Backend events are the source of truth.
  };

  const handleSlotClick = (slotNumber) => {
    setSelectedSlot(prev => (prev === slotNumber ? null : slotNumber));
  };

  const handleTossSelected = () => {
    if (selectedSlot !== null) {
      window.api.tossItemStack({ username, sourceSlot: selectedSlot });
      setSelectedSlot(null);
    }
  };

  const handleClearInventory = () => {
    window.api.clearInventory(username);
    setSelectedSlot(null);
  };
  
  const renderSlot = (slotNumberInContext) => {
    const item = slots[slotNumberInContext];
    const isHotbar = !isChestOpen && slotNumberInContext >= 36 && slotNumberInContext <= 44;
    const isActiveInPlayerInv = isHotbar && (slotNumberInContext === activeHotbar + 36);
    // When chest is open, hotbar slots are shifted.
    const isActiveInChestview = isChestOpen && (slotNumberInContext === chestSlotCount + 27 + activeHotbar);
    
    const isSelected = slotNumberInContext === selectedSlot;

    return (
      <InventorySlot
        key={slotNumberInContext}
        slotNumber={slotNumberInContext}
        username={username}
        onDropItem={handleDropItem}
        onClick={() => handleSlotClick(slotNumberInContext)}
        isActive={isActiveInPlayerInv || isActiveInChestview}
        isSelected={isSelected}
      >
        {item && <DraggableItem item={item} />}
      </InventorySlot>
    );
  };
  
  const renderGrid = (start, end) => {
    const slotsToRender = [];
    for (let i = start; i <= end; i++) {
      slotsToRender.push(renderSlot(i));
    }
    return slotsToRender;
  };

  return (
      <div className="p-4 bg-transparent rounded-lg text-text-primary">
        <div className="flex flex-col sm:flex-row gap-8">
          
          {/* Karakter, Zırh ve Offhand Alanı */}
          <div className="flex-shrink-0 flex justify-center items-start gap-4">
            {/* Armor slots are always rendered from player inventory state */}
            <div className="flex flex-col gap-1 mt-5">
              {inventorySlots.slice(5, 9).map((item, index) => (
                  <InventorySlot key={5 + index} slotNumber={5 + index} username={username} onDropItem={handleDropItem} onClick={() => handleSlotClick(5 + index)} isSelected={selectedSlot === (5 + index)}>
                      {item && <DraggableItem item={item} />}
                  </InventorySlot>
              ))}
            </div>
            
            <img 
              src={`https://mc-heads.net/body/${username}/128`} 
              alt="Character"
              className="w-32 h-32"
              style={{ imageRendering: 'pixelated' }}
            />

            {/* Offhand slot */}
            <div className="mt-5">
              {/* Also always from player inventory state */}
              <InventorySlot slotNumber={45} username={username} onDropItem={handleDropItem} onClick={() => handleSlotClick(45)} isSelected={selectedSlot === 45}>
                  {inventorySlots[45] && <DraggableItem item={inventorySlots[45]} />}
              </InventorySlot>
            </div>
          </div>

          <div className="flex-grow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold">Envanter</h3>
              <div className="flex gap-2 flex-wrap justify-end">
                <button onClick={() => window.api.openNearestChest(username)} className="bg-primary hover:bg-primary-hover text-white font-bold py-1 px-3 rounded text-sm">En Yakındaki Sandığı Aç</button>
                <button onClick={() => window.api.setActiveHotbar({ username, slot: selectedSlot })} disabled={selectedSlot === null || (isChestOpen ? (selectedSlot < chestSlotCount + 27 || selectedSlot > chestSlotCount + 35) : (selectedSlot < 36 || selectedSlot > 44))} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed">Aktif Hotbar Yap</button>
                <button onClick={handleTossSelected} disabled={selectedSlot === null} className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed">Seçili Eşyayı At</button>
                <button onClick={handleClearInventory} className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm">Envanteri Boşalt</button>
              </div>
            </div>
            {/* Main Inventory */}
            <div className="grid grid-cols-9 gap-1">
              {isChestOpen ? renderGrid(chestSlotCount, chestSlotCount + 26) : renderGrid(9, 35)}
            </div>
            {/* Hotbar */}
            <div className="grid grid-cols-9 gap-1 mt-2 pt-2 border-t-2 border-background">
              {isChestOpen ? renderGrid(chestSlotCount + 27, chestSlotCount + 35) : renderGrid(36, 44)}
            </div>
          </div>
        </div>
      </div>
  );
};

export default InventoryView;