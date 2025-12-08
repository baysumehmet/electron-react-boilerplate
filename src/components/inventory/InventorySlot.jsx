import React from 'react';
import { useDrop } from 'react-dnd';

const ItemTypes = {
  ITEM: 'item',
};

const InventorySlot = ({ slotNumber, username, onDropItem, isActive, isSelected, onClick, children }) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ItemTypes.ITEM,
    drop: (draggedItem) => {
      // Ensure we have a username and the item is not dropped onto its original slot
      if (username && typeof draggedItem.slot !== 'undefined' && draggedItem.slot !== slotNumber) {
        
        // 1. Tell the backend to move the item
        window.api.moveItem({
          username,
          sourceSlot: draggedItem.slot,
          destinationSlot: slotNumber,
        });

        // 2. Call the prop function for optimistic UI updates
        if (onDropItem) {
          onDropItem(draggedItem, slotNumber);
        }
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }), [slotNumber, username, onDropItem]);

  const isDropOver = isOver && canDrop;
  
  let borderColor = 'border-background';
  if (isActive) {
    borderColor = 'border-primary';
  } else if (isSelected) {
    borderColor = 'border-text-secondary';
  }
  
  const backgroundColor = isDropOver ? 'bg-green-500 bg-opacity-40' : 'bg-background bg-opacity-50';

  return (
    <div
      ref={drop}
      onClick={onClick}
      className={`w-16 h-16 border-2 ${borderColor} ${backgroundColor} flex items-center justify-center relative transition-colors duration-150 cursor-pointer`}
      style={{ imageRendering: 'pixelated' }}
    >
      {children}
    </div>
  );
};

export { InventorySlot, ItemTypes };
