import { useEffect, useState } from "react";
import { usePeacockIslandsStore } from "../../lib/stores/usePeacockIslandsStore";
import { useAudio } from "../../lib/stores/useAudio";
import GameBoard3D from "./GameBoard3D";

const BattlePhase = () => {
  const { player, npc, currentEnemyWave, endBattlePhase } = usePeacockIslandsStore();
  const { playHit, playSuccess } = useAudio();
  
  const [battleProgress, setBattleProgress] = useState(0);
  const [battleResult, setBattleResult] = useState<"pending" | "victory" | "defeat">("pending");
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [battleEffects, setBattleEffects] = useState<string[]>([]);
  
  // Savaş simülasyonu
  useEffect(() => {
    if (!currentEnemyWave) return;
    
    // Savaş başlangıcında etkileşim engelleme
    const battleDelay = 1000; // 1 saniye bekle
    
    // Zamanlanmış savaş simülasyonu
    const timer = setTimeout(() => {
      // Basit savaş mekaniği
      const playerPower = player.island.army.power;
      const enemyPower = currentEnemyWave.power;
      
      // Savaş logu ekle
      setBattleLog(prev => [
        ...prev, 
        `Savaş başladı! Oyuncu gücü: ${playerPower}, Düşman gücü: ${enemyPower}`
      ]);
      
      playHit(); // Savaş sesi çal
      
      // Savaş efektleri
      setBattleEffects(prev => [...prev, "attack"]);
      
      // Savaş simülasyonu - adım adım göster
      let currentProgress = 0;
      const battleInterval = setInterval(() => {
        currentProgress += 10;
        setBattleProgress(currentProgress);
        
        // İlerlemeye göre olay gönder
        if (currentProgress % 25 === 0) {
          playHit();
          setBattleEffects(prev => [...prev, "hit"]);
          setBattleLog(prev => [
            ...prev,
            currentProgress === 25 ? "Savaşçılar çarpışıyor!" : 
            currentProgress === 50 ? "Büyük bir savaş!" : 
            currentProgress === 75 ? "Son darbeye hazırlanıyor..." : ""
          ].filter(Boolean));
        }
        
        if (currentProgress >= 100) {
          clearInterval(battleInterval);
          
          // Savaş sonucu
          const victorious = playerPower >= enemyPower;
          
          if (victorious) {
            playSuccess(); // Zafer sesi çal
            setBattleResult("victory");
            setBattleEffects(prev => [...prev, "victory"]);
            setBattleLog(prev => [...prev, "Zafer! Düşman dalgasını püskürttünüz."]);
            
            // 2 saniye sonra bir sonraki faza geç
            setTimeout(() => {
              endBattlePhase(true);
            }, 2000);
          } else {
            playHit(); // Yenilgi sesi
            setBattleResult("defeat");
            setBattleEffects(prev => [...prev, "defeat"]);
            setBattleLog(prev => [...prev, "Yenilgi! Düşman adanızı ele geçirdi."]);
            
            // 2 saniye sonra bir sonraki faza geç
            setTimeout(() => {
              endBattlePhase(false);
            }, 2000);
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
  }, [currentEnemyWave, player.island.army.power, endBattlePhase, playHit, playSuccess]);
  
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
            
            <div className="bg-gray-700/90 rounded-md p-3 mb-4">
              <h4 className="text-md font-semibold mb-2">Savunma Gücü</h4>
              <div className="flex items-center justify-center">
                <div className="bg-blue-900/90 rounded-full w-24 h-24 flex items-center justify-center">
                  <span className="text-2xl font-bold">{player.island.army.power}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-700/90 rounded-md p-3 mb-4">
              <h4 className="text-md font-semibold mb-2">Ordu</h4>
              <div className="grid grid-cols-1 gap-2">
                <div className="bg-red-900/60 p-2 rounded text-center">
                  <div className="text-red-400 font-bold">{player.island.army.soldiers}</div>
                  <div className="text-xs">Asker</div>
                </div>
              </div>
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
            
            <div className="bg-gray-700/90 rounded-md p-3 mb-4">
              <h4 className="text-md font-semibold mb-2">Saldırı Gücü</h4>
              <div className="flex items-center justify-center">
                <div className="bg-red-900/90 rounded-full w-24 h-24 flex items-center justify-center">
                  <span className="text-2xl font-bold">
                    {currentEnemyWave ? currentEnemyWave.power : "?"}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-700/90 rounded-md p-3 mb-4">
              <h4 className="text-md font-semibold mb-2">Düşman Bilgileri</h4>
              <div className="space-y-2">
                <div className="bg-gray-800/90 p-2 rounded flex justify-between">
                  <span>Seviye:</span>
                  <span className="font-bold text-red-400">
                    {currentEnemyWave ? currentEnemyWave.level : "?"}
                  </span>
                </div>
                <div className="bg-gray-800/90 p-2 rounded flex justify-between">
                  <span>Tip:</span>
                  <span className="font-bold text-yellow-400">Tavus Kuşu Yavrusu</span>
                </div>
              </div>
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