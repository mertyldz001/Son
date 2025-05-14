import { useEffect, useState } from "react";
import { usePeacockIslandsStore } from "../../lib/stores/usePeacockIslandsStore";
import { useAudio } from "../../lib/stores/useAudio";
import { FeatherColor, HatcherySlot, Egg } from "../../lib/game/peacockIslands/types";
import { getFeatherColorName, getBonusTypeName } from "../../lib/game/peacockIslands/battle";
import GameBoard3D from "./GameBoard3D";
import { FeatherViewer, EggViewer } from "./ModelViewer";

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
                <div className="bg-green-900/60 p-2 rounded text-center flex flex-col items-center">
                  <div className="h-16 w-full">
                    <FeatherViewer color="green" scale={0.5} />
                  </div>
                  <div className="text-green-400 font-bold text-xl mt-1">{player.island.featherInventory.green}</div>
                  <div className="text-xs">Yeşil</div>
                  <div className="text-xs text-green-300/70 mt-1">+20 Can</div>
                </div>
                <div className="bg-blue-900/60 p-2 rounded text-center flex flex-col items-center">
                  <div className="h-16 w-full">
                    <FeatherViewer color="blue" scale={0.5} />
                  </div>
                  <div className="text-blue-400 font-bold text-xl mt-1">{player.island.featherInventory.blue}</div>
                  <div className="text-xs">Mavi</div>
                  <div className="text-xs text-blue-300/70 mt-1">+20% Hız</div>
                </div>
                <div className="bg-orange-900/60 p-2 rounded text-center flex flex-col items-center">
                  <div className="h-16 w-full">
                    <FeatherViewer color="orange" scale={0.5} />
                  </div>
                  <div className="text-orange-400 font-bold text-xl mt-1">{player.island.featherInventory.orange}</div>
                  <div className="text-xs">Turuncu</div>
                  <div className="text-xs text-orange-300/70 mt-1">+20 Saldırı</div>
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
              {/* Tüy birleştirme paneli - Açılır panel */}
              <div className="bg-gray-700/90 rounded-md p-3 relative">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-md font-semibold">Tüy Birleştirme</h4>
                  <button 
                    className="text-gray-300 hover:text-white"
                    onClick={() => setBuildingSelected(buildingSelected === "feathers" ? null : "feathers")}
                  >
                    <span className="material-icons">
                      {buildingSelected === "feathers" ? "expand_less" : "expand_more"}
                    </span>
                  </button>
                </div>
                
                {buildingSelected === "feathers" ? (
                  <div>
                    <p className="text-xs text-gray-300 mb-3">
                      Aynı renkteki 3 tüyü birleştirerek yumurta elde edebilirsiniz.
                      Her renk farklı bonuslar sağlar.
                    </p>
                    
                    <h5 className="text-sm font-medium text-gray-300 mb-2">Tüy Renkleri:</h5>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <button
                        className={`p-3 rounded-lg flex flex-col items-center justify-center h-24 ${
                          featherColorSelected === "green" 
                            ? "bg-green-950 border-2 border-green-500 shadow-lg shadow-green-900/40" 
                            : "bg-green-950/40 border border-green-800 hover:bg-green-900/30"
                        }`}
                        onClick={() => {
                          playClick();
                          setFeatherColorSelected("green");
                        }}
                      >
                        <div className="feather-icon flex items-center justify-center w-10 h-10 rounded-full bg-green-800/60 mb-2">
                          <span className="material-icons text-green-400 text-xl">eco</span>
                        </div>
                        <span className="text-green-400 font-bold">Yeşil</span>
                        <div className="bonus-badge mt-1 px-2 py-0.5 bg-green-900/60 rounded-full text-xs text-green-300">
                          +20 Can
                        </div>
                        <div className="count-badge absolute top-2 right-2 bg-green-700/80 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                          {player.island.featherInventory.green}
                        </div>
                      </button>
                      
                      <button
                        className={`p-3 rounded-lg flex flex-col items-center justify-center h-24 ${
                          featherColorSelected === "blue" 
                            ? "bg-blue-950 border-2 border-blue-500 shadow-lg shadow-blue-900/40" 
                            : "bg-blue-950/40 border border-blue-800 hover:bg-blue-900/30"
                        }`}
                        onClick={() => {
                          playClick();
                          setFeatherColorSelected("blue");
                        }}
                      >
                        <div className="feather-icon flex items-center justify-center w-10 h-10 rounded-full bg-blue-800/60 mb-2">
                          <span className="material-icons text-blue-400 text-xl">air</span>
                        </div>
                        <span className="text-blue-400 font-bold">Mavi</span>
                        <div className="bonus-badge mt-1 px-2 py-0.5 bg-blue-900/60 rounded-full text-xs text-blue-300">
                          +20% Hız
                        </div>
                        <div className="count-badge absolute top-2 right-2 bg-blue-700/80 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                          {player.island.featherInventory.blue}
                        </div>
                      </button>
                      
                      <button
                        className={`p-3 rounded-lg flex flex-col items-center justify-center h-24 ${
                          featherColorSelected === "orange" 
                            ? "bg-orange-950 border-2 border-orange-500 shadow-lg shadow-orange-900/40" 
                            : "bg-orange-950/40 border border-orange-800 hover:bg-orange-900/30"
                        }`}
                        onClick={() => {
                          playClick();
                          setFeatherColorSelected("orange");
                        }}
                      >
                        <div className="feather-icon flex items-center justify-center w-10 h-10 rounded-full bg-orange-800/60 mb-2">
                          <span className="material-icons text-orange-400 text-xl">bolt</span>
                        </div>
                        <span className="text-orange-400 font-bold">Turuncu</span>
                        <div className="bonus-badge mt-1 px-2 py-0.5 bg-orange-900/60 rounded-full text-xs text-orange-300">
                          +20 Saldırı
                        </div>
                        <div className="count-badge absolute top-2 right-2 bg-orange-700/80 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                          {player.island.featherInventory.orange}
                        </div>
                      </button>
                    </div>
                    
                    {featherColorSelected && (
                      <div className="mt-3 space-y-3">
                        <div className="combine-container p-3 bg-gray-800/70 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <h5 className="text-sm font-semibold text-gray-200">
                              {getFeatherColorName(featherColorSelected)} Tüy İşlemleri
                            </h5>
                            
                            <div className="feather-count px-2 py-1 rounded bg-gray-700/70 text-xs text-white">
                              Mevcut: <span className="font-bold">{player.island.featherInventory[featherColorSelected]}</span> adet
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm ${
                                featherColorSelected === "green" 
                                  ? "bg-green-700 hover:bg-green-600 text-white" 
                                  : featherColorSelected === "blue"
                                  ? "bg-blue-700 hover:bg-blue-600 text-white"
                                  : "bg-orange-700 hover:bg-orange-600 text-white"
                              }`}
                              onClick={() => handleCollectFeathers(featherColorSelected)}
                            >
                              <span className="material-icons text-sm">add</span>
                              Tüy Topla
                            </button>
                            
                            <button
                              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm ${
                                player.island.featherInventory[featherColorSelected] >= 3
                                  ? (featherColorSelected === "green" 
                                      ? "bg-green-700 hover:bg-green-600 text-white" 
                                      : featherColorSelected === "blue"
                                      ? "bg-blue-700 hover:bg-blue-600 text-white"
                                      : "bg-orange-700 hover:bg-orange-600 text-white")
                                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
                              }`}
                              onClick={() => {
                                if (player.island.featherInventory[featherColorSelected] >= 3) {
                                  handleCombineFeathers(featherColorSelected);
                                }
                              }}
                              disabled={player.island.featherInventory[featherColorSelected] < 3}
                            >
                              <span className="material-icons text-sm">merge_type</span>
                              3 Tüyü Birleştir
                            </button>
                          </div>
                        </div>
                        
                        {player.island.featherInventory[featherColorSelected] >= 3 && (
                          <div className="combine-preview bg-gray-900/60 p-3 rounded-lg flex items-center text-sm">
                            <div className="flex-1 flex items-center gap-2">
                              <div className="flex items-center">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                  featherColorSelected === "green" ? "bg-green-800/70" :
                                  featherColorSelected === "blue" ? "bg-blue-800/70" :
                                  "bg-orange-800/70"
                                }`}>
                                  <span className="material-icons text-xs">eco</span>
                                </div>
                                <span className="mx-1">×</span>
                                <span className="font-bold">3</span>
                              </div>
                              <span className="mx-2">→</span>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                featherColorSelected === "green" ? "bg-green-800/70" :
                                featherColorSelected === "blue" ? "bg-blue-800/70" :
                                "bg-orange-800/70"
                              }`}>
                                <span className="material-icons text-sm">egg</span>
                              </div>
                            </div>
                            <div className="text-xs text-gray-300">
                              {featherColorSelected === "green" ? "+20 Can" :
                               featherColorSelected === "blue" ? "+20% Hız" :
                               "+20 Saldırı"} bonusu
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-gray-300">
                    Tüy birleştirerek yumurta üretebilirsiniz. Detaylar için tıklayın.
                  </div>
                )}
              </div>
              
              {/* Yumurta yönetimi - Açılır panel */}
              <div className="bg-gray-700/90 rounded-md p-3 relative">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-md font-semibold">Yumurta Yönetimi</h4>
                  <button 
                    className="text-gray-300 hover:text-white"
                    onClick={() => setBuildingSelected(buildingSelected === "eggs" ? null : "eggs")}
                  >
                    <span className="material-icons">
                      {buildingSelected === "eggs" ? "expand_less" : "expand_more"}
                    </span>
                  </button>
                </div>
                
                {buildingSelected === "eggs" ? (
                  <div>
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
                    
                    <h5 className="text-sm font-medium text-gray-300 mb-2">Kuluçka Yuvaları:</h5>
                    <div className="grid grid-cols-3 gap-3">
                      {player.island.hatchery.map((slot) => (
                        <div 
                          key={slot.id}
                          className={`p-3 rounded-lg border flex flex-col items-center justify-center h-28 ${
                            selectedHatcherySlot?.id === slot.id ? "bg-purple-950 border-purple-500" : 
                            slot.egg ? (
                              slot.egg.color === "green" ? "bg-green-950/80 border-green-700" :
                              slot.egg.color === "blue" ? "bg-blue-950/80 border-blue-700" :
                              "bg-orange-950/80 border-orange-700"
                            ) : "bg-gray-850/40 border-gray-700"
                          } ${slot.isActive ? "opacity-70" : "cursor-pointer hover:shadow-inner"}`}
                          onClick={() => {
                            if (!slot.isActive && slot.egg) {
                              playClick();
                              setSelectedHatcherySlot(slot);
                            }
                          }}
                        >
                          {slot.egg ? (
                            <>
                              <div className="egg-icon w-12 h-12 mb-1 rounded-full flex items-center justify-center"
                                style={{
                                  background: `radial-gradient(circle, ${
                                    slot.egg.color === "green" ? "#4caf50" :
                                    slot.egg.color === "blue" ? "#2196f3" :
                                    "#ff9800"
                                  }, transparent)`
                                }}
                              >
                                <span className="material-icons text-2xl">
                                  {slot.egg.color === "green" ? "favorite" :
                                    slot.egg.color === "blue" ? "speed" :
                                    "bolt"}
                                </span>
                              </div>
                              
                              <span className={`font-medium ${
                                slot.egg.color === "green" ? "text-green-400" :
                                slot.egg.color === "blue" ? "text-blue-400" :
                                "text-orange-400"
                              }`}>
                                {getFeatherColorName(slot.egg.color)} 
                              </span>
                              
                              <div className="flex items-center text-xs mt-1">
                                <span className={`px-2 py-0.5 rounded-full ${
                                  slot.isActive 
                                    ? "bg-green-900/60 text-green-300" 
                                    : "bg-gray-800/60 text-gray-300"
                                }`}>
                                  {slot.isActive ? "Aktif" : "Pasif"}
                                </span>
                              </div>
                              
                              <span className="text-xs text-gray-300 mt-1">
                                +{slot.egg.bonusValue} {getBonusTypeName(slot.egg.bonusType)}
                              </span>
                            </>
                          ) : (
                            <>
                              <div className="empty-egg w-12 h-12 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center mb-2">
                                <span className="material-icons text-gray-500">egg</span>
                              </div>
                              <span className="text-gray-400">Boş Yuva</span>
                            </>
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
                ) : (
                  <div className="text-xs text-gray-300">
                    Yumurtaları kuluçkaya koyarak askerlerinize bonus verebilirsiniz. Detaylar için tıklayın.
                  </div>
                )}
              </div>
            </div>
            
            {/* Binalar - Açılır panel */}
            <div className="bg-gray-700/90 rounded-md p-3 mb-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-md font-semibold">Binalarınız</h4>
                <button 
                  className="text-gray-300 hover:text-white"
                  onClick={() => setBuildingSelected(buildingSelected === "buildings" ? null : "buildings")}
                >
                  <span className="material-icons">
                    {buildingSelected === "buildings" ? "expand_less" : "expand_more"}
                  </span>
                </button>
              </div>
              
              {buildingSelected === "buildings" ? (
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
              ) : (
                <div className="text-xs text-gray-300">
                  Adanızda 3 farklı binanız var: Kışla, Maden ve Kuluçkahane. Detaylar için tıklayın.
                </div>
              )}
            </div>
          </div>
          
          {/* Sağ panel - Düşman bilgileri */}
          <div className="w-1/4 bg-gray-800/90 rounded-lg p-4 flex flex-col text-white">
            <h3 className="text-lg font-bold mb-2">{npc.island.name}</h3>
            
            {/* Keşif Bilgileri - Açılır panel */}
            <div className="bg-gray-700/90 rounded-md p-3 mb-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-md font-semibold">Keşif Bilgileri</h4>
                <button 
                  className="text-gray-300 hover:text-white"
                  onClick={() => setBuildingSelected(buildingSelected === "enemy" ? null : "enemy")}
                >
                  <span className="material-icons">
                    {buildingSelected === "enemy" ? "expand_less" : "expand_more"}
                  </span>
                </button>
              </div>
              
              {buildingSelected === "enemy" ? (
                <div className="text-sm space-y-1">
                  <div className="bg-gray-800/80 p-2 rounded flex justify-between">
                    <span>Ordu:</span>
                    <span className="font-bold text-red-400">{npc.island.army.soldiers} asker</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-300">
                  Düşman adası hakkında bilgi alabilirsiniz. Detaylar için tıklayın.
                </div>
              )}
            </div>
            
            {/* Ordu bonusları - Açılır panel */}
            <div className="bg-gray-700/90 rounded-md p-3 mb-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-md font-semibold">Ordu Bonusları</h4>
                <button 
                  className="text-gray-300 hover:text-white"
                  onClick={() => setBuildingSelected(buildingSelected === "bonuses" ? null : "bonuses")}
                >
                  <span className="material-icons">
                    {buildingSelected === "bonuses" ? "expand_less" : "expand_more"}
                  </span>
                </button>
              </div>
              
              {buildingSelected === "bonuses" ? (
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
              ) : (
                <div className="text-xs text-gray-300">
                  Kuluçkaya koyduğunuz yumurtalardan elde ettiğiniz bonuslar. Detaylar için tıklayın.
                </div>
              )}
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