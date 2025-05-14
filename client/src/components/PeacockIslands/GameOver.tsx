import { useEffect } from "react";
import { usePeacockIslandsStore } from "../../lib/stores/usePeacockIslandsStore";
import { useAudio } from "../../lib/stores/useAudio";
import GameBoard3D from "./GameBoard3D";

const GameOver = () => {
  const { player, currentTurn, resetGame } = usePeacockIslandsStore();
  const { playSuccess } = useAudio();
  
  // Oyun bittiğinde ses çalma
  useEffect(() => {
    playSuccess();
  }, [playSuccess]);
  
  return (
    <div className="w-full h-full relative">
      {/* 3D Game Board as background */}
      <GameBoard3D />
      
      {/* UI Overlay */}
      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
        <div className="max-w-xl w-full bg-gray-900/90 rounded-lg p-8 shadow-lg text-white">
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
          
          {/* Animasyonlu içerik */}
          <div className="text-center mb-8 text-gray-300 relative">
            <p className="text-xl">
              Düşmanlar adanızı ele geçirdi. Daha güçlü bir savunma inşa etmelisiniz!
            </p>
            
            {/* Efektler */}
            <div className="absolute -top-10 -right-10">
              <div className="text-6xl text-red-500 animate-pulse material-icons">
                warning
              </div>
            </div>
            
            <div className="absolute -bottom-10 -left-10">
              <div className="text-6xl text-red-500 animate-pulse material-icons">
                warning
              </div>
            </div>
          </div>
          
          <div className="flex justify-center gap-4">
            <button
              className="bg-purple-700 hover:bg-purple-600 text-white px-8 py-4 text-xl rounded-lg font-bold transition-colors shadow-lg"
              onClick={resetGame}
            >
              Tekrar Oyna
            </button>
          </div>
          
          {/* İstatistikler */}
          <div className="mt-8 bg-black/50 p-4 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-center">
              Oyun İstatistikleri
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/70 p-3 rounded text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {player.island.resources.gold}
                </div>
                <div className="text-sm">Toplam Altın</div>
              </div>
              <div className="bg-gray-800/70 p-3 rounded text-center">
                <div className="text-2xl font-bold text-green-400">
                  {player.island.army.soldiers}
                </div>
                <div className="text-sm">Toplam Asker</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameOver;