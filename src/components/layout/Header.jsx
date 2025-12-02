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

const Header = ({ status }) => {
  return (
    <header className="bg-gray-800 p-4 shadow-lg flex items-center justify-between flex-shrink-0 border-b border-gray-700">
      <div className="flex items-center">
        <div className="mr-4">
          <p className="text-sm text-gray-400">Sunucu</p>
          <h2 className="text-lg font-bold text-white">{status.server || 'N/A'}</h2>
        </div>
        <div>
          <p className="text-sm text-gray-400">Aktif Hesap</p>
          <h2 className="text-lg font-bold text-white">{status.username || 'Yok'}</h2>
        </div>
      </div>
      
      {/* Aktif Botun Can ve Açlık Durumu */}
      {status.isConnected && (
        <div className="flex items-center gap-x-6">
          <div>
            <p className="text-sm text-gray-400 text-center mb-1">Can</p>
            <HealthDisplay health={status.health} />
          </div>
          <div>
            <p className="text-sm text-gray-400 text-center mb-1">Açlık</p>
            <FoodDisplay food={status.food} />
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;