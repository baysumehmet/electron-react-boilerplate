import React from 'react';

const HealthDisplay = ({ health = 0 }) => {
  const totalHearts = 10;
  const healthValue = Math.round(health * 2) / 2;
  const fullHearts = Math.floor(healthValue / 2);
  const halfHeart = healthValue % 2 >= 1;
  const emptyHearts = totalHearts - fullHearts - (halfHeart ? 1 : 0);
  return (<div className="flex items-center">{Array(fullHearts > 0 ? fullHearts : 0).fill(null).map((_, i) => <span key={`full_${i}`} className="text-red-500">❤️</span>)}{halfHeart && <span key="half" className="text-red-500">💔</span>}{Array(emptyHearts > 0 ? emptyHearts : 0).fill(null).map((_, i) => <span key={`empty_${i}`} className="text-gray-600">🖤</span>)}</div>);
};

const FoodDisplay = ({ food = 0 }) => {
  const totalFood = 10;
  const foodValue = Math.round(food * 2) / 2;
  const fullShanks = Math.floor(foodValue / 2);
  const halfShank = foodValue % 2 >= 1;
  const emptyShanks = totalFood - fullShanks - (halfShank ? 1 : 0);
  return (<div className="flex items-center">{Array(fullShanks > 0 ? fullShanks : 0).fill(null).map((_, i) => <span key={`full_f_${i}`} className="text-yellow-600">🍗</span>)}{halfShank && <span key="half_f" className="text-yellow-600">🦴</span>}{Array(emptyShanks > 0 ? emptyShanks : 0).fill(null).map((_, i) => <span key={`empty_f_${i}`} className="text-gray-600">◽</span>)}</div>);
};

const Header = ({ status, onConnectAll, onDisconnectAll }) => {
  return (
    <header className="bg-gray-700 p-3 shadow-md flex items-center justify-between flex-shrink-0">
      <div>
        <h2 className="text-lg font-semibold">{status.server || 'Sunucu Seçilmedi'}</h2>
        <p className="text-sm text-gray-400">Aktif Hesap: {status.username || 'Yok'}</p>
      </div>
      {status.username && (<div className="flex items-center space-x-4"><HealthDisplay health={status.health} /><FoodDisplay food={status.food} /></div>)}
      <div className="flex space-x-2">
        <button onClick={onConnectAll} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200">Tümünü Başlat</button>
        <button onClick={onDisconnectAll} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200">Tümünü Durdur</button>
      </div>
    </header>
  );
};

export default Header;