import { useEffect, useState } from "react";
import { useGameStore } from "../../lib/stores/useGameStore";
import { useAudio } from "../../lib/stores/useAudio";
import { processCombat } from "../../lib/game/combat";
import { CardType } from "../../lib/game/types";

const GameUI = () => {
  const {
    playerHand,
    enemyHand,
    placedCards,
    playerHealth,
    enemyHealth,
    playerMana,
    enemyMana,
    endPlayerTurn,
    gamePhase,
    round,
    setSelectedCard,
    selectedCard
  } = useGameStore();
  
  const { playHit, playSuccess, toggleMute, isMuted } = useAudio();
  const [showCardDetails, setShowCardDetails] = useState<CardType | null>(null);
  
  // End turn handler
  const handleEndTurn = () => {
    endPlayerTurn();
    playHit();
  };
  
  // Hand card click handler
  const handleCardClick = (card: CardType) => {
    setSelectedCard(selectedCard?.id === card.id ? null : card);
  };
  
  // Determine if end turn button should be disabled
  const isEndTurnDisabled = gamePhase !== "playing";

  // Translate card class name to Turkish
  const translateClass = (className: string) => {
    switch(className) {
      case "warrior": return "Savaşçı";
      case "mage": return "Büyücü";
      case "rogue": return "Haydut";
      default: return className;
    }
  };

  // Translate card rarity to Turkish
  const translateRarity = (rarity: string) => {
    switch(rarity) {
      case "common": return "Sıradan";
      case "rare": return "Nadir";
      case "epic": return "Destansı";
      case "legendary": return "Efsanevi";
      default: return rarity;
    }
  };
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top bar with game info */}
      <div className="absolute top-0 left-0 right-0 bg-black/70 p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="text-white">
            <span className="text-lg font-bold">Tur: {round}</span>
          </div>
          
          {/* Enemy stats */}
          <div className="flex items-center gap-2">
            <div className="bg-red-900 text-white px-3 py-1 rounded-md flex items-center">
              <span className="material-icons mr-1">favorite</span>
              <span>{enemyHealth}</span>
            </div>
            <div className="bg-blue-900 text-white px-3 py-1 rounded-md flex items-center">
              <span className="material-icons mr-1">auto_awesome</span>
              <span>{enemyMana}</span>
            </div>
          </div>
        </div>
        
        {/* Game phase indicator */}
        <div className="bg-purple-900/80 text-white px-4 py-2 rounded-md">
          {gamePhase === "playing" && "Senin Turun"}
          {gamePhase === "enemyTurn" && "Düşman Turu"}
        </div>
        
        {/* Player stats */}
        <div className="flex items-center gap-2">
          <div className="bg-red-900 text-white px-3 py-1 rounded-md flex items-center">
            <span className="material-icons mr-1">favorite</span>
            <span>{playerHealth}</span>
          </div>
          <div className="bg-blue-900 text-white px-3 py-1 rounded-md flex items-center">
            <span className="material-icons mr-1">auto_awesome</span>
            <span>{playerMana}</span>
          </div>
        </div>
      </div>
      
      {/* Sound toggle button */}
      <button 
        className="absolute top-4 right-4 bg-gray-800/80 p-2 rounded-full pointer-events-auto"
        onClick={toggleMute}
      >
        {isMuted ? (
          <i className="text-white text-xl material-icons">volume_off</i>
        ) : (
          <i className="text-white text-xl material-icons">volume_up</i>
        )}
      </button>
      
      {/* Player hand */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex justify-center gap-2 pointer-events-auto">
        {playerHand.map((card, index) => (
          <div
            key={card.id}
            className={`
              bg-gray-800 text-white p-2 rounded-md w-32 h-44 
              transition-all duration-200 border-2 cursor-pointer
              shadow-lg hover:-translate-y-2 
              ${selectedCard?.id === card.id ? 'border-green-500 -translate-y-4' : 'border-gray-700'}
            `}
            onClick={() => handleCardClick(card)}
            onMouseEnter={() => setShowCardDetails(card)}
            onMouseLeave={() => setShowCardDetails(null)}
          >
            <div className="text-center font-bold mb-2 bg-gray-700 py-1 rounded">
              {card.name}
            </div>
            <div className="flex justify-between px-2 my-2">
              <div className="bg-red-700 w-8 h-8 flex items-center justify-center rounded-full">
                {card.attack}
              </div>
              <div className="bg-green-700 w-8 h-8 flex items-center justify-center rounded-full">
                {card.health}
              </div>
            </div>
            <div className="text-xs text-center mt-4 bg-blue-900/80 py-1 rounded">
              {translateClass(card.class)}
            </div>
            <div className="text-xs text-gray-300 mt-1 text-center">
              {translateRarity(card.rarity)}
            </div>
          </div>
        ))}
      </div>
      
      {/* Card details tooltip */}
      {showCardDetails && (
        <div className="absolute bottom-48 left-1/2 transform -translate-x-1/2 bg-black/90 p-4 rounded-lg text-white max-w-sm">
          <h3 className="font-bold text-lg">{showCardDetails.name}</h3>
          <div className="flex justify-between mt-2">
            <div>Saldırı: {showCardDetails.attack}</div>
            <div>Sağlık: {showCardDetails.health}</div>
          </div>
          <div className="mt-2">
            <span className="font-semibold">Sınıf:</span> {translateClass(showCardDetails.class)}
          </div>
          <div className="mt-1">
            <span className="font-semibold">Nadirlik:</span> {translateRarity(showCardDetails.rarity)}
          </div>
          <p className="text-sm mt-2 text-gray-300">
            {showCardDetails.class === "warrior" && "Büyücülere karşı güçlü, haydutlara karşı zayıf."}
            {showCardDetails.class === "mage" && "Haydutlara karşı güçlü, savaşçılara karşı zayıf."}
            {showCardDetails.class === "rogue" && "Savaşçılara karşı güçlü, büyücülere karşı zayıf."}
          </p>
        </div>
      )}
      
      {/* End turn button */}
      <div className="absolute bottom-4 right-4 pointer-events-auto">
        <button
          className={`
            bg-purple-700 text-white px-6 py-3 rounded-lg font-bold
            ${isEndTurnDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-600'}
          `}
          onClick={handleEndTurn}
          disabled={isEndTurnDisabled}
        >
          Turu Bitir
        </button>
      </div>
      
      {/* Game instructions */}
      <div className="absolute top-20 left-4 bg-black/70 p-3 rounded-md text-white text-sm max-w-xs">
        <p>
          <strong>Talimatlar:</strong><br/>
          1. Bir kart seçmek için tıkla<br/>
          2. Tahtadaki bir altıgen karoya gel<br/>
          3. Kartı yerleştirmek için SPACE tuşuna bas<br/>
          4. Hazır olduğunda turunu bitir
        </p>
      </div>
      
      {/* Enemy hand indicator (face down cards) */}
      <div className="absolute top-20 right-4 flex gap-1">
        {Array.from({ length: enemyHand.length }).map((_, index) => (
          <div
            key={`enemy-card-${index}`}
            className="bg-red-900 w-8 h-12 rounded-md border border-red-700"
          />
        ))}
      </div>
    </div>
  );
};

export default GameUI;
