import { useEffect, useState } from "react";
import { usePeacockIslandsStore } from "../../lib/stores/usePeacockIslandsStore";
import { useAudio } from "../../lib/stores/useAudio";
import { motion } from "framer-motion";

const GameMenu = () => {
  const { startGame } = usePeacockIslandsStore();
  const { backgroundMusic, toggleMute, isMuted, setBackgroundMusic } = useAudio();
  const [loading, setLoading] = useState(true);
  
  // Yeni müzik dosyasını yükle ve arka plan müziği olarak ayarla
  useEffect(() => {
    const loadMusic = async () => {
      try {
        const newMusic = new Audio("/music/medieval-fantasy-rpg.mp3");
        newMusic.loop = true;
        newMusic.volume = 0.3;
        setBackgroundMusic(newMusic);
        
        // Yüklendiğinde otomatik olarak başlat (eğer sessize alınmadıysa)
        if (!isMuted) {
          await newMusic.play();
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Müzik yüklenemedi:", error);
        setLoading(false);
      }
    };
    
    loadMusic();
    
    // Temizlik işlevi
    return () => {
      if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
      }
    };
  }, []);
  
  const handleStartGame = () => {
    startGame();
  };
  
  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center justify-center bg-cover bg-center text-white relative"
      style={{ backgroundImage: 'url("/images/tft-background.jpg")' }}
    >
      {/* Arka plan overlay */}
      <div className="absolute inset-0 bg-black/70"></div>
      
      {/* Yükleniyor göstergesi */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="text-2xl text-blue-400">Yükleniyor...</div>
        </div>
      )}
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-2xl mx-auto text-center p-6 bg-black/80 rounded-lg z-10 border border-purple-500/20"
      >
        <h1 className="text-5xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
          Tavus Kuşu Adaları
        </h1>
        
        <p className="text-xl mb-10 text-gray-300">
          Adanızı geliştirin ve Tavus Kuşu ordularıyla savaşın!
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
            <li><span className="text-cyan-400">1.</span> Her turda 60 saniyelik hazırlık süreniz var</li>
            <li><span className="text-cyan-400">2.</span> Altın toplayın ve kaynaklarınızı yönetin</li>
            <li><span className="text-cyan-400">3.</span> Tüylerden yumurta üretin ve kuluçkaya yatırın</li>
            <li><span className="text-cyan-400">4.</span> Askerlerinizi eğitin ve binalarınızı geliştirin</li>
            <li><span className="text-cyan-400">5.</span> Tavus Kuşu dalgasına karşı adanızı savunun</li>
          </ul>
          
          <h3 className="text-xl font-bold mt-6 mb-2">Kaynaklar</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-yellow-900/70 p-2 rounded-md">
              <div className="font-bold mb-1">Altın</div>
              <div className="text-sm">Bina geliştirme ve asker eğitimi için gerekli</div>
            </div>
            <div className="bg-blue-900/70 p-2 rounded-md">
              <div className="font-bold mb-1">Tüyler</div>
              <div className="text-sm">Yumurta üretimi için gerekli</div>
            </div>
            <div className="bg-green-900/70 p-2 rounded-md">
              <div className="font-bold mb-1">Yumurtalar</div>
              <div className="text-sm">Adanıza güç kazandırır</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default GameMenu;