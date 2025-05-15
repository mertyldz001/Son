import { useEffect, useState } from "react";
import { usePeacockIslandsStore } from "../../lib/stores/usePeacockIslandsStore";
import { useAudio } from "../../lib/stores/useAudio";
import { Unit, FeatherInventory } from "../../lib/game/peacockIslands/types";
import { getFeatherColorName } from "../../lib/game/peacockIslands/battle";
import GameBoard3D from "./GameBoard3DNew";
import WindowPanel from "../UI/WindowPanel";

const MultiplayerBattlePhase = () => {
  const { 
    player, 
    npc, // İkinci oyuncu olarak npc kullanılacak - sonra player2 olarak değişecek
    endBattlePhase 
  } = usePeacockIslandsStore();
  
  const { playHit, playSuccess } = useAudio();
  
  // Savaş durumu
  const [battleProgress, setBattleProgress] = useState(0);
  const [battleResult, setBattleResult] = useState<"pending" | "victory" | "defeat">("pending");
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [battleEffects, setBattleEffects] = useState<string[]>([]);
  const [rewardGold, setRewardGold] = useState(0);
  
  // Yerleştirilmiş birimleri bul
  const playerUnits = player.island.units.filter((unit: Unit) => unit.isDeployed);
  const enemyUnits = npc.island.units.filter((unit: Unit) => unit.isDeployed);
  
  // Savaş simülasyon durumu
  const [attackPhase, setAttackPhase] = useState<"player1Attack" | "player2Attack" | "complete">("player1Attack");
  const [currentAttacker, setCurrentAttacker] = useState<Unit | null>(null);
  const [currentDefender, setCurrentDefender] = useState<Unit | null>(null);
  const [roundCount, setRoundCount] = useState(0);
  
  // Savaş simülasyonu
  useEffect(() => {
    // Savaş başlangıcında
    setBattleLog(prev => [...prev, "Savaş başlıyor..."]);
    
    // Başlangıç gecikmesi
    const battleStartDelay = setTimeout(() => {
      simulateBattle();
    }, 1500);
    
    return () => clearTimeout(battleStartDelay);
  }, []);
  
  // Savaş simülasyon mantığı
  const simulateBattle = () => {
    if (playerUnits.length === 0) {
      // Oyuncunun askeri yoksa doğrudan kaybeder
      endBattle("defeat");
      return;
    }
    
    if (enemyUnits.length === 0) {
      // Düşmanın askeri yoksa doğrudan kazanır
      endBattle("victory");
      return;
    }
    
    // Tüm savaş aşamalarını adım adım gerçekleştir
    const battleInterval = setInterval(() => {
      // Savaş ilerleme durumunu güncelle
      setBattleProgress(prev => {
        const newProgress = prev + 2;
        if (newProgress >= 100) {
          clearInterval(battleInterval);
          endBattle(playerUnits.length > enemyUnits.length ? "victory" : "defeat");
          return 100;
        }
        return newProgress;
      });
      
      // Her ilerleme ile yeni bir savaş aksiyonu
      if (attackPhase === "player1Attack") {
        // Oyuncu 1 saldırıyor
        performAttack(playerUnits, enemyUnits, "Player 1");
        setAttackPhase("player2Attack");
      } else {
        // Oyuncu 2 saldırıyor
        performAttack(enemyUnits, playerUnits, "Player 2");
        setAttackPhase("player1Attack");
        // Tur sayacını artır
        setRoundCount(prev => prev + 1);
      }
      
      // Ses efekti
      playHit();
      
    }, 1000); // Her saniye bir aksiyon
    
    return () => clearInterval(battleInterval);
  };
  
  // Saldırı işlemi
  const performAttack = (attackers: Unit[], defenders: Unit[], attackerName: string) => {
    if (attackers.length === 0 || defenders.length === 0) return;
    
    // Rastgele saldıran seç
    const randomAttacker = attackers[Math.floor(Math.random() * attackers.length)];
    setCurrentAttacker(randomAttacker);
    
    // Rastgele savunan seç
    const randomDefender = defenders[Math.floor(Math.random() * defenders.length)];
    setCurrentDefender(randomDefender);
    
    // Saldırı gücü hesapla
    const attackPower = Math.floor(randomAttacker.attack * (1 + Math.random() * 0.5 - 0.25));
    
    // Savunma gücü hesapla
    const defensePower = Math.floor(randomDefender.defense * (1 + Math.random() * 0.3));
    
    // Net hasar
    const damage = Math.max(1, attackPower - defensePower);
    
    // Savaş logu ekle
    setBattleLog(prev => [
      ...prev, 
      `${attackerName}'in askeri ${randomDefender.id} ID'li düşmana ${damage} hasar verdi!`
    ]);
    
    // Savaş efekti ekle
    setBattleEffects(prev => [
      ...prev,
      `hit-${randomDefender.id}`
    ]);
  };
  
  // Savaşı tamamla
  const endBattle = (result: "victory" | "defeat") => {
    setBattleResult(result);
    setBattleProgress(100);
    setAttackPhase("complete");
    
    // Zafer veya yenilgi durumunda
    if (result === "victory") {
      playSuccess();
      const goldReward = 4; // Zafer için 4 altın
      setRewardGold(goldReward);
      setBattleLog(prev => [...prev, `Savaş kazanıldı! ${goldReward} altın kazandınız.`]);
    } else {
      const goldReward = 2; // Yenilgi için 2 altın (teselli)
      setRewardGold(goldReward);
      setBattleLog(prev => [...prev, `Savaş kaybedildi. ${goldReward} altın kazandınız.`]);
    }
  };
  
  // Savaş sonu butonu
  const handleBattleEnd = () => {
    endBattlePhase(battleResult === "victory");
  };
  
  return (
    <div className="relative w-full h-full">
      {/* 3D Savaş Alanı */}
      <div className="absolute inset-0 z-0">
        <GameBoard3D />
      </div>
      
      {/* Savaş arayüzü */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sol panel - Oyuncu 1 bilgileri */}
            <div className="bg-gray-800/90 rounded-lg p-4 text-white">
              <h3 className="text-lg font-bold mb-4 text-blue-300">{player.name}</h3>
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span>Asker sayısı:</span>
                  <span className="font-bold text-blue-300">{playerUnits.length}</span>
                </div>
              </div>
            </div>
            
            {/* Orta panel - Savaş alanı */}
            <div className="flex-1 bg-gray-800/90 rounded-lg p-4 flex flex-col text-white">
              <h3 className="text-lg font-bold mb-4 text-center">Savaş Alanı</h3>
              
              {/* İlerleme çubuğu */}
              <div className="w-full h-4 bg-gray-700 rounded-full mb-4">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                  style={{ width: `${battleProgress}%` }}
                ></div>
              </div>
              
              {/* Savaş mesajları */}
              <div className="flex-1 overflow-y-auto mb-4 bg-gray-900/50 rounded-md p-2 text-sm">
                {battleLog.map((log, index) => (
                  <div key={index} className="py-1 border-b border-gray-700 last:border-0">
                    {log}
                  </div>
                ))}
              </div>
              
              {/* Savaş sonu butonu */}
              {battleProgress >= 100 && (
                <button
                  className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-md"
                  onClick={handleBattleEnd}
                >
                  {battleResult === "victory" 
                    ? "Zaferi Kutla! (4 Altın Kazandın)" 
                    : "Hazırlık Fazına Dön (2 Altın Kazandın)"}
                </button>
              )}
            </div>
            
            {/* Sağ panel - Oyuncu 2 bilgileri */}
            <div className="bg-gray-800/90 rounded-lg p-4 text-white">
              <h3 className="text-lg font-bold mb-4 text-red-300">{npc.name}</h3>
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span>Asker sayısı:</span>
                  <span className="font-bold text-red-300">{enemyUnits.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiplayerBattlePhase;