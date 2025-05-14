import { useEffect } from "react";
import { usePeacockIslandsStore } from "../../lib/stores/usePeacockIslandsStore";
import { useAudio } from "../../lib/stores/useAudio";

const GameOver = () => {
  const { player, currentTurn, resetGame } = usePeacockIslandsStore();
  const { playSuccess } = useAudio();
  
  // Oyun bittiğinde ses çalma
  useEffect(() => {
    playSuccess();
  }, [playSuccess]);
  
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black/90 text-white">
      <div className="max-w-xl w-full bg-gray-900 rounded-lg p-8 shadow-lg">
        <h1 className="text-4xl font-bold mb-6 text-center text-red-500">
          Oyun Bitti!
        </h1>
        
        <div className="bg-black/50 p-4 rounded-lg mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-xl">Toplam Tur:</span>
            <span className="text-xl">{currentTurn}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xl">Son Güç Durumu:</span>
            <span className="text-xl text-red-400">{player.island.army.power}</span>
          </div>
        </div>
        
        <div className="text-center mb-8 text-gray-300">
          <p className="text-xl">
            Düşmanlar adanızı ele geçirdi. Daha güçlü bir savunma inşa etmelisiniz!
          </p>
        </div>
        
        <div className="flex justify-center gap-4">
          <button
            className="bg-purple-700 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-bold transition-colors"
            onClick={resetGame}
          >
            Tekrar Oyna
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOver;