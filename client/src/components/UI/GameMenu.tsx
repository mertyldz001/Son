import { useEffect } from "react";
import { useGameStore } from "../../lib/stores/useGameStore";
import { useAudio } from "../../lib/stores/useAudio";

const GameMenu = () => {
  const { startGame, resetBoard } = useGameStore();
  const { backgroundMusic, toggleMute, isMuted } = useAudio();
  
  // Start background music when menu appears
  useEffect(() => {
    if (backgroundMusic && !isMuted) {
      backgroundMusic.currentTime = 0;
      backgroundMusic.play().catch(err => console.error("Failed to play background music:", err));
    }
    
    // Make sure board is reset when returning to menu
    resetBoard();
  }, [backgroundMusic, isMuted, resetBoard]);
  
  const handleStartGame = () => {
    startGame();
  };
  
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-indigo-900 via-purple-900 to-black text-white">
      <div className="max-w-2xl mx-auto text-center p-6 bg-black/70 rounded-lg">
        <h1 className="text-5xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
          Taktiksel Kart Savaşı
        </h1>
        
        <p className="text-xl mb-10 text-gray-300">
          Teamfight Tactics'ten esinlenen stratejik kart oyunu
        </p>
        
        <div className="flex flex-col gap-4 mb-10">
          <button
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 text-xl font-bold rounded-lg hover:from-purple-500 hover:to-indigo-500 transition-all duration-300 shadow-lg"
            onClick={handleStartGame}
          >
            Oyunu Başlat
          </button>
          
          <button
            className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-all"
            onClick={toggleMute}
          >
            {isMuted ? "Sesi Aç" : "Sesi Kapat"}
          </button>
        </div>
        
        <div className="bg-black/50 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Nasıl Oynanır</h2>
          <ul className="text-left text-gray-300 space-y-2">
            <li><span className="text-cyan-400">1.</span> Şampiyon kartlarını çek ve tahtanın senin tarafına yerleştir</li>
            <li><span className="text-cyan-400">2.</span> Her şampiyonun farklı özellikleri ve yetenekleri vardır</li>
            <li><span className="text-cyan-400">3.</span> Rakibini alt etmek için şampiyonlarını stratejik olarak konumlandır</li>
            <li><span className="text-cyan-400">4.</span> İki oyuncu da turunu bitirdiğinde, şampiyonlar otomatik olarak savaşacaktır</li>
            <li><span className="text-cyan-400">5.</span> Rakibin sağlığını sıfıra indirerek kazan!</li>
          </ul>
          
          <h3 className="text-xl font-bold mt-6 mb-2">Şampiyon Sınıfları</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-red-900/70 p-2 rounded-md">
              <div className="font-bold mb-1">Savaşçı</div>
              <div className="text-sm">Büyücülere karşı güçlü<br/>Haydutlara karşı zayıf</div>
            </div>
            <div className="bg-blue-900/70 p-2 rounded-md">
              <div className="font-bold mb-1">Büyücü</div>
              <div className="text-sm">Haydutlara karşı güçlü<br/>Savaşçılara karşı zayıf</div>
            </div>
            <div className="bg-green-900/70 p-2 rounded-md">
              <div className="font-bold mb-1">Haydut</div>
              <div className="text-sm">Savaşçılara karşı güçlü<br/>Büyücülere karşı zayıf</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameMenu;
