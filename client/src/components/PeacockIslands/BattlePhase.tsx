import { useEffect, useState } from "react";
import { usePeacockIslandsStore } from "../../lib/stores/usePeacockIslandsStore";
import { useAudio } from "../../lib/stores/useAudio";
import { getEnemyTypeName, getEnemyTypeDescription } from "../../lib/game/peacockIslands/enemies";
import { PeacockEnemy, BattleResult, FeatherInventory } from "../../lib/game/peacockIslands/types";
import { getFeatherColorName } from "../../lib/game/peacockIslands/battle";
import GameBoard3D from "./GameBoard3D";

const BattlePhase = () => {
  const { player, npc, currentEnemyWave, endBattlePhase, processBattle } = usePeacockIslandsStore();
  const { playHit, playSuccess } = useAudio();
  
  const [battleProgress, setBattleProgress] = useState(0);
  const [battleResult, setBattleResult] = useState<"pending" | "victory" | "defeat">("pending");
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [battleEffects, setBattleEffects] = useState<string[]>([]);
  const [collectedFeathers, setCollectedFeathers] = useState<FeatherInventory | null>(null);
  const [defeatedEnemies, setDefeatedEnemies] = useState<PeacockEnemy[]>([]);
  
  // Savaş simülasyonu
  useEffect(() => {
    if (!currentEnemyWave) return;
    
    // Savaş başlangıcında etkileşim engelleme
    const battleDelay = 1000; // 1 saniye bekle
    
    // Zamanlanmış savaş simülasyonu
    const timer = setTimeout(() => {
      // Savaş mekaniği ve tüy kazanımı
      const result = processBattle();
      
      // Savaş logu ekle
      setBattleLog(prev => [
        ...prev, 
        `Savaş başladı! Oyuncu ordusu: ${player.island.army.soldiers} asker, 
        Düşman: ${currentEnemyWave.enemies.length} Tavus Kuşu`
      ]);
      
      playHit(); // Savaş sesi çal
      
      // Savaş efektleri
      setBattleEffects(prev => [...prev, "attack"]);
      
      // Eğer düşmanlar yenildi ise
      if (result.enemiesDefeated > 0) {
        const defeatedCount = Math.min(
          result.enemiesDefeated,
          currentEnemyWave.enemies.length
        );
        
        // Yenilen düşmanları kaydet
        const defeated = currentEnemyWave.enemies.slice(0, defeatedCount);
        setDefeatedEnemies(defeated);
        
        // Toplanan tüyleri göster
        setCollectedFeathers(result.feathersCollected);
      }
      
      // Savaş simülasyonu - adım adım göster
      let currentProgress = 0;
      const battleInterval = setInterval(() => {
        currentProgress += 10;
        setBattleProgress(currentProgress);
        
        // İlerlemeye göre olay gönder
        if (currentProgress % 25 === 0) {
          playHit();
          setBattleEffects(prev => [...prev, "hit"]);
          
          // Olay tipine göre log mesajı
          if (currentProgress === 25) {
            setBattleLog(prev => [
              ...prev,
              "Savaşçılar düşmanlara saldırıyor!"
            ]);
          } else if (currentProgress === 50) {
            if (currentEnemyWave.enemies.length > 0) {
              const enemy = currentEnemyWave.enemies[0];
              setBattleLog(prev => [
                ...prev,
                `${getEnemyTypeName(enemy.type)} karşılık veriyor!`
              ]);
            }
          } else if (currentProgress === 75) {
            setBattleLog(prev => [
              ...prev,
              "Son darbeye hazırlanıyor..."
            ]);
          }
        }
        
        if (currentProgress >= 100) {
          clearInterval(battleInterval);
          
          // Savaş sonucu
          const victorious = result.playerVictory;
          
          if (victorious) {
            playSuccess(); // Zafer sesi çal
            setBattleResult("victory");
            setBattleEffects(prev => [...prev, "victory"]);
            
            // Toplamı göster
            let featherText = "";
            if (collectedFeathers) {
              const totalFeathers = 
                collectedFeathers.green + 
                collectedFeathers.blue + 
                collectedFeathers.orange;
                
              featherText = `${totalFeathers} tüy kazandınız! (${
                collectedFeathers.green > 0 ? `${collectedFeathers.green} yeşil, ` : ""}${
                collectedFeathers.blue > 0 ? `${collectedFeathers.blue} mavi, ` : ""}${
                collectedFeathers.orange > 0 ? `${collectedFeathers.orange} turuncu` : ""}
              )`;
            }
            
            setBattleLog(prev => [
              ...prev, 
              `Zafer! ${result.enemiesDefeated} düşmanı yendiniz.`,
              featherText
            ]);
            
            // 3 saniye sonra bir sonraki faza geç
            setTimeout(() => {
              endBattlePhase(true);
            }, 3000);
          } else {
            playHit(); // Yenilgi sesi
            setBattleResult("defeat");
            setBattleEffects(prev => [...prev, "defeat"]);
            setBattleLog(prev => [
              ...prev, 
              "Yenilgi! Düşman tavus kuşları çok güçlüydü.",
              "Adanız talan edildi ve kontrolü kaybettiniz."
            ]);
            
            // 3 saniye sonra bir sonraki faza geç
            setTimeout(() => {
              endBattlePhase(false);
            }, 3000);
          }
        }
      }, 500); // Her 500ms'de ilerleme
      
      return () => {
        clearInterval(battleInterval);
      };
    }, battleDelay);
    
    return () => {
      clearTimeout(timer);
    };
  }, [currentEnemyWave, player.island.army, endBattlePhase, playHit, playSuccess, processBattle]);
  
  return (
    <div className="w-full h-full relative">
      {/* 3D Game Board as background */}
      <GameBoard3D />
      
      {/* UI Overlays */}
      <div className="absolute inset-0 z-10 p-4 pointer-events-none">
        {/* Üst panel - Savaş bilgileri */}
        <div className="bg-gray-800/90 p-4 rounded-lg mb-4 flex justify-between items-center pointer-events-auto">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-white">Savaş Fazı</h2>
            <p className="text-sm text-gray-300">Düşman dalgası adanıza saldırıyor!</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-red-900/90 px-4 py-2 rounded-md flex items-center text-white">
              <span className="material-icons mr-2">warning</span>
              <span className="font-bold">
                {currentEnemyWave ? `Düşman Seviyesi: ${currentEnemyWave.level}` : "Hazırlanıyor..."}
              </span>
            </div>
          </div>
        </div>
        
        {/* Ana içerik - Savaş alanı */}
        <div className="flex gap-4 h-3/4 pointer-events-auto">
          {/* Sol panel - Oyuncu bilgileri */}
          <div className="w-1/4 bg-gray-800/90 rounded-lg p-4 flex flex-col text-white">
            <h3 className="text-lg font-bold mb-2">{player.island.name}</h3>
            
            {/* Ordu Gücü - Açılır panel */}
            <div className="bg-gray-700/90 rounded-md p-3 mb-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-md font-semibold">Ordu Gücü</h4>
                <button 
                  className="text-gray-300 hover:text-white"
                  onClick={() => setBattleEffects(prev => 
                    prev.includes("showArmy") ? 
                    prev.filter(e => e !== "showArmy") : 
                    [...prev, "showArmy"])
                  }
                >
                  <span className="material-icons">
                    {battleEffects.includes("showArmy") ? "expand_less" : "expand_more"}
                  </span>
                </button>
              </div>
              
              {battleEffects.includes("showArmy") ? (
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
              ) : (
                <div className="text-xs text-gray-300">
                  Ordunuzun asker sayısı ve gücünü gösterir. Detaylar için tıklayın.
                </div>
              )}
            </div>
            
            {/* Bonuslar - Açılır panel */}
            <div className="bg-gray-700/90 rounded-md p-3 mb-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-md font-semibold">Bonuslar</h4>
                <button 
                  className="text-gray-300 hover:text-white"
                  onClick={() => setBattleEffects(prev => 
                    prev.includes("showBonuses") ? 
                    prev.filter(e => e !== "showBonuses") : 
                    [...prev, "showBonuses"])
                  }
                >
                  <span className="material-icons">
                    {battleEffects.includes("showBonuses") ? "expand_less" : "expand_more"}
                  </span>
                </button>
              </div>
              
              {battleEffects.includes("showBonuses") ? (
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
                  Yumurtalardan kazandığınız kalıcı bonuslar. Detaylar için tıklayın.
                </div>
              )}
            </div>
            
            {/* Savaş efektleri */}
            {battleEffects.includes("attack") && (
              <div className="bg-yellow-600/40 mt-4 p-3 rounded-md text-center animate-pulse">
                <div className="material-icons text-3xl text-yellow-500">local_fire_department</div>
                <div className="text-yellow-500 font-bold">Savaşıyor!</div>
              </div>
            )}
            
            {battleEffects.includes("victory") && (
              <div className="bg-green-600/40 mt-4 p-3 rounded-md text-center animate-pulse">
                <div className="material-icons text-3xl text-green-500">military_tech</div>
                <div className="text-green-500 font-bold">Zafer!</div>
              </div>
            )}
            
            {battleEffects.includes("defeat") && (
              <div className="bg-red-600/40 mt-4 p-3 rounded-md text-center animate-pulse">
                <div className="material-icons text-3xl text-red-500">warning</div>
                <div className="text-red-500 font-bold">Mağlubiyet!</div>
              </div>
            )}
            
            {/* Toplanan tüyler */}
            {collectedFeathers && battleResult === "victory" && (
              <div className="bg-green-600/40 mt-4 p-3 rounded-md text-center">
                <h4 className="font-semibold mb-2">Toplanan Tüyler</h4>
                <div className="grid grid-cols-3 gap-2">
                  {collectedFeathers.green > 0 && (
                    <div className="bg-green-800/60 p-1 rounded text-center">
                      <div className="text-green-300 font-bold">{collectedFeathers.green}</div>
                      <div className="text-xs">Yeşil</div>
                    </div>
                  )}
                  {collectedFeathers.blue > 0 && (
                    <div className="bg-blue-800/60 p-1 rounded text-center">
                      <div className="text-blue-300 font-bold">{collectedFeathers.blue}</div>
                      <div className="text-xs">Mavi</div>
                    </div>
                  )}
                  {collectedFeathers.orange > 0 && (
                    <div className="bg-orange-800/60 p-1 rounded text-center">
                      <div className="text-orange-300 font-bold">{collectedFeathers.orange}</div>
                      <div className="text-xs">Turuncu</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Orta panel - Savaş alanı */}
          <div className="flex-1 bg-gray-800/90 rounded-lg p-4 flex flex-col text-white">
            <h3 className="text-lg font-bold mb-4 text-center">Savaş Alanı</h3>
            
            {/* Savaş ilerleme çubuğu */}
            <div className="bg-gray-700/90 h-8 rounded-full mb-4 overflow-hidden">
              <div 
                className={`h-full ${battleResult === "victory" ? "bg-green-600" : 
                  battleResult === "defeat" ? "bg-red-600" : "bg-blue-600"}`}
                style={{ width: `${battleProgress}%` }}
              ></div>
            </div>
            
            {/* Savaş sonucu */}
            {battleResult !== "pending" && (
              <div 
                className={`text-center text-xl font-bold mb-4 ${
                  battleResult === "victory" ? "text-green-400" : "text-red-400"
                }`}
              >
                {battleResult === "victory" ? "ZAFERİ KAZANDINIZ!" : "YENİLDİNİZ!"}
              </div>
            )}
            
            {/* Savaş animasyonu */}
            <div className="flex-1 relative mb-4 flex items-center justify-center">
              {battleProgress > 0 && battleProgress < 100 && (
                <div className="text-4xl font-bold animate-bounce">
                  {battleProgress < 33 ? "Savaş Başladı!" : 
                   battleProgress < 66 ? "Çarpışma Devam Ediyor!" : 
                   "Son Aşama!"}
                </div>
              )}
              
              {/* Savaş efektleri */}
              {battleEffects.includes("hit") && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-red-500/30 w-32 h-32 rounded-full animate-ping"></div>
                </div>
              )}
            </div>
            
            {/* Savaş logu */}
            <div className="h-1/3 bg-gray-900/50 rounded-md p-3 overflow-y-auto">
              <h4 className="text-md font-semibold mb-2">Savaş Logu</h4>
              <div className="space-y-1">
                {battleLog.map((log, index) => (
                  <div key={index} className="text-sm text-gray-300">{log}</div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Sağ panel - Düşman bilgileri */}
          <div className="w-1/4 bg-gray-800/90 rounded-lg p-4 flex flex-col text-white">
            <h3 className="text-lg font-bold mb-2">Düşman Dalgası</h3>
            
            {/* Saldırı Gücü - Açılır panel */}
            <div className="bg-gray-700/90 rounded-md p-3 mb-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-md font-semibold">Saldırı Gücü</h4>
                <button 
                  className="text-gray-300 hover:text-white"
                  onClick={() => setBattleEffects(prev => 
                    prev.includes("showEnemyPower") ? 
                    prev.filter(e => e !== "showEnemyPower") : 
                    [...prev, "showEnemyPower"])
                  }
                >
                  <span className="material-icons">
                    {battleEffects.includes("showEnemyPower") ? "expand_less" : "expand_more"}
                  </span>
                </button>
              </div>
              
              {battleEffects.includes("showEnemyPower") ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-red-900/60 p-2 rounded text-center">
                    <div className="text-red-400 font-bold">
                      {currentEnemyWave ? currentEnemyWave.enemies.length : "?"}
                    </div>
                    <div className="text-xs">Düşman</div>
                  </div>
                  <div className="bg-purple-900/60 p-2 rounded text-center">
                    <div className="text-purple-400 font-bold">
                      {currentEnemyWave ? currentEnemyWave.totalAttackPower : "?"}
                    </div>
                    <div className="text-xs">Saldırı</div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-300">
                  Düşmanların toplam sayısı ve saldırı gücü. Detaylar için tıklayın.
                </div>
              )}
            </div>
            
            {/* Düşman birlikleri - Açılır panel */}
            <div className="bg-gray-700/90 rounded-md p-3 mb-4 flex-1 overflow-auto">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-md font-semibold">Düşman Birlikleri</h4>
                <button 
                  className="text-gray-300 hover:text-white"
                  onClick={() => setBattleEffects(prev => 
                    prev.includes("showEnemyUnits") ? 
                    prev.filter(e => e !== "showEnemyUnits") : 
                    [...prev, "showEnemyUnits"])
                  }
                >
                  <span className="material-icons">
                    {battleEffects.includes("showEnemyUnits") ? "expand_less" : "expand_more"}
                  </span>
                </button>
              </div>
              
              {battleEffects.includes("showEnemyUnits") ? (
                <div className="space-y-2">
                  {currentEnemyWave && currentEnemyWave.enemies.map((enemy, index) => {
                    const isDefeated = defeatedEnemies.some(e => e.id === enemy.id);
                    return (
                      <div 
                        key={enemy.id} 
                        className={`bg-gray-800/90 p-2 rounded ${isDefeated ? 'opacity-50' : ''}`}
                      >
                        <div className="font-medium flex justify-between">
                          <span>{getEnemyTypeName(enemy.type)}</span>
                          <span className={isDefeated ? "line-through text-red-400" : "text-yellow-400"}>
                            {isDefeated ? "Yenildi" : "Savaşıyor"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 mt-1">
                          <div className="bg-red-900/40 p-1 rounded text-xs text-center">
                            HP: {enemy.health}
                          </div>
                          <div className="bg-purple-900/40 p-1 rounded text-xs text-center">
                            Güç: {enemy.attackPower}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {getEnemyTypeDescription(enemy.type)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-gray-300">
                  Adanıza saldıran düşman tavus kuşlarının detayları. Tıklayın.
                </div>
              )}
            </div>
            
            {/* Düşman efektleri */}
            {battleEffects.includes("attack") && (
              <div className="bg-red-600/40 mt-4 p-3 rounded-md text-center animate-pulse">
                <div className="material-icons text-3xl text-red-500">local_fire_department</div>
                <div className="text-red-500 font-bold">Saldırıyor!</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BattlePhase;