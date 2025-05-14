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
      className="w-full h-full overflow-hidden bg-cover bg-center relative"
      style={{ backgroundImage: 'url("/images/tft-background-new.jpg")' }}
    >
      {/* Arka plan overlay ve modern efektler */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-slate-900/70 to-transparent"></div>
      
      {/* Dinamik arka plan parçacıkları */}
      <div className="absolute inset-0 z-0">
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-blue-500/40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.1, 0.5, 0.1],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              repeatType: "reverse",
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
      
      {/* Yükleniyor göstergesi */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
          <div className="flex flex-col items-center">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mb-4"
            />
            <div className="text-xl font-medium text-blue-400">Yükleniyor...</div>
          </div>
        </div>
      )}
      
      <div className="absolute inset-0 flex items-center justify-between z-10">
        {/* Sol tarafta dekoratif elementler */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="hidden lg:block w-1/4 h-full"
        >
          <div className="flex flex-col items-end justify-center h-full pr-10">
            <div className="w-32 h-60 border-2 border-amber-500/30 rounded-full bg-gradient-to-br from-amber-900/20 to-amber-500/10 backdrop-blur-sm" />
            <div className="w-24 h-24 -mt-20 ml-10 border-2 border-blue-500/30 rounded-full bg-gradient-to-br from-blue-900/20 to-blue-500/10 backdrop-blur-sm" />
          </div>
        </motion.div>
        
        {/* Orta kısım - Ana menü */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full md:w-2/3 lg:w-1/2 mx-auto px-6"
        >
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 drop-shadow-[0_2px_5px_rgba(255,175,0,0.5)]"
            >
              Tavus Kuşu Adaları
            </motion.h1>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="relative w-full max-w-lg mx-auto h-1 mb-8"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full"></div>
            </motion.div>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl mb-12 text-amber-100/80 max-w-md mx-auto"
            >
              Adanızı güçlendirin, tüylerden efsanevi askerlere sahip olun ve krallığınızı korumak için savaşın!
            </motion.p>
            
            <div className="flex flex-col items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gradient-to-r from-amber-600 to-amber-800 text-white px-10 py-4 text-xl font-bold rounded-xl hover:from-amber-500 hover:to-amber-700 transition-all duration-300 shadow-lg shadow-amber-900/30 border border-amber-500/30"
                onClick={handleStartGame}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="material-icons">play_arrow</span>
                  Maceraya Başla
                </div>
              </motion.button>
              
              <motion.button 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 text-amber-200 hover:text-amber-100 transition-colors mt-6 px-4 py-2 rounded-lg border border-amber-500/20 bg-amber-900/20 backdrop-blur-sm"
                onClick={toggleMute}
              >
                <span className="material-icons">
                  {isMuted ? "volume_off" : "volume_up"}
                </span>
                {isMuted ? "Müziği Aç" : "Müziği Kapat"}
              </motion.button>
            </div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="mt-8 bg-gradient-to-r from-amber-900/40 to-orange-900/40 p-4 rounded-lg backdrop-blur-sm border border-amber-500/20 max-w-lg mx-auto"
            >
              <h2 className="text-lg font-semibold text-amber-200 mb-3 flex items-center justify-center gap-2">
                <span className="material-icons text-sm">tips_and_updates</span>
                NASIL OYNANIR
              </h2>
              <ul className="text-left text-amber-100/70 space-y-1 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span> 
                  <span>Her turda 60 saniyelik hazırlık süresinde tüyleri toplayın ve asker eğitin</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span> 
                  <span>Tüyleri birleştirerek güçlü yumurtalar elde edin ve askerlere bonus verin</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span> 
                  <span>Birimlerinizi savaş alanına yerleştirin ve düşman dalgalarına karşı savunun</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span> 
                  <span>Her turda giderek güçlenen tavuskuşlarını yenmeye çalışın</span>
                </li>
              </ul>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="mt-10 text-xs text-amber-200/40 italic"
            >
              Tavuskuşu Adaları v1.0 — Hazırlayan: Replit
            </motion.div>
          </div>
        </motion.div>
        
        {/* Sağ tarafta dekoratif elementler */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="hidden lg:block w-1/4 h-full"
        >
          <div className="flex flex-col items-start justify-center h-full pl-10">
            <div className="w-24 h-24 border-2 border-green-500/30 rounded-full bg-gradient-to-br from-green-900/20 to-green-500/10 backdrop-blur-sm" />
            <div className="w-32 h-60 -mt-10 mr-10 border-2 border-teal-500/30 rounded-full bg-gradient-to-br from-teal-900/20 to-teal-500/10 backdrop-blur-sm" />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default GameMenu;