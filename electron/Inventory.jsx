import React, { useState, useEffect } from 'react';

// --- Yardımcı Veri ve Fonksiyonlar ---

// Bot'un versiyonuna göre minecraft-data'yı yükle.
// Bu bilgiyi bot bağlandığında alıp state'te tutabilirsiniz. Şimdilik '1.18.2' varsayalım.
const mcData = require('minecraft-data')('1.18.2');

// Eşya görselleri için temel URL.
const ASSET_BASE_URL = `https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.18.2/items`;

const getItemTextureUrl = (itemId) => {
  if (!mcData || !itemId) return null;
  const itemInfo = mcData.items[itemId];
  if (!itemInfo) return null;
  return `${ASSET_BASE_URL}/${itemInfo.name}.png`;
};

// --- Component'ler ---

/**
 * Tek bir envanter slotunu temsil eden component.
 * @param {{item: object | null, slotNumber: number, isArmorSlot: boolean, onDrop: (item, slot) => void}} props
 */
const InventorySlot = ({ item, slotNumber, isArmorSlot = false }) => {
  // react-dnd için useDrag ve useDrop hook'ları buraya eklenebilir.
  // Şimdilik sadece görsel kısma odaklanıyoruz.

  const textureUrl = item ? getItemTextureUrl(item.type) : null;

  // Zırh slotları için özel placeholder ikonları (isteğe bağlı)
  const armorPlaceholders = {
    5: 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.18.2/gui/container/inventory/empty_armor_slot_helmet.png',
    6: 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.18.2/gui/container/inventory/empty_armor_slot_chestplate.png',
    7: 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.18.2/gui/container/inventory/empty_armor_slot_leggings.png',
    8: 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.18.2/gui/container/inventory/empty_armor_slot_boots.png',
    45: 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.18.2/gui/container/inventory/empty_armor_slot_shield.png',
  };

  return (
    <div className="w-12 h-12 bg-black bg-opacity-50 border-2 border-t-gray-600 border-l-gray-600 border-b-gray-900 border-r-gray-900 flex items-center justify-center relative">
      {item && textureUrl && (
        <>
          <img
            src={textureUrl}
            alt={item.displayName}
            title={`${item.displayName} (Slot: ${slotNumber})`}
            className="w-8 h-8 object-contain"
            style={{ imageRendering: 'pixelated' }} // Minecraft dokularının net görünmesini sağlar
          />
          {item.count > 1 && (
            <span className="absolute bottom-0 right-1 text-white font-bold text-sm" style={{ textShadow: '2px 2px 2px #000' }}>
              {item.count}
            </span>
          )}
        </>
      )}
      {!item && isArmorSlot && (
         <img src={armorPlaceholders[slotNumber]} className="w-8 h-8 object-contain opacity-40" style={{ imageRendering: 'pixelated' }}/>
      )}
    </div>
  );
};

/**
 * Minecraft envanter arayüzünü oluşturan ana component.
 * @param {{username: string}} props
 */
const Inventory = ({ username }) => {
  const [inventorySlots, setInventorySlots] = useState(Array(46).fill(null));

  useEffect(() => {
    if (!username) return;

    // Başlangıçta mevcut envanteri yükle
    window.electron.getInventory(username).then(inv => {
        if (inv && inv.slots) {
            setInventorySlots(inv.slots);
        }
    });

    // Canlı envanter güncellemelerini dinle
    const handleBotEvent = (event, { type, username: eventUsername, data }) => {
      if (type === 'inventory' && eventUsername === username) {
        setInventorySlots(data.slots);
      }
    };

    window.electron.onBotEvent(handleBotEvent);

    return () => {
      window.electron.removeBotEventListener(handleBotEvent);
    };
  }, [username]);

  // Envanteri bölümlere ayır
  const armorSlots = inventorySlots.slice(5, 9); // 4 slot (helmet, chest, legs, boots)
  const offhandSlot = inventorySlots[45];
  
  const mainInventorySlots = inventorySlots.slice(9, 36); // 27 slot (9x3)
  const hotbarSlots = inventorySlots.slice(36, 45); // 9 slot (9x1)

  return (
    <div className="p-4 bg-gray-800 bg-opacity-75 rounded-lg text-white">
      <h3 className="text-lg font-bold mb-4">{username}'s Inventory</h3>
      
      <div className="flex gap-8">
        {/* Sol Taraf: Zırh ve Karakter Modeli */}
        <div className="flex flex-col gap-1">
            {/* Zırh Slotları */}
            {armorSlots.map((item, index) => (
                <InventorySlot key={`armor-${index}`} item={item} slotNumber={5 + index} isArmorSlot={true} />
            ))}
             {/* Offhand Slot */}
             <div className="mt-4">
                <InventorySlot item={offhandSlot} slotNumber={45} isArmorSlot={true} />
             </div>
        </div>

        {/* Sağ Taraf: Ana Envanter ve Hotbar */}
        <div className="flex flex-col">
            {/* Ana Envanter (9x3 grid) */}
            <div className="grid grid-cols-9 gap-1">
                {mainInventorySlots.map((item, index) => (
                    <InventorySlot key={`main-${index}`} item={item} slotNumber={9 + index} />
                ))}
            </div>

            {/* Hotbar (9x1 grid) */}
            <div className="grid grid-cols-9 gap-1 mt-4 pt-4 border-t-2 border-gray-700">
                {hotbarSlots.map((item, index) => (
                    <InventorySlot key={`hotbar-${index}`} item={item} slotNumber={36 + index} />
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Inventory;