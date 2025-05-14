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
        <div className="glass-panel p-4 rounded-lg mb-4 flex justify-between items-center pointer-events-auto">
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <span className="material-icons mr-2 text-amber-400">diamond</span>
              Hazırlık Fazı
            </h2>
            <p className="text-sm text-blue-200">Kaynaklarınızı yönetin ve adanızı geliştirin</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="glass-panel px-4 py-2 rounded-md text-white flex items-center bg-blue-900/50 border border-blue-400/30">
              <span className="material-icons mr-2 text-blue-300">timer</span>
              <span className="font-bold text-xl">
                {Math.floor(preparationTimeLeft)}
                <span className="text-xs ml-1 text-blue-300">sn</span>
              </span>
            </div>
            
            <div className="glass-panel px-4 py-2 rounded-md text-white flex items-center bg-purple-900/50 border border-purple-400/30">
              <span className="material-icons mr-2 text-purple-300">emoji_events</span>
              <span className="font-bold text-xl">
                Tur {currentTurn}
              </span>
            </div>
          </div>
        </div>
        
        {/* Ana içerik */}
        <div className="flex gap-4 h-3/4 pointer-events-auto">
          {/* Sol panel - Oyuncu bilgileri */}
          <div className="w-1/4 glass-panel rounded-lg p-4 flex flex-col text-white">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center mr-3 border-2 border-blue-400">
                <span className="material-icons">person</span>
              </div>
              <div>
                <h3 className="text-lg font-bold">{player.island.name}</h3>
                <p className="text-xs text-blue-300">Ada Komutanı</p>
              </div>
            </div>
            
            <div className="glass-panel bg-indigo-900/20 rounded-md p-3 mb-4 border border-indigo-500/20">
              <h4 className="text-md font-semibold mb-2 flex items-center">
                <span className="material-icons mr-1 text-yellow-400">monetization_on</span>
                Kaynaklar
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-yellow-900/60 to-amber-800/40 p-3 rounded-lg text-center card-hover border border-yellow-600/30">
                  <div className="text-yellow-300 font-bold text-xl">{player.island.resources.gold}</div>
                  <div className="text-xs flex items-center justify-center mt-1">
                    <span className="material-icons text-xs mr-1">paid</span>
                    <span>Altın</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-900/60 to-emerald-800/40 p-3 rounded-lg text-center card-hover border border-green-600/30">
                  <div className="text-green-300 font-bold text-xl">{player.island.resources.eggs}</div>
                  <div className="text-xs flex items-center justify-center mt-1">
                    <span className="material-icons text-xs mr-1">egg</span>
                    <span>Yumurta</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="glass-panel bg-indigo-900/20 rounded-md p-3 mb-4 border border-indigo-500/20">
              <h4 className="text-md font-semibold mb-2 flex items-center">
                <span className="material-icons mr-1 text-teal-400">flutter_dash</span>
                Tüy Envanteri
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-green-900/70 to-emerald-900/40 p-2 rounded-lg text-center flex flex-col items-center card-hover border border-green-600/30">
                  <div className="h-16 w-full model-container">
                    <FeatherViewer color="green" scale={0.5} />
                  </div>
                  <div className="text-green-300 font-bold text-xl mt-1">{player.island.featherInventory.green}</div>
                  <div className="text-xs font-medium text-green-200">Yeşil</div>
                  <div className="bg-green-800/40 text-green-300 text-xs mt-1 px-2 py-0.5 rounded-full border border-green-700/30 flex items-center">
                    <span className="material-icons text-xs mr-1">favorite</span>
                    <span>+20 Can</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-900/70 to-sky-900/40 p-2 rounded-lg text-center flex flex-col items-center card-hover border border-blue-600/30">
                  <div className="h-16 w-full model-container">
                    <FeatherViewer color="blue" scale={0.5} />
                  </div>
                  <div className="text-blue-300 font-bold text-xl mt-1">{player.island.featherInventory.blue}</div>
                  <div className="text-xs font-medium text-blue-200">Mavi</div>
                  <div className="bg-blue-800/40 text-blue-300 text-xs mt-1 px-2 py-0.5 rounded-full border border-blue-700/30 flex items-center">
                    <span className="material-icons text-xs mr-1">speed</span>
                    <span>+20% Hız</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-orange-900/70 to-amber-900/40 p-2 rounded-lg text-center flex flex-col items-center card-hover border border-orange-600/30">
                  <div className="h-16 w-full model-container">
                    <FeatherViewer color="orange" scale={0.5} />
                  </div>
                  <div className="text-orange-300 font-bold text-xl mt-1">{player.island.featherInventory.orange}</div>
                  <div className="text-xs font-medium text-orange-200">Turuncu</div>
                  <div className="bg-orange-800/40 text-orange-300 text-xs mt-1 px-2 py-0.5 rounded-full border border-orange-700/30 flex items-center">
                    <span className="material-icons text-xs mr-1">bolt</span>
                    <span>+20 Saldırı</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="glass-panel bg-indigo-900/20 rounded-md p-3 mb-4 border border-indigo-500/20">
              <h4 className="text-md font-semibold mb-2 flex items-center">
                <span className="material-icons mr-1 text-red-400">military_tech</span>
                Ordu
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-red-900/70 to-rose-900/40 p-3 rounded-lg text-center card-hover border border-red-600/30 col-span-2">
                  <div className="text-red-300 font-bold text-2xl">{player.island.army.soldiers}</div>
                  <div className="flex items-center justify-center text-xs mt-1">
                    <span className="material-icons text-xs mr-1">shield</span>
                    <span>Asker</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-900/70 to-fuchsia-900/40 p-3 rounded-lg text-center card-hover border border-purple-600/30">
                  <div className="text-purple-300 font-bold text-2xl">
                    {player.island.army.attackPower + player.island.army.bonuses.attackPower}
                  </div>
                  <div className="flex items-center justify-center text-xs mt-1">
                    <span className="material-icons text-xs mr-1">bolt</span>
                    <span>Saldırı</span>
                  </div>
                </div>
              </div>

              {/* Bonus göstergeleri */}
              {(player.island.army.bonuses.health > 0 || 
                player.island.army.bonuses.attackPower > 0 || 
                player.island.army.bonuses.attackSpeed > 0) && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {player.island.army.bonuses.health > 0 && (
                    <span className="bg-green-800/50 text-green-300 text-xs px-2 py-0.5 rounded-full border border-green-700/30 flex items-center">
                      <span className="material-icons text-xs mr-1">favorite</span>
                      <span>+{player.island.army.bonuses.health}</span>
                    </span>
                  )}
                  {player.island.army.bonuses.attackPower > 0 && (
                    <span className="bg-orange-800/50 text-orange-300 text-xs px-2 py-0.5 rounded-full border border-orange-700/30 flex items-center">
                      <span className="material-icons text-xs mr-1">bolt</span>
                      <span>+{player.island.army.bonuses.attackPower}</span>
                    </span>
                  )}
                  {player.island.army.bonuses.attackSpeed > 0 && (
                    <span className="bg-blue-800/50 text-blue-300 text-xs px-2 py-0.5 rounded-full border border-blue-700/30 flex items-center">
                      <span className="material-icons text-xs mr-1">speed</span>
                      <span>+{player.island.army.bonuses.attackSpeed}%</span>
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="glass-panel bg-indigo-900/20 rounded-md p-3 mb-4 border border-indigo-500/20">
              <h4 className="text-md font-semibold mb-3 flex items-center">
                <span className="material-icons mr-1 text-cyan-400">sports</span>
                Aktiviteler
              </h4>
              
              <div className="grid grid-cols-1 gap-2">
                <button 
                  className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg w-full mb-1 flex items-center justify-center transition-all duration-300 border border-blue-500/50 shadow-md hover:shadow-lg"
                  onClick={() => handleCollectFeathers()}
                >
                  <span className="material-icons mr-2">eco</span>
                  Tüy Topla
                </button>
                
                <button 
                  className="bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-bold py-3 px-4 rounded-lg w-full flex items-center justify-center transition-all duration-300 border border-red-500/50 shadow-md hover:shadow-lg"
                  onClick={() => handleTrainSoldiers(1)}
                >
                  <div className="flex items-center">
                    <span className="material-icons mr-2">military_tech</span>
                    <span>Asker Eğit</span>
                  </div>
                  <div className="ml-auto flex items-center bg-red-900/80 px-2 py-1 rounded-full text-xs border border-red-600/50">
                    <span className="material-icons text-xs mr-1">paid</span>
                    <span>5</span>
                  </div>
                </button>
              </div>
            </div>
            
            <div className="mt-auto glass-panel bg-slate-900/30 rounded-lg p-3 h-1/4 overflow-y-auto border border-slate-600/20">
              <h4 className="text-xs font-semibold mb-2 flex items-center text-blue-300">
                <span className="material-icons text-xs mr-1">history</span>
                Aktivite Logu
              </h4>
              <div className="space-y-2">
                {actionLog.map((log, index) => (
                  <div key={index} className="text-xs text-gray-300 flex items-start bg-slate-800/30 p-2 rounded border border-slate-700/30">
                    <span className="material-icons text-xs mr-2 text-green-400 mt-0.5">check_circle</span>
                    <span>{log}</span>
                  </div>
                )).slice(-5)}
              </div>
            </div>
          </div>
          
          {/* Orta panel - Ada yönetimi ve tüy/yumurta sistemleri */}
          <div className="flex-1 glass-panel rounded-lg p-4 flex flex-col text-white">
            <h3 className="text-lg font-bold mb-3 flex items-center border-b border-indigo-500/30 pb-2">
              <span className="material-icons mr-2 text-amber-400">auto_awesome</span>
              Tüy ve Yumurta Yönetimi
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Tüy birleştirme paneli - Açılır panel */}
              <div className="glass-panel bg-indigo-900/20 rounded-lg p-3 relative border border-indigo-500/20">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-md font-semibold flex items-center">
                    <span className="material-icons mr-2 text-teal-400">merge_type</span>
                    Tüy Birleştirme
                  </h4>
                  <button 
                    className="text-gray-300 hover:text-white bg-slate-800/50 rounded-full p-1 hover:bg-slate-700/70"
                    onClick={() => setBuildingSelected(buildingSelected === "feathers" ? null : "feathers")}
                  >
                    <span className="material-icons">
                      {buildingSelected === "feathers" ? "expand_less" : "expand_more"}
                    </span>
                  </button>
                </div>
                
                {buildingSelected === "feathers" ? (
                  <div>
                    <div className="glass-panel bg-slate-900/40 rounded-lg p-3 mb-3 border border-slate-600/20">
                      <p className="text-xs text-gray-300">
                        Aynı renkteki 3 tüyü birleştirerek yumurta elde edebilirsiniz.
                        Her renk farklı bonuslar sağlar.
                      </p>
                    </div>
                    
                    <h5 className="text-sm font-medium text-blue-300 mb-2 flex items-center">
                      <span className="material-icons mr-1 text-xs">palette</span>
                      Tüy Renkleri:
                    </h5>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <button
                        className={`p-3 rounded-lg flex flex-col items-center justify-between ${
                          featherColorSelected === "green" 
                            ? "bg-green-950 border-2 border-green-500 shadow-lg shadow-green-900/40" 
                            : "bg-green-950/40 border border-green-800 hover:bg-green-900/30"
                        }`}
                        onClick={() => {
                          playClick();
                          setFeatherColorSelected("green");
                        }}
                      >
                        {/* 3D Tüy Modeli */}
                        <div className="h-20 w-full">
                          <FeatherViewer 
                            color="green" 
                            scale={0.6} 
                            rotate={featherColorSelected === "green"}
                          />
                        </div>
                        
                        <div className="mt-auto w-full text-center">
                          <span className="text-green-400 font-bold">Yeşil</span>
                          <div className="bonus-badge mt-1 px-2 py-0.5 bg-green-900/60 rounded-full text-xs text-green-300">
                            +20 Can
                          </div>
                        </div>
                        
                        <div className="count-badge absolute top-2 right-2 bg-green-700/80 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border border-green-500/50">
                          {player.island.featherInventory.green}
                        </div>
                      </button>
                      
                      <button
                        className={`p-3 rounded-lg flex flex-col items-center justify-between ${
                          featherColorSelected === "blue" 
                            ? "bg-blue-950 border-2 border-blue-500 shadow-lg shadow-blue-900/40" 
                            : "bg-blue-950/40 border border-blue-800 hover:bg-blue-900/30"
                        }`}
                        onClick={() => {
                          playClick();
                          setFeatherColorSelected("blue");
                        }}
                      >
                        {/* 3D Tüy Modeli */}
                        <div className="h-20 w-full">
                          <FeatherViewer 
                            color="blue" 
                            scale={0.6} 
                            rotate={featherColorSelected === "blue"}
                          />
                        </div>
                        
                        <div className="mt-auto w-full text-center">
                          <span className="text-blue-400 font-bold">Mavi</span>
                          <div className="bonus-badge mt-1 px-2 py-0.5 bg-blue-900/60 rounded-full text-xs text-blue-300">
                            +20% Hız
                          </div>
                        </div>
                        
                        <div className="count-badge absolute top-2 right-2 bg-blue-700/80 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border border-blue-500/50">
                          {player.island.featherInventory.blue}
                        </div>
                      </button>
                      
                      <button
                        className={`p-3 rounded-lg flex flex-col items-center justify-between ${
                          featherColorSelected === "orange" 
                            ? "bg-orange-950 border-2 border-orange-500 shadow-lg shadow-orange-900/40" 
                            : "bg-orange-950/40 border border-orange-800 hover:bg-orange-900/30"
                        }`}
                        onClick={() => {
                          playClick();
                          setFeatherColorSelected("orange");
                        }}
                      >
                        {/* 3D Tüy Modeli */}
                        <div className="h-20 w-full">
                          <FeatherViewer 
                            color="orange" 
                            scale={0.6} 
                            rotate={featherColorSelected === "orange"}
                          />
                        </div>
                        
                        <div className="mt-auto w-full text-center">
                          <span className="text-orange-400 font-bold">Turuncu</span>
                          <div className="bonus-badge mt-1 px-2 py-0.5 bg-orange-900/60 rounded-full text-xs text-orange-300">
                            +20 Saldırı
                          </div>
                        </div>
                        
                        <div className="count-badge absolute top-2 right-2 bg-orange-700/80 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border border-orange-500/50">
                          {player.island.featherInventory.orange}
                        </div>
                      </button>
                    </div>
                    
                    {featherColorSelected && (
                      <div className="mt-3 space-y-3">
                        <div className="glass-panel bg-slate-900/40 rounded-lg p-4 border border-slate-600/30">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                            <h5 className="text-sm font-semibold text-gray-200 flex items-center">
                              <span className="material-icons mr-1 text-sm">
                                {featherColorSelected === "green" ? "emoji_nature" : 
                                 featherColorSelected === "blue" ? "water_drop" : "local_fire_department"}
                              </span>
                              <span className={
                                featherColorSelected === "green" ? "text-green-400" : 
                                featherColorSelected === "blue" ? "text-blue-400" : "text-orange-400"
                              }>
                                {getFeatherColorName(featherColorSelected)}
                              </span>
                              <span className="text-gray-300"> Tüy İşlemleri</span>
                            </h5>
                            
                            <div className={`feather-count px-3 py-1 rounded-full text-xs border flex items-center mt-2 sm:mt-0 ${
                              featherColorSelected === "green" 
                                ? "bg-green-900/40 text-green-300 border-green-700/50" 
                                : featherColorSelected === "blue"
                                ? "bg-blue-900/40 text-blue-300 border-blue-700/50"
                                : "bg-orange-900/40 text-orange-300 border-orange-700/50"
                            }`}>
                              <span className="material-icons text-xs mr-1">inventory_2</span>
                              Mevcut: <span className="font-bold ml-1">{player.island.featherInventory[featherColorSelected]}</span> adet
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                              className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm shadow-md transition-all duration-300 ${
                                featherColorSelected === "green" 
                                  ? "bg-gradient-to-r from-green-700 to-green-800 hover:from-green-600 hover:to-green-700 text-white border border-green-600/50" 
                                  : featherColorSelected === "blue"
                                  ? "bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-600 hover:to-blue-700 text-white border border-blue-600/50"
                                  : "bg-gradient-to-r from-orange-700 to-orange-800 hover:from-orange-600 hover:to-orange-700 text-white border border-orange-600/50"
                              }`}
                              onClick={() => handleCollectFeathers(featherColorSelected)}
                            >
                              <span className="material-icons text-sm">eco</span>
                              Tüy Topla
                            </button>
                            
                            <button
                              className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm shadow-md transition-all duration-300 ${
                                player.island.featherInventory[featherColorSelected] >= 3
                                  ? (featherColorSelected === "green" 
                                      ? "bg-gradient-to-r from-green-700 to-green-800 hover:from-green-600 hover:to-green-700 text-white border border-green-600/50" 
                                      : featherColorSelected === "blue"
                                      ? "bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-600 hover:to-blue-700 text-white border border-blue-600/50"
                                      : "bg-gradient-to-r from-orange-700 to-orange-800 hover:from-orange-600 hover:to-orange-700 text-white border border-orange-600/50")
                                  : "bg-gray-800/70 text-gray-400 cursor-not-allowed border border-gray-700/30"
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
                          <div className="combine-preview bg-gray-900/70 p-3 rounded-lg overflow-hidden">
                            <h6 className="text-sm font-medium text-gray-300 mb-2 text-center">Tüyleri Birleştir</h6>
                            
                            <div className="grid grid-cols-5 gap-2">
                              {/* Sol: Tüyler */}
                              <div className="col-span-2 flex flex-col items-center">
                                <div className="h-16 w-full">
                                  <FeatherViewer 
                                    color={featherColorSelected} 
                                    scale={0.4} 
                                    rotate={false}
                                  />
                                </div>
                                <div className="flex items-center mt-2">
                                  <span className="flex items-center justify-center px-2 py-1 rounded-lg bg-gray-800/80">
                                    <span className="font-bold text-white">x3</span>
                                    <span className="text-xs ml-1 text-gray-300">tüy</span>
                                  </span>
                                </div>
                              </div>
                              
                              {/* Orta: Ok */}
                              <div className="flex items-center justify-center">
                                <div className="arrow w-8 h-8 bg-gray-800/80 rounded-full flex items-center justify-center">
                                  <span className="material-icons transform scale-125 text-gray-300">
                                    arrow_forward
                                  </span>
                                </div>
                              </div>
                              
                              {/* Sağ: Yumurta */}
                              <div className="col-span-2 flex flex-col items-center">
                                <div className="h-16 w-full">
                                  <EggViewer 
                                    color={featherColorSelected} 
                                    scale={0.7} 
                                    rotate={true}
                                  />
                                </div>
                                <div className="flex items-center mt-2">
                                  <span className={`flex items-center justify-center px-2 py-1 rounded-lg ${
                                    featherColorSelected === "green" ? "bg-green-900/70" :
                                    featherColorSelected === "blue" ? "bg-blue-900/70" :
                                    "bg-orange-900/70"
                                  }`}>
                                    <span className="material-icons text-xs mr-1">
                                      {featherColorSelected === "green" ? "favorite" :
                                        featherColorSelected === "blue" ? "speed" :
                                        "bolt"}
                                    </span>
                                    <span className="text-xs">
                                      {featherColorSelected === "green" ? "+20 Can" :
                                       featherColorSelected === "blue" ? "+20% Hız" :
                                       "+20 Saldırı"}
                                    </span>
                                  </span>
                                </div>
                              </div>
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
                          className={`p-3 rounded-lg border flex flex-col items-center justify-center ${
                            selectedHatcherySlot?.id === slot.id ? "bg-purple-950 border-purple-500" : 
                            slot.egg ? (
                              slot.egg.color === "green" ? "bg-green-950/80 border-green-700" :
                              slot.egg.color === "blue" ? "bg-blue-950/80 border-blue-700" :
                              "bg-orange-950/80 border-orange-700"
                            ) : "bg-gray-850/40 border-gray-700"
                          } ${slot.isActive ? "opacity-80" : "cursor-pointer hover:shadow-inner"}`}
                          onClick={() => {
                            if (!slot.isActive && slot.egg) {
                              playClick();
                              setSelectedHatcherySlot(slot);
                            }
                          }}
                        >
                          {slot.egg ? (
                            <>
                              {/* 3D Yumurta Modeli */}
                              <div className="h-28 w-full mb-2">
                                <EggViewer 
                                  color={slot.egg.color}
                                  isActive={slot.isActive}
                                  scale={1.2}
                                  rotate={true}
                                />
                              </div>
                              
                              <div className="mt-auto w-full">
                                <div className="flex justify-between items-center mb-1">
                                  <span className={`font-medium ${
                                    slot.egg.color === "green" ? "text-green-400" :
                                    slot.egg.color === "blue" ? "text-blue-400" :
                                    "text-orange-400"
                                  }`}>
                                    {getFeatherColorName(slot.egg.color)} 
                                  </span>
                                  
                                  <div className="flex items-center ml-1">
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                                      slot.isActive 
                                        ? "bg-green-900/60 text-green-300" 
                                        : "bg-gray-800/60 text-gray-300"
                                    }`}>
                                      {slot.isActive ? "Aktif" : "Pasif"}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className={`bonus-badge p-1 rounded text-xs text-center ${
                                  slot.egg.color === "green" ? "bg-green-900/40 text-green-300" :
                                  slot.egg.color === "blue" ? "bg-blue-900/40 text-blue-300" :
                                  "bg-orange-900/40 text-orange-300"
                                }`}>
                                  <span className="material-icons text-xs mr-1 align-text-top">
                                    {slot.egg.bonusType === "health" ? "favorite" :
                                      slot.egg.bonusType === "attackSpeed" ? "speed" :
                                      "bolt"}
                                  </span>
                                  +{slot.egg.bonusValue} {getBonusTypeName(slot.egg.bonusType)}
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="empty-egg-container h-28 w-full flex items-center justify-center mb-2">
                                <div className="empty-egg w-16 h-16 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center">
                                  <span className="material-icons text-gray-500">egg</span>
                                </div>
                              </div>
                              <div className="mt-2 text-gray-400 text-center">
                                <div>Boş Yuva</div>
                                <div className="text-xs text-gray-500 mt-1">Yumurta oluşturmak için<br/>3 tüy birleştirin</div>
                              </div>
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