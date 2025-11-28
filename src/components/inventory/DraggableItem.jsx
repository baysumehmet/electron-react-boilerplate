import React from 'react';
import { useDrag } from 'react-dnd';
import { ItemTypes } from './InventorySlot';

const getLocalImageUrl = (itemName) => {
  if (!itemName) return null;
  const filename = `minecraft_${itemName}.png`;
  try {
    // Use Vite's `new URL` pattern to correctly handle dynamic local assets
    return new URL(`../../minecraft-images/${filename}`, import.meta.url).href;
  } catch (e) {
    // Return a path to a fallback image if the item image doesn't exist
    return new URL('../../minecraft-images/canUse_unknown.png', import.meta.url).href;
  }
};

const DraggableItem = ({ item }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.ITEM,
    item: { ...item },
  }), [item]);

  const imageUrl = getLocalImageUrl(item.name);

  return (
    <div
      ref={drag}
      className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt={item.name}
          className="w-10 h-10 object-contain"
          style={{ imageRendering: 'pixelated' }}
        />
      )}
      {item.count > 1 && (
        <span className="absolute bottom-1 right-1 text-white text-lg font-bold" style={{ textShadow: '2px 2px #000' }}>
          {item.count}
        </span>
      )}
    </div>
  );
};

export default DraggableItem;
