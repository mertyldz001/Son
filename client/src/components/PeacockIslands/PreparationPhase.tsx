import { useEffect, useState } from "react";
import { usePeacockIslandsStore } from "../../lib/stores/usePeacockIslandsStore";
import { useAudio } from "../../lib/stores/useAudio";
import { FeatherColor, HatcherySlot, Egg } from "../../lib/game/peacockIslands/types";
import { getFeatherColorName, getBonusTypeName } from "../../lib/game/peacockIslands/battle";
import GameBoard3D from "./GameBoard3D";

const PreparationPhase = () => {
  const { 
    player, 
    npc, 
    currentTurn, 
    preparationTimeLeft, 
    updatePreparationTime, 
    collectFeathers, 
    trainSoldiers, 
    performNpcActions,
    combineFeathers,
    hatchEgg,
    activateEgg
  } = usePeacockIslandsStore();
  const { playClick, playCollect, playBuild } = useAudio();
  
  const [lastTime, setLastTime] = useState(Date.now());
  const [buildingSelected, setBuildingSelected] = useState<string | null>(null);
  const [featherColorSelected, setFeatherColorSelected] = useState<FeatherColor | null>(null);
  const [selectedHatcherySlot, setSelectedHatcherySlot] = useState<HatcherySlot | null>(null);
  const [actionLog, setActionLog] = useState<string[]>([]);
  
  // Hazırlık zamanını güncelle
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTime) / 1000; // saniye cinsinden geçen süre
      
      updatePreparationTime(delta);
      setLastTime(now);
      
      // Her 5 saniyede bir NPC aksiyon yapsın
      if (Math.floor(preparationTimeLeft) % 5 === 0) {
        performNpcActions();
      }
    }, 500);
    
    return () => {
      clearInterval(timer);
    };
  }, [preparationTimeLeft, lastTime, updatePreparationTime, performNpcActions]);
  
  const handleCollectFeathers = (color?: FeatherColor) => {
    playCollect();
    collectFeathers(player.id, 1, color);
    
    const colorName = color ? getFeatherColorName(color) : "rastgele renkli";
    setActionLog(prev => [...prev, `1 ${colorName} tüy toplandı!`]);
  };
  
  const handleTrainSoldiers = (amount: number) => {
    playBuild();
    trainSoldiers(player.id, amount);
    setActionLog(prev => [...prev, `${amount} asker eğitildi!`]);
  };
  
  const handleCombineFeathers = (color: FeatherColor) => {
    if (player.island.featherInventory[color] >= 3) {
      playBuild();
      combineFeathers(player.id, color, 1);
      setActionLog(prev => [
        ...prev, 
        `3 ${getFeatherColorName(color)} tüy birleştirildi ve 1 yumurta elde edildi!`
      ]);
    } else {
      setActionLog(prev => [
        ...prev, 
        `Yeterli ${getFeatherColorName(color)} tüy yok (en az 3 gerekli).`
      ]);
    }
  };
  
  const handleHatchEgg = (color: FeatherColor) => {
    if (player.island.resources.eggs > 0) {
      playBuild();
      hatchEgg(player.id, color);
      
      // Bonus tipini bul
      let bonusType = "";
      switch (color) {
        case "green": bonusType = "health"; break;
        case "blue": bonusType = "attackSpeed"; break;
        case "orange": bonusType = "attackPower"; break;
      }
      
      setActionLog(prev => [
        ...prev, 
        `Bir yumurta kuluçkaya kondu (${getBonusTypeName(bonusType)} bonusu).`
      ]);
    } else {
      setActionLog(prev => [...prev, "Hiç yumurtanız yok."]);
    }
  };
  
  const handleActivateEgg = (slotId: string) => {
    playBuild();
    activateEgg(player.id, slotId);
    setActionLog(prev => [...prev, "Kuluçka yuvasındaki bonus aktifleştirildi!"]);
  };
  
  return (
    <div className="w-full h-full relative">
      {/* 3D Game Board as background */}
      <GameBoard3D />
      
      {/* UI Overlays */}
      <div className="absolute inset-0 z-10 p-4 pointer-events-none">
        {/* Üst panel - Tur bilgileri */}
        <div className="bg-gray-800/90 p-4 rounded-lg mb-4 flex justify-between items-center pointer-events-auto">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-white">Hazırlık Fazı</h2>
            <p className="text-sm text-gray-300">Kaynaklarınızı yönetin ve adanızı geliştirin</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-blue-900/90 px-4 py-2 rounded-md text-white flex items-center">
              <span className="material-icons mr-2">timer</span>
              <span className="font-bold">{Math.floor(preparationTimeLeft)}</span>
            </div>
            
            <div className="bg-purple-900/90 px-4 py-2 rounded-md text-white flex items-center">
              <span className="material-icons mr-2">emoji_events</span>
              <span className="font-bold">Tur {currentTurn}</span>
            </div>
          </div>
        </div>
        
        {/* Ana içerik */}
        <div className="flex gap-4 h-3/4 pointer-events-auto">
          {/* Sol panel - Oyuncu bilgileri */}
          <div className="w-1/4 bg-gray-800/90 rounded-lg p-4 flex flex-col text-white">
            <h3 className="text-lg font-bold mb-2">{player.island.name}</h3>
            
            <div className="bg-gray-700/90 rounded-md p-3 mb-4">
              <h4 className="text-md font-semibold mb-2">Kaynaklar</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-yellow-900/60 p-2 rounded text-center">
                  <div className="text-yellow-400 font-bold">{player.island.resources.gold}</div>
                  <div className="text-xs">Altın</div>
                </div>
                <div className="bg-green-900/60 p-2 rounded text-center">
                  <div className="text-green-400 font-bold">{player.island.resources.eggs}</div>
                  <div className="text-xs">Yumurta</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-700/90 rounded-md p-3 mb-4">
              <h4 className="text-md font-semibold mb-2">Tüy Envanteri</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-green-900/60 p-2 rounded text-center">
                  <div className="text-green-400 font-bold">{player.island.featherInventory.green}</div>
                  <div className="text-xs">Yeşil</div>
                </div>
                <div className="bg-blue-900/60 p-2 rounded text-center">
                  <div className="text-blue-400 font-bold">{player.island.featherInventory.blue}</div>
                  <div className="text-xs">Mavi</div>
                </div>
                <div className="bg-orange-900/60 p-2 rounded text-center">
                  <div className="text-orange-400 font-bold">{player.island.featherInventory.orange}</div>
                  <div className="text-xs">Turuncu</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-700/90 rounded-md p-3 mb-4">
              <h4 className="text-md font-semibold mb-2">Ordu</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-red-900/60 p-2 rounded text-center">
                  <div className="text-red-400 font-bold">{player.island.army.soldiers}</div>
                  <div className="text-xs">Asker</div>
                </div>
                <div className="bg-purple-900/60 p-2 rounded text-center">
                  <div className="text-purple-400 font-bold">
                    {player.island.army.attackPower + player.island.army.bonuses.attackPower}
                  </div>
                  <div className="text-xs">Saldırı</div>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="text-md font-semibold mb-2">Aktiviteler</h4>
              <button 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full mb-2 flex items-center justify-center"
                onClick={() => handleCollectFeathers()}
              >
                <span className="material-icons mr-2">eco</span>
                Tüy Topla
              </button>
              
              <button 
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded w-full mb-2 flex items-center justify-center"
                onClick={() => handleTrainSoldiers(1)}
              >
                <span className="material-icons mr-2">military_tech</span>
                Asker Eğit (5 Altın)
              </button>
            </div>
            
            <div className="mt-auto bg-gray-900/50 rounded-md p-3 h-1/4 overflow-y-auto">
              <h4 className="text-xs font-semibold mb-1">Aktivite Logu</h4>
              <div className="space-y-1">
                {actionLog.map((log, index) => (
                  <div key={index} className="text-xs text-gray-300 flex items-center">
                    <span className="material-icons text-xs mr-1">check_circle</span>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Orta panel - Ada yönetimi ve tüy/yumurta sistemleri */}
          <div className="flex-1 bg-gray-800/90 rounded-lg p-4 flex flex-col text-white">
            <h3 className="text-lg font-bold mb-2">Tüy ve Yumurta Yönetimi</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Tüy birleştirme paneli */}
              <div className="bg-gray-700/90 rounded-md p-3">
                <h4 className="text-md font-semibold mb-2">Tüy Birleştirme</h4>
                <p className="text-xs text-gray-300 mb-3">
                  Aynı renkteki 3 tüyü birleştirerek yumurta elde edebilirsiniz.
                  Her renk farklı bonuslar sağlar.
                </p>
                
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <button
                    className={`p-2 rounded flex flex-col items-center justify-center ${
                      featherColorSelected === "green" ? "bg-green-800 border border-green-500" : "bg-green-900/40"
                    }`}
                    onClick={() => {
                      playClick();
                      setFeatherColorSelected("green");
                    }}
                  >
                    <span className="text-green-400 font-bold">Yeşil</span>
                    <span className="text-xs">+20 Can</span>
                  </button>
                  
                  <button
                    className={`p-2 rounded flex flex-col items-center justify-center ${
                      featherColorSelected === "blue" ? "bg-blue-800 border border-blue-500" : "bg-blue-900/40"
                    }`}
                    onClick={() => {
                      playClick();
                      setFeatherColorSelected("blue");
                    }}
                  >
                    <span className="text-blue-400 font-bold">Mavi</span>
                    <span className="text-xs">+20% Hız</span>
                  </button>
                  
                  <button
                    className={`p-2 rounded flex flex-col items-center justify-center ${
                      featherColorSelected === "orange" ? "bg-orange-800 border border-orange-500" : "bg-orange-900/40"
                    }`}
                    onClick={() => {
                      playClick();
                      setFeatherColorSelected("orange");
                    }}
                  >
                    <span className="text-orange-400 font-bold">Turuncu</span>
                    <span className="text-xs">+20 Saldırı</span>
                  </button>
                </div>
                
                {featherColorSelected && (
                  <div className="flex gap-2">
                    <button
                      className="bg-purple-600 hover:bg-purple-700 text-white py-1 px-3 rounded text-sm flex-1"
                      onClick={() => handleCollectFeathers(featherColorSelected)}
                    >
                      {getFeatherColorName(featherColorSelected)} Tüy Topla
                    </button>
                    
                    <button
                      className="bg-yellow-600 hover:bg-yellow-700 text-white py-1 px-3 rounded text-sm flex-1"
                      onClick={() => handleCombineFeathers(featherColorSelected)}
                      disabled={player.island.featherInventory[featherColorSelected] < 3}
                    >
                      3 Tüyü Birleştir
                    </button>
                  </div>
                )}
              </div>
              
              {/* Yumurta yönetimi */}
              <div className="bg-gray-700/90 rounded-md p-3">
                <h4 className="text-md font-semibold mb-2">Yumurta Yönetimi</h4>
                <p className="text-xs text-gray-300 mb-3">
                  Yumurtalarınızı kuluçka yuvalarına yerleştirin ve kalıcı bonuslar elde edin.
                </p>
                
                {player.island.resources.eggs > 0 && featherColorSelected && (
                  <div className="mb-3">
                    <button
                      className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded text-sm w-full"
                      onClick={() => handleHatchEgg(featherColorSelected)}
                    >
                      {getFeatherColorName(featherColorSelected)} Yumurta Oluştur ve Kuluçkaya Koy
                    </button>
                  </div>
                )}
                
                <div className="grid grid-cols-3 gap-2">
                  {player.island.hatchery.map((slot) => (
                    <div 
                      key={slot.id}
                      className={`p-2 rounded flex flex-col items-center justify-center ${
                        selectedHatcherySlot?.id === slot.id ? "bg-purple-800 border border-purple-500" : 
                        slot.egg ? (
                          slot.egg.color === "green" ? "bg-green-900/40" :
                          slot.egg.color === "blue" ? "bg-blue-900/40" :
                          "bg-orange-900/40"
                        ) : "bg-gray-800/40"
                      } ${slot.isActive ? "opacity-50" : "cursor-pointer"}`}
                      onClick={() => {
                        if (!slot.isActive && slot.egg) {
                          playClick();
                          setSelectedHatcherySlot(slot);
                        }
                      }}
                    >
                      {slot.egg ? (
                        <>
                          <span className={`font-medium ${
                            slot.egg.color === "green" ? "text-green-400" :
                            slot.egg.color === "blue" ? "text-blue-400" :
                            "text-orange-400"
                          }`}>
                            {getFeatherColorName(slot.egg.color)} Yumurta
                          </span>
                          <span className="text-xs">
                            {slot.isActive ? "Aktif" : "Pasif"}
                          </span>
                          <span className="text-xs">
                            +{slot.egg.bonusValue} {getBonusTypeName(slot.egg.bonusType)}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-400">Boş Yuva</span>
                      )}
                    </div>
                  ))}
                </div>
                
                {selectedHatcherySlot && selectedHatcherySlot.egg && !selectedHatcherySlot.isActive && (
                  <button
                    className="bg-purple-600 hover:bg-purple-700 text-white py-1 px-3 rounded text-sm w-full mt-3"
                    onClick={() => handleActivateEgg(selectedHatcherySlot.id)}
                  >
                    Bonusu Aktifleştir
                  </button>
                )}
              </div>
            </div>
            
            {/* Binalar */}
            <div className="bg-gray-700/90 rounded-md p-3 mb-4">
              <h4 className="text-md font-semibold mb-2">Binalarınız</h4>
              <div className="grid grid-cols-3 gap-4">
                {player.island.buildings.map(building => (
                  <div 
                    key={building.id}
                    className={`p-3 rounded-md ${
                      buildingSelected === building.id ? 'border-2 border-blue-500' : ''
                    } cursor-pointer hover:bg-gray-600/90`}
                    onClick={() => {
                      playClick();
                      setBuildingSelected(building.id);
                    }}
                  >
                    <div className="flex items-center justify-center mb-2">
                      <span className="material-icons text-3xl">
                        {building.type === "barracks" ? "local_police" : 
                         building.type === "mine" ? "construction" : "egg"}
                      </span>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">
                        {building.type === "barracks" ? "Kışla" : 
                         building.type === "mine" ? "Maden" : "Kuluçkahane"}
                      </div>
                      <div className="text-xs text-gray-300">Seviye {building.level}</div>
                      <div className="text-xs text-yellow-300">Üretim: {building.productionRate}/tur</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Sağ panel - Düşman bilgileri */}
          <div className="w-1/4 bg-gray-800/90 rounded-lg p-4 flex flex-col text-white">
            <h3 className="text-lg font-bold mb-2">{npc.island.name}</h3>
            
            <div className="bg-gray-700/90 rounded-md p-3 mb-4">
              <h4 className="text-md font-semibold mb-2">Keşif Bilgileri</h4>
              <div className="text-sm space-y-1">
                <div className="bg-gray-800/80 p-2 rounded flex justify-between">
                  <span>Ordu:</span>
                  <span className="font-bold text-red-400">{npc.island.army.soldiers} asker</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-700/90 rounded-md p-3 mb-4">
              <h4 className="text-md font-semibold mb-2">Ordu Bonusları</h4>
              <div className="grid grid-cols-1 gap-2">
                {player.island.army.bonuses.health > 0 && (
                  <div className="bg-green-900/60 p-2 rounded text-center">
                    <div className="text-green-400 font-bold">+{player.island.army.bonuses.health}</div>
                    <div className="text-xs">Can</div>
                  </div>
                )}
                {player.island.army.bonuses.attackPower > 0 && (
                  <div className="bg-red-900/60 p-2 rounded text-center">
                    <div className="text-red-400 font-bold">+{player.island.army.bonuses.attackPower}</div>
                    <div className="text-xs">Saldırı Gücü</div>
                  </div>
                )}
                {player.island.army.bonuses.attackSpeed > 0 && (
                  <div className="bg-blue-900/60 p-2 rounded text-center">
                    <div className="text-blue-400 font-bold">+{player.island.army.bonuses.attackSpeed}%</div>
                    <div className="text-xs">Saldırı Hızı</div>
                  </div>
                )}
                {player.island.army.bonuses.health === 0 && 
                 player.island.army.bonuses.attackPower === 0 && 
                 player.island.army.bonuses.attackSpeed === 0 && (
                  <div className="p-2 rounded text-center text-gray-400">
                    Henüz bonus yok
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1 bg-gray-700/30 rounded-md p-4 flex flex-col justify-center items-center">
              <h4 className="text-lg font-bold mb-3 text-center">Gelecek Dalga</h4>
              <div className="text-center mb-4">
                <span className="material-icons text-6xl text-red-500">warning</span>
                <p className="text-sm mt-2">
                  {preparationTimeLeft <= 10 ? (
                    <span className="text-red-400 font-bold animate-pulse">
                      Saldırı başlamak üzere!
                    </span>
                  ) : (
                    `Düşman dalgası ${Math.floor(preparationTimeLeft)} saniye içinde geliyor!`
                  )}
                </p>
              </div>
              
              <div className="bg-red-900/40 p-3 rounded-md text-center w-full mt-4">
                <p className="text-sm">
                  <span className="font-bold">Tahmini zorluk:</span> 
                  {currentTurn <= 3 ? " Düşük" : 
                   currentTurn <= 6 ? " Orta" : " Yüksek"}
                </p>
                <p className="text-sm mt-1">
                  <span className="font-bold">Tavsiye:</span> 
                  {currentTurn <= 3 ? " En az 5 asker eğit" : 
                   currentTurn <= 6 ? " En az 15 asker eğit" : " En az 25 asker eğit"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreparationPhase;