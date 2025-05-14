import { useEffect, useState } from "react";
import { usePeacockIslandsStore } from "../../lib/stores/usePeacockIslandsStore";
import { useAudio } from "../../lib/stores/useAudio";

const BattlePhase = () => {
  const { player, npc, currentEnemyWave, endBattlePhase } = usePeacockIslandsStore();
  const { playHit, playSuccess } = useAudio();
  
  const [battleProgress, setBattleProgress] = useState(0);
  const [battleResult, setBattleResult] = useState<"pending" | "victory" | "defeat">("pending");
  const [battleLog, setBattleLog] = useState<string[]>([]);
  
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
      
      // Savaş simülasyonu - adım adım göster
      let currentProgress = 0;
      const battleInterval = setInterval(() => {
        currentProgress += 10;
        setBattleProgress(currentProgress);
        
        if (currentProgress >= 100) {
          clearInterval(battleInterval);
          
          // Savaş sonucu
          const victorious = playerPower >= enemyPower;
          
          if (victorious) {
            playSuccess(); // Zafer sesi çal
            setBattleResult("victory");
            setBattleLog(prev => [...prev, "Zafer! Düşman dalgasını püskürttünüz."]);
            
            // 2 saniye sonra bir sonraki faza geç
            setTimeout(() => {
              endBattlePhase(true);
            }, 2000);
          } else {
            playHit(); // Yenilgi sesi
            setBattleResult("defeat");
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
    <div className="w-full h-full bg-gray-900 text-white p-4 flex flex-col">
      {/* Üst panel - Savaş bilgileri */}
      <div className="bg-gray-800 p-4 rounded-lg mb-4 flex justify-between items-center">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold">Savaş Fazı</h2>
          <p className="text-sm text-gray-400">Düşman dalgası adanıza saldırıyor!</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-red-900 px-4 py-2 rounded-md flex items-center">
            <span className="material-icons mr-2">warning</span>
            <span className="font-bold">
              {currentEnemyWave ? `Düşman Seviyesi: ${currentEnemyWave.level}` : "Hazırlanıyor..."}
            </span>
          </div>
        </div>
      </div>
      
      {/* Ana içerik - Savaş alanı */}
      <div className="flex gap-4 h-full flex-1">
        {/* Sol panel - Oyuncu bilgileri */}
        <div className="w-1/4 bg-gray-800 rounded-lg p-4 flex flex-col">
          <h3 className="text-lg font-bold mb-2">{player.island.name}</h3>
          
          <div className="bg-gray-700 rounded-md p-3 mb-4">
            <h4 className="text-md font-semibold mb-2">Savunma Gücü</h4>
            <div className="flex items-center justify-center">
              <div className="bg-blue-900 rounded-full w-24 h-24 flex items-center justify-center">
                <span className="text-2xl font-bold">{player.island.army.power}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-700 rounded-md p-3 mb-4">
            <h4 className="text-md font-semibold mb-2">Ordu</h4>
            <div className="grid grid-cols-1 gap-2">
              <div className="bg-red-900/60 p-2 rounded text-center">
                <div className="text-red-400 font-bold">{player.island.army.soldiers}</div>
                <div className="text-xs">Asker</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Orta panel - Savaş alanı */}
        <div className="flex-1 bg-gray-800 rounded-lg p-4 flex flex-col">
          <h3 className="text-lg font-bold mb-4 text-center">Savaş Alanı</h3>
          
          {/* Savaş ilerleme çubuğu */}
          <div className="bg-gray-700 h-8 rounded-full mb-4 overflow-hidden">
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
          
          {/* Savaş logu */}
          <div className="flex-1 bg-gray-900/50 rounded-md p-3 overflow-y-auto">
            <h4 className="text-md font-semibold mb-2">Savaş Logu</h4>
            <div className="space-y-1">
              {battleLog.map((log, index) => (
                <div key={index} className="text-sm text-gray-300">{log}</div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Sağ panel - Düşman bilgileri */}
        <div className="w-1/4 bg-gray-800 rounded-lg p-4 flex flex-col">
          <h3 className="text-lg font-bold mb-2">Düşman Dalgası</h3>
          
          <div className="bg-gray-700 rounded-md p-3 mb-4">
            <h4 className="text-md font-semibold mb-2">Saldırı Gücü</h4>
            <div className="flex items-center justify-center">
              <div className="bg-red-900 rounded-full w-24 h-24 flex items-center justify-center">
                <span className="text-2xl font-bold">
                  {currentEnemyWave ? currentEnemyWave.power : "?"}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-700 rounded-md p-3 mb-4">
            <h4 className="text-md font-semibold mb-2">Düşman Bilgileri</h4>
            <div className="space-y-2">
              <div className="bg-gray-800 p-2 rounded flex justify-between">
                <span>Seviye:</span>
                <span className="font-bold text-red-400">
                  {currentEnemyWave ? currentEnemyWave.level : "?"}
                </span>
              </div>
              <div className="bg-gray-800 p-2 rounded flex justify-between">
                <span>Tip:</span>
                <span className="font-bold text-yellow-400">Tavus Kuşu Yavrusu</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BattlePhase;