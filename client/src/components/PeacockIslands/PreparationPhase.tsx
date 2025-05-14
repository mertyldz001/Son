import { useEffect, useState } from "react";
import { usePeacockIslandsStore } from "../../lib/stores/usePeacockIslandsStore";
import { FeatherColor, BuildingType } from "../../lib/game/peacockIslands/types";
import GameBoard3D from "./GameBoard3D";

const PreparationPhase = () => {
  const { 
    player,
    npc,
    preparationTimeLeft,
    updatePreparationTime,
    collectFeathers,
    trainSoldiers,
    upgradeBuilding,
    combineFeathers,
    hatchEgg,
    performNpcActions
  } = usePeacockIslandsStore();
  
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [featherAmount, setFeatherAmount] = useState(1);
  const [soldierAmount, setSoldierAmount] = useState(1);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingType | null>(null);
  const [selectedFeatherColor, setSelectedFeatherColor] = useState<FeatherColor>("red");
  
  // Süreyi güncelle
  useEffect(() => {
    const interval = setInterval(() => {
      updatePreparationTime(1); // Her saniye 1 azalt
    }, 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, [updatePreparationTime]);
  
  // NPC eylemleri
  useEffect(() => {
    const interval = setInterval(() => {
      performNpcActions();
    }, 10000); // Her 10 saniyede bir NPC eylem yapsın
    
    return () => {
      clearInterval(interval);
    };
  }, [performNpcActions]);
  
  // Tüy topla
  const handleCollectFeathers = () => {
    collectFeathers(player.id, featherAmount);
  };
  
  // Asker eğit
  const handleTrainSoldiers = () => {
    trainSoldiers(player.id, soldierAmount);
  };
  
  // Bina yükselt
  const handleUpgradeBuilding = (buildingId: string) => {
    upgradeBuilding(player.id, buildingId);
  };
  
  // Tüyleri birleştir
  const handleCombineFeathers = () => {
    combineFeathers(player.id, [selectedFeatherColor, selectedFeatherColor, selectedFeatherColor]);
  };
  
  // Yumurta kuluçkala
  const handleHatchEgg = () => {
    hatchEgg(player.id);
  };
  
  return (
    <div className="w-full h-full relative">
      {/* 3D Game Board as background */}
      <GameBoard3D />
      
      <div className="absolute inset-0 z-10 p-4 pointer-events-none">
        {/* Üst panel - Süre ve genel bilgiler */}
        <div className="bg-gray-800/90 p-4 rounded-lg mb-4 flex justify-between items-center pointer-events-auto">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-white">Hazırlık Fazı</h2>
            <p className="text-sm text-gray-300">Kaynaklarınızı toplayın ve adanızı güçlendirin</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-purple-900/90 px-4 py-2 rounded-md flex items-center text-white">
              <span className="material-icons mr-2">timer</span>
              <span className="font-bold">{preparationTimeLeft} saniye</span>
            </div>
            
            <div className="bg-yellow-800/90 px-4 py-2 rounded-md flex items-center text-white">
              <span className="material-icons mr-2">star</span>
              <span className="font-bold">Tur: {player.island.resources.gold}</span>
            </div>
          </div>
        </div>
        
        {/* Ana içerik - Ada bilgileri ve eylemler */}
        <div className="flex gap-4 h-3/4 pointer-events-auto">
          {/* Sol panel - Ada ve kaynaklar */}
          <div className="w-1/3 bg-gray-800/90 rounded-lg p-4 flex flex-col text-white">
            <h3 className="text-lg font-bold mb-2">{player.island.name}</h3>
            
            <div className="bg-gray-700/90 rounded-md p-3 mb-4">
              <h4 className="text-md font-semibold mb-2">Kaynaklar</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-yellow-900/60 p-2 rounded text-center">
                  <div className="text-yellow-400 font-bold">{player.island.resources.gold}</div>
                  <div className="text-xs">Altın</div>
                </div>
                <div className="bg-blue-900/60 p-2 rounded text-center">
                  <div className="text-blue-400 font-bold">{player.island.resources.feathers}</div>
                  <div className="text-xs">Tüy</div>
                </div>
                <div className="bg-green-900/60 p-2 rounded text-center">
                  <div className="text-green-400 font-bold">{player.island.resources.eggs}</div>
                  <div className="text-xs">Yumurta</div>
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
                  <div className="text-purple-400 font-bold">{player.island.army.power}</div>
                  <div className="text-xs">Güç</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-700/90 rounded-md p-3 flex-1 overflow-auto">
              <h4 className="text-md font-semibold mb-2">Binalar</h4>
              <div className="space-y-2">
                {player.island.buildings.map(building => (
                  <div key={building.id} className="bg-gray-800/90 p-2 rounded flex justify-between items-center">
                    <div>
                      <div className="font-medium">
                        {building.type === "barracks" && "Kışla"}
                        {building.type === "mine" && "Maden"}
                        {building.type === "hatchery" && "Kuluçka"}
                      </div>
                      <div className="text-xs text-gray-400">Seviye {building.level} • Üretim {building.productionRate}</div>
                    </div>
                    <button 
                      className="bg-yellow-800/90 hover:bg-yellow-700 px-2 py-1 rounded text-xs"
                      onClick={() => handleUpgradeBuilding(building.id)}
                    >
                      Yükselt ({building.level * 30} Altın)
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Orta panel - Eylemler */}
          <div className="flex-1 bg-gray-800/90 rounded-lg p-4 flex flex-col text-white">
            <h3 className="text-lg font-bold mb-2">Eylemler</h3>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button 
                className={`p-3 rounded-md text-left ${selectedAction === "collectFeathers" ? "bg-blue-900/90" : "bg-gray-700/90 hover:bg-gray-600"}`}
                onClick={() => setSelectedAction("collectFeathers")}
              >
                <div className="font-medium">Tüy Topla</div>
                <div className="text-xs text-gray-300">Maden işçilerine ödeme yaparak tüy toplayın</div>
              </button>
              
              <button 
                className={`p-3 rounded-md text-left ${selectedAction === "trainSoldiers" ? "bg-blue-900/90" : "bg-gray-700/90 hover:bg-gray-600"}`}
                onClick={() => setSelectedAction("trainSoldiers")}
              >
                <div className="font-medium">Asker Eğit</div>
                <div className="text-xs text-gray-300">Adanızı koruyacak askerler yetiştirin</div>
              </button>
              
              <button 
                className={`p-3 rounded-md text-left ${selectedAction === "combineFeathers" ? "bg-blue-900/90" : "bg-gray-700/90 hover:bg-gray-600"}`}
                onClick={() => setSelectedAction("combineFeathers")}
              >
                <div className="font-medium">Tüyleri Birleştir</div>
                <div className="text-xs text-gray-300">3 aynı renk tüyü birleştirerek yumurta elde edin</div>
              </button>
              
              <button 
                className={`p-3 rounded-md text-left ${selectedAction === "hatchEgg" ? "bg-blue-900/90" : "bg-gray-700/90 hover:bg-gray-600"}`}
                onClick={() => setSelectedAction("hatchEgg")}
              >
                <div className="font-medium">Yumurta Kuluçkala</div>
                <div className="text-xs text-gray-300">Yumurtayı kuluçkaya yatırarak güç kazanın</div>
              </button>
            </div>
            
            {/* Seçili eyleme göre formlar */}
            {selectedAction === "collectFeathers" && (
              <div className="bg-gray-700/90 p-4 rounded-md">
                <h4 className="font-medium mb-2">Tüy Topla</h4>
                <p className="text-sm text-gray-300 mb-4">Her tüy için 0.5 altın harcarsınız.</p>
                
                <div className="flex items-center gap-2 mb-4">
                  <label className="text-sm">Miktar:</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="100"
                    value={featherAmount}
                    onChange={(e) => setFeatherAmount(parseInt(e.target.value))}
                    className="bg-gray-600/90 px-2 py-1 rounded w-20 text-white"
                  />
                  <span className="text-sm text-gray-400">Maliyet: {featherAmount * 0.5} altın</span>
                </div>
                
                <button 
                  className="bg-blue-700/90 hover:bg-blue-600 px-4 py-2 rounded w-full"
                  onClick={handleCollectFeathers}
                >
                  Tüy Topla
                </button>
              </div>
            )}
            
            {selectedAction === "trainSoldiers" && (
              <div className="bg-gray-700/90 p-4 rounded-md">
                <h4 className="font-medium mb-2">Asker Eğit</h4>
                <p className="text-sm text-gray-300 mb-4">Her asker 5 altın maliyetinde ve 10 güç değerindedir.</p>
                
                <div className="flex items-center gap-2 mb-4">
                  <label className="text-sm">Miktar:</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="100"
                    value={soldierAmount}
                    onChange={(e) => setSoldierAmount(parseInt(e.target.value))}
                    className="bg-gray-600/90 px-2 py-1 rounded w-20 text-white"
                  />
                  <span className="text-sm text-gray-400">Maliyet: {soldierAmount * 5} altın</span>
                </div>
                
                <button 
                  className="bg-blue-700/90 hover:bg-blue-600 px-4 py-2 rounded w-full"
                  onClick={handleTrainSoldiers}
                >
                  Asker Eğit
                </button>
              </div>
            )}
            
            {selectedAction === "combineFeathers" && (
              <div className="bg-gray-700/90 p-4 rounded-md">
                <h4 className="font-medium mb-2">Tüyleri Birleştir</h4>
                <p className="text-sm text-gray-300 mb-4">3 aynı renk tüy 1 yumurta oluşturur.</p>
                
                <div className="flex items-center gap-2 mb-4">
                  <label className="text-sm">Tüy Rengi:</label>
                  <select 
                    value={selectedFeatherColor}
                    onChange={(e) => setSelectedFeatherColor(e.target.value as FeatherColor)}
                    className="bg-gray-600/90 px-2 py-1 rounded text-white"
                  >
                    <option value="red">Kırmızı</option>
                    <option value="blue">Mavi</option>
                    <option value="green">Yeşil</option>
                    <option value="purple">Mor</option>
                    <option value="gold">Altın</option>
                  </select>
                </div>
                
                <button 
                  className="bg-blue-700/90 hover:bg-blue-600 px-4 py-2 rounded w-full"
                  onClick={handleCombineFeathers}
                  disabled={player.island.resources.feathers < 3}
                >
                  Tüyleri Birleştir
                </button>
              </div>
            )}
            
            {selectedAction === "hatchEgg" && (
              <div className="bg-gray-700/90 p-4 rounded-md">
                <h4 className="font-medium mb-2">Yumurta Kuluçkala</h4>
                <p className="text-sm text-gray-300 mb-4">Her yumurta 20 güç kazandırır.</p>
                
                <button 
                  className="bg-blue-700/90 hover:bg-blue-600 px-4 py-2 rounded w-full"
                  onClick={handleHatchEgg}
                  disabled={player.island.resources.eggs < 1}
                >
                  Yumurta Kuluçkala
                </button>
              </div>
            )}
          </div>
          
          {/* Sağ panel - Rakip adası */}
          <div className="w-1/4 bg-gray-800/90 rounded-lg p-4 flex flex-col text-white">
            <h3 className="text-lg font-bold mb-2">{npc.name} Adası</h3>
            
            <div className="bg-gray-700/90 rounded-md p-3 mb-4">
              <h4 className="text-md font-semibold mb-2">Kaynaklar</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-yellow-900/60 p-2 rounded text-center">
                  <div className="text-yellow-400 font-bold">{npc.island.resources.gold}</div>
                  <div className="text-xs">Altın</div>
                </div>
                <div className="bg-blue-900/60 p-2 rounded text-center">
                  <div className="text-blue-400 font-bold">{npc.island.resources.feathers}</div>
                  <div className="text-xs">Tüy</div>
                </div>
                <div className="bg-green-900/60 p-2 rounded text-center">
                  <div className="text-green-400 font-bold">{npc.island.resources.eggs}</div>
                  <div className="text-xs">Yumurta</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-700/90 rounded-md p-3 mb-4">
              <h4 className="text-md font-semibold mb-2">Ordu</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-red-900/60 p-2 rounded text-center">
                  <div className="text-red-400 font-bold">{npc.island.army.soldiers}</div>
                  <div className="text-xs">Asker</div>
                </div>
                <div className="bg-purple-900/60 p-2 rounded text-center">
                  <div className="text-purple-400 font-bold">{npc.island.army.power}</div>
                  <div className="text-xs">Güç</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-700/90 rounded-md p-3 flex-1 overflow-auto">
              <h4 className="text-md font-semibold mb-2">Binalar</h4>
              <div className="space-y-2">
                {npc.island.buildings.map(building => (
                  <div key={building.id} className="bg-gray-800/90 p-2 rounded">
                    <div className="font-medium">
                      {building.type === "barracks" && "Kışla"}
                      {building.type === "mine" && "Maden"}
                      {building.type === "hatchery" && "Kuluçka"}
                    </div>
                    <div className="text-xs text-gray-400">Seviye {building.level} • Üretim {building.productionRate}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreparationPhase;