import { useEffect, useState } from "react";
import { usePeacockIslandsStore } from "../../lib/stores/usePeacockIslandsStore";
import { useAudio } from "../../lib/stores/useAudio";
import { FeatherColor, HatcherySlot, Egg, Unit } from "../../lib/game/peacockIslands/types";
import { getFeatherColorName, getBonusTypeName } from "../../lib/game/peacockIslands/battle";
import GameBoard3D from "./GameBoard3DNew";
import { FeatherViewer, EggViewer } from "./ModelViewer";
import UnitCard from "./UnitCard";
import DragDrop from "./DragDrop";
import { getDeployedUnitPositionsMap } from "../../lib/game/peacockIslands/unitSystem";
import WindowPanel from "../UI/WindowPanel";
import { User, ShieldCheck, Leaf, Egg as EggIcon } from 'lucide-react';

// Hazırlık Fazı Bileşeni
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
    activateEgg,
    deployUnit,
    undeployUnit
  } = usePeacockIslandsStore();
  
  // Birim ve UI durum değişkenleri
  const [showUnitCards, setShowUnitCards] = useState(false);
  const [draggedUnit, setDraggedUnit] = useState<Unit | null>(null);
  
  // Birim kategorileri
  const peacockWarriors = player.island.units.filter((unit: Unit) => unit.type === "warrior");
  const humanSoldiers = player.island.units.filter((unit: Unit) => unit.type === "soldier");
  
  // Her bir üye durumunu takip et (yerleştirildi mi?)
  const deployedUnits = player.island.units.filter((unit: Unit) => unit.isDeployed);
  
  // Hex koordinata tıklandığında
  const handleHexClick = (coords: {q: number, r: number, s: number}) => {
    if (draggedUnit) {
      // Eğer bir birim seçiliyse ve oyuncu tarafına sürükleniyorsa
      if (coords.r >= 3) { // Oyuncu tarafı (alt 3 sıra)
        deployUnit(player.id, draggedUnit.id, coords);
        playClick();
        setDraggedUnit(null);
        return true;
      }
    }
    return false;
  };
  const { playClick, playCollect, playBuild } = useAudio();
  
  const [lastTime, setLastTime] = useState(Date.now());
  const [buildingSelected, setBuildingSelected] = useState<string | null>(null);
  const [featherColorSelected, setFeatherColorSelected] = useState<FeatherColor | null>(null);
  const [selectedHatcherySlot, setSelectedHatcherySlot] = useState<HatcherySlot | null>(null);
  const [actionLog, setActionLog] = useState<string[]>([]);

  // Pencere küçültme durumları - hepsi başlangıçta küçültülmüş
  const [featherPanelMinimized, setFeatherPanelMinimized] = useState(true);
  const [eggPanelMinimized, setEggPanelMinimized] = useState(true);
  const [resourcesPanelMinimized, setResourcesPanelMinimized] = useState(true);
  const [armyPanelMinimized, setArmyPanelMinimized] = useState(true);
  const [activitiesPanelMinimized, setActivitiesPanelMinimized] = useState(true);
  
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
  
  // Asker bilgisi
  const activeWarriors = player.island.units
    .filter((unit: Unit) => unit.type === "warrior")
    .filter((unit: Unit) => !unit.isDeployed);
  const activeSoldiers = player.island.units
    .filter((unit: Unit) => unit.type === "soldier")
    .filter((unit: Unit) => !unit.isDeployed);
  const peacockWarriorCount = activeWarriors.length;
  const humanSoldierCount = activeSoldiers.length;

  // NOT: Yukarıda deployedUnits değişkeni zaten tanımlandı
  
  // Mouse ve hex tıklamalarını takip ederek sürükleme işlemini yönet
  useEffect(() => {
    const handleMouseUp = () => {
      if (draggedUnit) {
        // Eğer sürükleme aktifse ve boşluğa tıklanırsa, bitir
        setDraggedUnit(null);
      }
    };
    
    // Hex tıklamaları için özel olay dinleyici
    const handleHexClick = (e: CustomEvent) => {
      if (draggedUnit) {
        // Güvenlik kontrolü
        const detail = e.detail as { 
          hexCoords: { q: number, r: number, s: number },
          isPlayerSide: boolean,
          isOccupied: boolean 
        };
        
        // Sadece oyuncu tarafına ve boş hücrelere koy
        if (detail.isPlayerSide && !detail.isOccupied) {
          console.log('Hex tıklandı:', detail.hexCoords);
          deployUnit(player.id, draggedUnit.id, detail.hexCoords);
          playClick();
          setDraggedUnit(null);
        }
      }
    };
    
    // Olayları dinle
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('hex-click', handleHexClick as EventListener);
    
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('hex-click', handleHexClick as EventListener);
    };
  }, [draggedUnit, player.id, deployUnit, playClick]);

  return (
    <div className="w-full h-full relative">
      {/* 3D Game Board as background */}
      <GameBoard3D />
      
      {/* UI Overlays */}
      <div className="absolute inset-0 z-10 p-4 pointer-events-none">
        {/* Üst panel - Tur bilgileri (Daha modern ve küçük) */}
        <div className="flex justify-between w-full items-center pointer-events-auto">
          <div className="bg-gradient-to-r from-amber-900/80 to-amber-800/70 px-4 py-2 rounded-lg border border-amber-500/30 shadow-lg backdrop-blur-sm flex items-center space-x-2 transform -translate-y-1">
            <div className="p-1.5 bg-amber-700/50 rounded-md">
              <span className="material-icons text-amber-300" style={{ fontSize: '18px' }}>diamond</span>
            </div>
            <div>
              <h2 className="text-base font-medium text-amber-200 flex items-center">
                Hazırlık Fazı
              </h2>
              <p className="text-xs text-amber-200/70 font-light">Kaynaklarınızı yönetin ve adanızı geliştirin</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="px-3 py-2 rounded-lg text-white flex items-center bg-gradient-to-r from-blue-900/90 to-blue-800/70 border border-blue-500/30 shadow-lg backdrop-blur-sm">
              <span className="material-icons mr-1.5 text-blue-300" style={{ fontSize: '16px' }}>timer</span>
              <span className="font-medium">
                {Math.floor(preparationTimeLeft)}
                <span className="text-xs ml-0.5 text-blue-300">sn</span>
              </span>
            </div>
            
            <div className="px-3 py-2 rounded-lg text-white flex items-center bg-gradient-to-r from-indigo-900/90 to-indigo-800/70 border border-indigo-500/30 shadow-lg backdrop-blur-sm">
              <span className="material-icons mr-1.5 text-indigo-300" style={{ fontSize: '16px' }}>flag</span>
              <span className="font-medium">Tur {currentTurn}/5</span>
            </div>
            
            {/* NPC Aktivitesi - Sağ tarafta modern tasarım */}
            <div className="px-3 py-2 rounded-lg text-white flex items-center bg-gradient-to-r from-purple-900/90 to-purple-800/70 border border-purple-500/30 shadow-lg backdrop-blur-sm" 
                 title="NPC Aktiviteleri (Bilgisayar rakip)">
              <span className="material-icons mr-1.5 text-purple-300" style={{ fontSize: '16px' }}>bolt</span>
              <span className="font-medium">NPC</span>
              <div className="w-2 h-2 ml-1.5 rounded-full bg-purple-400 animate-pulse"></div>
            </div>
          </div>
        </div>
        
        {/* Ana içerik - Yeni düzen */}
        <div className="flex gap-6 h-3/4 pointer-events-auto">
          {/* Sol panel - Oyuncu bilgileri */}
          <div className="w-1/4 glass-panel rounded-lg p-4 flex flex-col text-white relative z-10">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center mr-3 border-2 border-blue-400">
                <span className="material-icons">person</span>
              </div>
              <div>
                <h3 className="text-lg font-bold">{player.island.name}</h3>
                <p className="text-xs text-blue-300">Ada Komutanı</p>
              </div>
            </div>
            
            {/* Kaynaklar WindowPanel */}
            <WindowPanel 
              title="Kaynaklar" 
              iconType="island"
              width="100%" 
              initiallyMinimized={resourcesPanelMinimized}
              height="auto"
            >
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
                    <EggIcon size={12} className="mr-1 text-green-300" />
                    <span>Yumurta</span>
                  </div>
                </div>
              </div>
            </WindowPanel>
            
            {/* Tüy Envanteri WindowPanel */}
            <WindowPanel 
              title="Tüy Envanteri" 
              iconType="feather"
              width="100%" 
              initiallyMinimized={featherPanelMinimized}
              height="auto"
              className="mt-4"
            >
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
            </WindowPanel>
            
            {/* Ordu WindowPanel */}
            <WindowPanel 
              title="Ordu"
              iconType="army" 
              width="100%" 
              initiallyMinimized={armyPanelMinimized}
              height="auto"
              className="mt-4"
            >
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
            </WindowPanel>
            
            {/* Aktiviteler WindowPanel */}
            <WindowPanel 
              title="Aktiviteler" 
              width="100%" 
              initiallyMinimized={activitiesPanelMinimized}
              height="auto"
              className="mt-4"
            >
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
            </WindowPanel>
            
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
          <div className="flex-1 relative z-0">
            {/* Üst düğme çubuğu - TFT stilinde */}
            <div className="absolute top-5 right-5 flex gap-3 z-10">
              <button 
                onClick={() => {
                  playClick();
                  setBuildingSelected(buildingSelected === "feathers" ? null : "feathers");
                }}
                className={`h-12 w-12 rounded-full flex items-center justify-center ${
                  buildingSelected === "feathers" 
                    ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white ring-2 ring-amber-300 shadow-lg shadow-amber-900/50" 
                    : "bg-gradient-to-br from-slate-700 to-slate-800 text-amber-200 hover:from-slate-600 hover:to-slate-700 shadow-md"
                } transition-all duration-200 relative overflow-hidden`}
              >
                <span className="material-icons text-xl">auto_awesome</span>
                {buildingSelected === "feathers" && (
                  <span className="absolute -bottom-1 left-0 right-0 h-1 bg-white rounded-full shadow-glow-amber animate-pulse"></span>
                )}
              </button>
              
              <button 
                onClick={() => {
                  playClick();
                  setBuildingSelected(buildingSelected === "eggs" ? null : "eggs");
                }}
                className={`h-12 w-12 rounded-full flex items-center justify-center ${
                  buildingSelected === "eggs" 
                    ? "bg-gradient-to-br from-blue-400 to-blue-600 text-white ring-2 ring-blue-300 shadow-lg shadow-blue-900/50" 
                    : "bg-gradient-to-br from-slate-700 to-slate-800 text-blue-200 hover:from-slate-600 hover:to-slate-700 shadow-md"
                } transition-all duration-200 relative overflow-hidden`}
              >
                <span className="material-icons text-xl">egg</span>
                {buildingSelected === "eggs" && (
                  <span className="absolute -bottom-1 left-0 right-0 h-1 bg-white rounded-full shadow-glow-blue animate-pulse"></span>
                )}
              </button>
              
              <div className="h-8 w-0.5 bg-slate-600/30 mx-1 self-center"></div>
              
              <button 
                onClick={() => {
                  playClick();
                  handleCollectFeathers();
                }}
                className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 text-white hover:from-green-400 hover:to-emerald-600 shadow-md hover:shadow-lg flex items-center justify-center transition-all duration-200"
              >
                <span className="material-icons text-xl">eco</span>
              </button>
            </div>
            
            {/* Bilgisayar göstergesi - Animasyonlu */}
            <div className="absolute top-5 left-5 flex gap-2 z-10">
              <div className="glass-panel py-1 px-3 rounded-md bg-gradient-to-r from-indigo-900/40 to-indigo-800/50 border border-indigo-500/30 shadow-lg flex items-center text-white text-xs font-medium">
                <span className="material-icons mr-1 text-indigo-400 text-xs">computer</span>
                <span>NPC Aktivite:</span>
                <div className="ml-2 flex items-center justify-center space-x-0.5">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse-delay-1"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse-delay-2"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse-delay-3"></div>
                </div>
              </div>
            </div>
            
            {/* Tüy birleştirme paneli - TFT Kartları Stili */}
            {buildingSelected === "feathers" && (
              <div className="absolute top-20 right-5 z-10">
                <div className="rounded-lg shadow-2xl w-72 overflow-hidden transform transition-all duration-300">
                  {/* Başlık şeridi */}
                  <div className="bg-gradient-to-r from-amber-700 to-amber-900 p-2 border-b border-amber-500/50 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-amber-100 flex items-center">
                      <span className="material-icons text-amber-300 mr-2 text-sm">auto_awesome</span>
                      Tüy Birleştirme
                    </h3>
                    <button 
                      onClick={() => setBuildingSelected(null)} 
                      className="text-amber-300 hover:text-amber-100"
                    >
                      <span className="material-icons text-sm">close</span>
                    </button>
                  </div>
                  
                  {/* Kart içeriği - TFT stilinde */}
                  <div className="bg-gradient-to-b from-slate-800 to-slate-900 p-3 border border-slate-700/50">
                    <div className="bg-slate-800/50 rounded-md p-2 border border-amber-700/30 mb-3 shadow-inner shadow-amber-900/30">
                      <p className="text-xs text-amber-100/80">
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
                        className={`overflow-hidden rounded-lg flex flex-col items-center justify-between ${
                          featherColorSelected === "green" 
                            ? "ring-2 ring-green-400 shadow-lg shadow-green-900/40 scale-105 transform" 
                            : "hover:ring-1 hover:ring-green-400/50"
                        } transition-all duration-200`}
                        onClick={() => {
                          playClick();
                          setFeatherColorSelected("green");
                        }}
                      >
                        <div className="h-16 w-full bg-gradient-to-b from-green-600/20 to-green-900/60 p-2 flex items-center justify-center relative">
                          <FeatherViewer 
                            color="green" 
                            scale={0.5} 
                            rotate={true}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-green-900/90 to-transparent"></div>
                          <div className="absolute bottom-1 right-1 bg-green-800/80 text-green-200 px-1.5 py-0.5 rounded-sm text-[10px] font-bold border border-green-600/60 shadow-sm">{player.island.featherInventory.green}</div>
                        </div>
                        <div className="bg-green-900 w-full py-1 text-[10px] text-green-100 font-medium text-center">CAN</div>
                      </button>
                      
                      <button
                        className={`overflow-hidden rounded-lg flex flex-col items-center justify-between ${
                          featherColorSelected === "blue" 
                            ? "ring-2 ring-blue-400 shadow-lg shadow-blue-900/40 scale-105 transform" 
                            : "hover:ring-1 hover:ring-blue-400/50"
                        } transition-all duration-200`}
                        onClick={() => {
                          playClick();
                          setFeatherColorSelected("blue");
                        }}
                      >
                        <div className="h-16 w-full bg-gradient-to-b from-blue-600/20 to-blue-900/60 p-2 flex items-center justify-center relative">
                          <FeatherViewer 
                            color="blue" 
                            scale={0.5} 
                            rotate={true}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 to-transparent"></div>
                          <div className="absolute bottom-1 right-1 bg-blue-800/80 text-blue-200 px-1.5 py-0.5 rounded-sm text-[10px] font-bold border border-blue-600/60 shadow-sm">{player.island.featherInventory.blue}</div>
                        </div>
                        <div className="bg-blue-900 w-full py-1 text-[10px] text-blue-100 font-medium text-center">HIZ</div>
                      </button>
                      
                      <button
                        className={`overflow-hidden rounded-lg flex flex-col items-center justify-between ${
                          featherColorSelected === "orange" 
                            ? "ring-2 ring-orange-400 shadow-lg shadow-orange-900/40 scale-105 transform" 
                            : "hover:ring-1 hover:ring-orange-400/50"
                        } transition-all duration-200`}
                        onClick={() => {
                          playClick();
                          setFeatherColorSelected("orange");
                        }}
                      >
                        <div className="h-16 w-full bg-gradient-to-b from-orange-600/20 to-orange-900/60 p-2 flex items-center justify-center relative">
                          <FeatherViewer 
                            color="orange" 
                            scale={0.5} 
                            rotate={true}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-orange-900/90 to-transparent"></div>
                          <div className="absolute bottom-1 right-1 bg-orange-800/80 text-orange-200 px-1.5 py-0.5 rounded-sm text-[10px] font-bold border border-orange-600/60 shadow-sm">{player.island.featherInventory.orange}</div>
                        </div>
                        <div className="bg-orange-900 w-full py-1 text-[10px] text-orange-100 font-medium text-center">SALDIRI</div>
                      </button>
                    </div>
                    
                    {/* TFT Stil Birleştirme Butonu */}
                    <div className="mt-2 relative">
                      {featherColorSelected ? (
                        <button
                          className={`w-full py-2 rounded-md font-bold text-sm flex items-center justify-center ${
                            player.island.featherInventory[featherColorSelected] >= 3
                              ? "bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-white shadow-md transform hover:scale-105 transition-all duration-200"
                              : "bg-gray-800/70 text-gray-500 cursor-not-allowed"
                          } overflow-hidden`}
                          onClick={() => {
                            if (player.island.featherInventory[featherColorSelected] >= 3) {
                              handleCombineFeathers(featherColorSelected);
                            }
                          }}
                        >
                          <div className="absolute inset-0 overflow-hidden">
                            <div className="absolute inset-0 opacity-20 bg-[url(https://i.imgur.com/m9dKmPQ.png)] bg-cover"></div>
                          </div>
                          <div className="z-10 flex items-center">
                            <span className="material-icons mr-2 text-sm">auto_awesome</span>
                            <span>3 Tüyü Birleştir</span>
                          </div>
                          {player.island.featherInventory[featherColorSelected] >= 3 && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-300 to-yellow-500 animate-pulse"></div>
                          )}
                        </button>
                      ) : (
                        <div className="text-center text-gray-400 text-xs italic border border-gray-700/50 rounded-md py-2">
                          Birleştirmek için bir tüy rengi seçin
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Yumurta yönetimi paneli - TFT Tarzı */}
            {buildingSelected === "eggs" && (
              <div className="absolute top-20 right-5 z-10">
                <div className="rounded-lg shadow-2xl w-72 overflow-hidden transform transition-all duration-300">
                  {/* Başlık şeridi */}
                  <div className="bg-gradient-to-r from-blue-700 to-blue-900 p-2 border-b border-blue-500/50 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-blue-100 flex items-center">
                      <span className="material-icons text-blue-300 mr-2 text-sm">egg</span>
                      Yumurta Yönetimi
                    </h3>
                    <button 
                      onClick={() => setBuildingSelected(null)} 
                      className="text-blue-300 hover:text-blue-100"
                    >
                      <span className="material-icons text-sm">close</span>
                    </button>
                  </div>
                  
                  {/* Kart içeriği - TFT stilinde */}
                  <div className="bg-gradient-to-b from-slate-800 to-slate-900 p-3 border border-slate-700/50">
                    <div className="bg-slate-800/50 rounded-md p-2 border border-blue-700/30 mb-3 shadow-inner shadow-blue-900/30">
                      <p className="text-xs text-blue-100/80">
                        Yumurtalardan askerlerinize güçlendirme sağlayan bonuslar elde edin:
                        <span className="block mt-1 ml-2">• Yeşil: +20 Can tüm askerlere</span>
                        <span className="block ml-2">• Mavi: +20% Saldırı hızı tüm askerlere</span>
                        <span className="block ml-2">• Turuncu: +20 Saldırı gücü tüm askerlere</span>
                      </p>
                    
                    </div>

                    {/* Yumurta Oluşturma Butonu - TFT Stili */}
                    {player.island.resources.eggs > 0 && featherColorSelected && (
                      <div className="mb-3 mt-4">
                        <button
                          className="relative w-full py-2 rounded-md overflow-hidden group"
                          onClick={() => handleHatchEgg(featherColorSelected)}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800 group-hover:from-blue-500 group-hover:to-blue-700 transition-all duration-300"></div>
                          <div className="absolute inset-0 opacity-10 bg-[url(https://i.imgur.com/W4M5qMW.png)] bg-cover"></div>
                          <div className="relative flex items-center justify-center text-white font-bold text-sm">
                            <span className="material-icons text-sm mr-2">egg</span>
                            <span>{getFeatherColorName(featherColorSelected)} Yumurta Oluştur</span>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-300 to-indigo-500 animate-pulse"></div>
                        </button>
                      </div>
                    )}
                    
                    {/* Yumurta Sayısı Göstergesi */}
                    <div className="flex items-center justify-between mb-4 bg-blue-900/30 rounded-md px-3 py-2 border border-blue-800/40">
                      <div className="flex items-center">
                        <span className="material-icons text-blue-400 mr-2">inventory_2</span>
                        <span className="text-sm text-blue-200">Mevcut Yumurtalar:</span>
                      </div>
                      <div className="bg-blue-800/70 px-2 py-1 rounded-md text-white font-bold border border-blue-700/70">
                        {player.island.resources.eggs}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {Object.entries(player.island.hatchery).map(([slotId, slot]) => (
                        <div 
                          key={slotId}
                          className={`p-2 border rounded-lg flex flex-col items-center ${
                            slot.status === "empty"
                              ? "border-gray-600/30 bg-gray-800/20"
                              : slot.status === "incubating"
                                ? "border-blue-600/30 bg-blue-900/20"
                                : "border-green-600/30 bg-green-900/20"
                          } cursor-pointer relative`}
                          onClick={() => setSelectedHatcherySlot(slot)}
                        >
                          <div className="h-16 w-full">
                            {slot.status !== "empty" && slot.egg ? (
                              <EggViewer 
                                color={slot.egg?.color} 
                                scale={0.6} 
                                rotate={true}
                                isActive={slot.status === "ready"}
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <span className="material-icons text-gray-500 text-3xl">egg</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-2 w-full text-center">
                            {slot.status === "empty" ? (
                              <span className="text-gray-400 text-xs">Boş Yuva</span>
                            ) : slot.status === "incubating" && slot.egg ? (
                              <div>
                                <span className={`text-xs font-medium ${
                                  slot.egg?.color === "green" ? "text-green-400" : 
                                  slot.egg?.color === "blue" ? "text-blue-400" : 
                                  "text-orange-400"
                                }`}>
                                  Kuluçkada
                                </span>
                                <div className={`mt-1 px-2 py-0.5 rounded-full text-xs flex items-center justify-center ${
                                  slot.egg?.color === "green" 
                                    ? "bg-green-900/50 text-green-300" : 
                                  slot.egg?.color === "blue" 
                                    ? "bg-blue-900/50 text-blue-300" : 
                                  "bg-orange-900/50 text-orange-300"
                                }`}>
                                  <span className="material-icons text-xs mr-1">
                                    {slot.egg?.color === "green" ? "favorite" :
                                     slot.egg?.color === "blue" ? "speed" :
                                     "bolt"}
                                  </span>
                                  <span className="flex-1">
                                    {slot.egg?.color === "green" ? "+20 Can" :
                                     slot.egg?.color === "blue" ? "+20% Hız" :
                                     "+20 Saldırı"}
                                  </span>
                                </div>
                              </div>
                            ) : slot.status === "ready" && slot.egg ? (
                              <div>
                                <span className={`text-xs font-medium ${
                                  slot.egg?.color === "green" ? "text-green-400" : 
                                  slot.egg?.color === "blue" ? "text-blue-400" : 
                                  "text-orange-400"
                                }`}>
                                  Hazır!
                                </span>
                                <button 
                                  className={`mt-1 px-3 py-1 rounded-lg text-xs w-full flex items-center justify-center ${
                                    slot.egg?.color === "green" 
                                      ? "bg-green-700 hover:bg-green-600 text-white" : 
                                    slot.egg?.color === "blue" 
                                      ? "bg-blue-700 hover:bg-blue-600 text-white" : 
                                    "bg-orange-700 hover:bg-orange-600 text-white"
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Yumurtadan asker çıkarmak yerine tüm askerlere bonus uygula
                                    handleActivateEgg(slotId);
                                    // Bonus uygulandığı için kullanıcıya bilgi ver
                                    alert(`${getFeatherColorName(slot.egg?.color || "green")} yumurtadan sağlanan bonus tüm askerlerinize uygulandı!`);
                                  }}
                                >
                                  <span className="material-icons text-xs mr-1">bolt</span>
                                  Aktifleştir
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Alt panel - Asker yönetimi için */}
        <div className="fixed bottom-0 left-0 right-0 h-24 pointer-events-auto">
          <div className="bg-gradient-to-t from-slate-900/95 to-slate-900/85 backdrop-blur-sm border-t border-slate-700/50 h-full shadow-lg">
            <div className="mx-auto max-w-7xl h-full flex items-center justify-between px-4">
              {/* Birimler ve yönetim */}
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center bg-slate-800/60 rounded-md p-2 border border-slate-600/40">
                  <div className="flex items-center space-x-2">
                    <div className="w-12 h-12 bg-slate-800 rounded-md flex items-center justify-center border border-blue-400/30">
                      <span className="material-icons text-blue-400">shield</span>
                    </div>
                    <div>
                      <h4 className="text-xs text-blue-300 font-medium">Tavus Askerleri</h4>
                      <p className="text-lg font-bold text-white">{peacockWarriorCount}</p>
                    </div>
                  </div>
                  <div className="text-[10px] text-blue-200/80 mt-1">
                    Saha: {player.island.units.filter((u: Unit) => u.type === "warrior" && u.isDeployed).length} / {player.island.units.filter((u: Unit) => u.type === "warrior").length}
                  </div>
                </div>
                
                <div className="flex flex-col items-center bg-slate-800/60 rounded-md p-2 border border-slate-600/40">
                  <div className="flex items-center space-x-2">
                    <div className="w-12 h-12 bg-slate-800 rounded-md flex items-center justify-center border border-amber-400/30">
                      <span className="material-icons text-amber-400">person_outline</span>
                    </div>
                    <div>
                      <h4 className="text-xs text-amber-300 font-medium">İnsan Askerleri</h4>
                      <p className="text-lg font-bold text-white">{humanSoldierCount}</p>
                    </div>
                  </div>
                  <div className="text-[10px] text-amber-200/80 mt-1">
                    Saha: {player.island.units.filter((u: Unit) => u.type === "soldier" && u.isDeployed).length} / {player.island.units.filter((u: Unit) => u.type === "soldier").length}
                  </div>
                </div>
                
                {/* Asker Kartları Açma Butonu */}
                <button
                  onClick={() => setShowUnitCards(!showUnitCards)}
                  className="px-3 py-2 bg-gradient-to-b from-indigo-700 to-indigo-900 border border-indigo-500/50 rounded-md text-sm text-indigo-200 font-medium flex items-center transition hover:bg-gradient-to-b hover:from-indigo-600 hover:to-indigo-800"
                >
                  <span className="material-icons text-sm mr-1">
                    {showUnitCards ? "visibility_off" : "visibility"}
                  </span>
                  {showUnitCards ? "Kartları Gizle" : "Askerleri Göster"}
                </button>
              </div>
              
              {/* Hazırlık Ipuçları */}
              <div className="w-96 h-16 bg-slate-800/60 rounded-md border border-slate-600/40 p-2">
                <h4 className="text-xs text-slate-300 font-medium flex items-center">
                  <span className="material-icons text-xs mr-1">tips_and_updates</span>
                  İPUCU
                </h4>
                <p className="text-xs text-slate-300/80 mt-1">
                  Askerlerinizi savaş alanına yerleştirmek için, önce "Askerleri Göster" butonuna tıklayın, 
                  sonra onları haritadaki mavi alanlara sürükleyin.
                </p>
              </div>
              
              {/* Düğmeler */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    playClick();
                    trainSoldiers(player.id, 1);
                    setActionLog(prev => [...prev, "Yeni asker eğitildi!"]);
                  }}
                  disabled={player.island.gold < 5}
                  className={`px-3 py-2 bg-gradient-to-b from-amber-800 to-amber-900 border border-amber-600/50 rounded-md text-sm text-amber-200 font-medium flex items-center transition hover:bg-gradient-to-b hover:from-amber-700 hover:to-amber-800 ${player.island.gold < 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="material-icons text-sm mr-1">person_add</span>
                  Asker Eğit (5 Altın)
                </button>
                
                <button
                  onClick={() => {
                    playClick();
                    updatePreparationTime(-preparationTimeLeft); // Zamanı bitir
                    setActionLog(prev => [...prev, "Savaş fazı başlatıldı!"]);
                  }}
                  className="px-3 py-2 bg-gradient-to-b from-red-800 to-red-900 border border-red-600/50 rounded-md text-sm text-red-200 font-medium flex items-center transition hover:bg-gradient-to-b hover:from-red-700 hover:to-red-800"
                >
                  <span className="material-icons text-sm mr-1">swords</span>
                  Savaşa Başla
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Asker Kartları Paneli */}
        {showUnitCards && (
          <div className="fixed top-1/2 left-4 transform -translate-y-1/2 w-52 max-h-[70vh] overflow-y-auto pointer-events-auto">
            <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 rounded-lg shadow-xl p-3">
              <h3 className="text-white font-bold text-lg mb-3 flex items-center">
                <span className="material-icons text-amber-400 mr-2">military_tech</span>
                Askerleriniz
              </h3>
              
              {player.island.units.length === 0 ? (
                <p className="text-slate-400 text-sm mb-2">Henüz askeriniz yok. "Asker Eğit" butonuna tıklayarak asker alabilirsiniz.</p>
              ) : (
                <div className="space-y-4">
                  {/* Tavuskuşu Askerleri */}
                  {peacockWarriors.length > 0 && (
                    <div>
                      <h4 className="text-blue-300 text-sm font-medium mb-2">Tavuskuşu Askerleri</h4>
                      <div className="space-y-2">
                        {peacockWarriors.map((unit: Unit) => (
                          <div key={unit.id} className="transition-transform transform hover:scale-[1.02]">
                            <div 
                              className={`cursor-grab ${unit.isDeployed ? 'opacity-60' : ''}`}
                              onMouseDown={() => {
                                if (!unit.isDeployed) {
                                  setDraggedUnit(unit);
                                  playClick();
                                }
                              }}
                            >
                              <UnitCard 
                                unit={unit} 
                                isDragging={draggedUnit?.id === unit.id} 
                                onDragStart={() => {}} 
                                onDragEnd={() => {}} 
                                isDeployed={unit.isDeployed}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* İnsan Askerleri */}
                  {humanSoldiers.length > 0 && (
                    <div>
                      <h4 className="text-amber-300 text-sm font-medium mb-2">İnsan Askerleri</h4>
                      <div className="space-y-2">
                        {humanSoldiers.map((unit: Unit) => (
                          <div key={unit.id} className="transition-transform transform hover:scale-[1.02]">
                            <div 
                              className={`cursor-grab ${unit.isDeployed ? 'opacity-60' : ''}`}
                              onMouseDown={() => {
                                if (!unit.isDeployed) {
                                  setDraggedUnit(unit);
                                  playClick();
                                }
                              }}
                            >
                              <UnitCard 
                                unit={unit} 
                                isDragging={draggedUnit?.id === unit.id} 
                                onDragStart={() => {}} 
                                onDragEnd={() => {}} 
                                isDeployed={unit.isDeployed}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreparationPhase;