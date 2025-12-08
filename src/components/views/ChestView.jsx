import React from 'react';
import { InventorySlot } from '../inventory/InventorySlot';
import DraggableItem from '../inventory/DraggableItem';

// A simple, non-interactive view for the chest contents
const ChestView = ({ title, slots, username, onClose }) => {
  // Chest window slots include the chest inventory followed by the player inventory.
  // We only want to display the chest's contents.
  let chestSlotCount = slots.length - 36; // 36 is the size of the player's inventory
  if (chestSlotCount < 0) chestSlotCount = 0; // Guard against unexpected slot array sizes

  const chestSlots = slots.slice(0, chestSlotCount);

  const renderGrid = () => {
    return chestSlots.map((item, index) => (
      <InventorySlot
        key={`chest-${index}`}
        slotNumber={index} // This is the slot index within the chest window
        username={username}
        onDropItem={() => {}} // No drop logic for now
        onClick={() => {}} // No click logic for now
      >
        {item && <DraggableItem item={item} />}
      </InventorySlot>
    ));
  };

  return (
    <div className="p-4 bg-surface/75 rounded-lg text-text-primary">
      <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">{title.replace('container.', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
          <div className="flex gap-2">
            <button onClick={() => window.api.withdrawAll(username)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-sm">Hepsini Al</button>
            <button onClick={() => window.api.depositAll(username)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm">Hepsini Bırak</button>
            <button onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm">Kapat</button>
          </div>
      </div>
      <div className={`grid gap-1`} style={{ gridTemplateColumns: 'repeat(9, minmax(0, 1fr))' }}>
        {renderGrid()}
      </div>
    </div>
  );
};

export default ChestView;
