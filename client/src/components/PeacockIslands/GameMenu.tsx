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
    // Müzik yükleme işlevi
    const loadMusic = async () => {
      try {
        const newMusic = new Audio("/music/medieval-fantasy-rpg.mp3");
        newMusic.loop = true;
        newMusic.volume = 0.3;
        setBackgroundMusic(newMusic);
        
        // Autoplay Policy: Kullanıcı etkileşimi gerekiyor
        const playMusic = () => {
          if (!isMuted && newMusic) {
            // Play promise'i yakalayıp hataları ele alalım
            const playPromise = newMusic.play();
            
            if (playPromise !== undefined) {
              playPromise.then(() => {
                console.log("Müzik başlatıldı!");
              }).catch(err => {
                console.error("Müzik başlatılamadı:", err);
              });
            }
          }
        };
        
        // Kullanıcı etkileşimi olmadan müzik çalamayız, bu yüzden click event dinleyelim
        document.addEventListener('click', playMusic, { once: true });
        document.addEventListener('keydown', playMusic, { once: true });
        
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
      
      // Eventleri temizle
      document.removeEventListener('click', () => {});
      document.removeEventListener('keydown', () => {});
    };
  }, []);
  
  const handleStartGame = () => {
    startGame();
  };
  
  return (
    <div 
      className="w-full h-full overflow-hidden relative"
    >
      {/* Tamamen kodla tasarlanmış özel arka plan */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950">
        {/* Animasyonlu arka plan şekilleri */}
        <div className="absolute inset-0 opacity-20">
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={`hex-bg-${i}`}
              className="absolute"
              style={{
                left: `${10 + (i * 15)}%`,
                top: `${10 + ((i % 3) * 25)}%`,
                width: `${150 + (i * 30)}px`,
                height: `${150 + (i * 30)}px`,
                border: '1px solid rgba(255,255,255,0.1)',
                transform: 'rotate(30deg)',
                opacity: 0.1 + (i * 0.03),
              }}
              animate={{
                rotate: [30, 60, 30],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 10 + i,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
        
        {/* Üstten ışık efekti */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-amber-500/10 to-transparent"></div>
        
        {/* Altıgen ızgara deseni */}
        <div className="absolute inset-0" style={{ 
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)`, 
          backgroundSize: '30px 30px',
          opacity: 0.3
        }}></div>
      </div>
      
      {/* Arka plan overlay ve modern efektler */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-indigo-950/10 to-transparent"></div>
      
      {/* Dinamik arka plan parçacıkları */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute rounded-full"
            style={{
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              backgroundColor: `rgba(${
                Math.floor(Math.random() * 100) + 100
              }, ${
                Math.floor(Math.random() * 100) + 150
              }, ${
                Math.floor(Math.random() * 100) + 200
              }, ${
                Math.random() * 0.3 + 0.1
              })`,
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
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-black to-indigo-950/90 z-50">
          <div className="flex flex-col items-center relative">
            {/* Geliştirilmiş altıgen yükleme animasyonu */}
            <div className="relative w-40 h-40">
              {/* Dış altıgen katmanı */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={`loading-hex-outer-${i}`}
                  className="absolute top-0 left-0 w-full h-full"
                  style={{
                    transformOrigin: "center",
                    rotate: `${i * 60}deg`,
                  }}
                >
                  <motion.div
                    className="absolute top-0 w-2 h-12 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full"
                    style={{ left: "calc(50% - 1px)" }}
                    initial={{ scaleY: 0.3, opacity: 0.3 }}
                    animate={{ 
                      scaleY: [0.3, 1, 0.3], 
                      opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 1.8,
                      repeat: Infinity,
                      delay: i * 0.18,
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>
              ))}
              
              {/* İç altıgen katmanı - Ters yönde dönen */}
              <div className="absolute inset-0 scale-75">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={`loading-hex-inner-${i}`}
                    className="absolute top-0 left-0 w-full h-full"
                    style={{
                      transformOrigin: "center",
                      rotate: `${i * 60 + 30}deg`,
                    }}
                  >
                    <motion.div
                      className="absolute top-0 w-1.5 h-9 bg-gradient-to-b from-amber-300 to-amber-500 rounded-full"
                      style={{ left: "calc(50% - 0.75px)" }}
                      initial={{ scaleY: 0.5, opacity: 0.3 }}
                      animate={{ 
                        scaleY: [0.5, 1, 0.5], 
                        opacity: [0.3, 0.8, 0.3],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.14,
                        ease: "easeInOut"
                      }}
                    />
                  </motion.div>
                ))}
              </div>
              
              {/* Ortadaki logo/amblem - Daha şık tasarım */}
              <motion.div
                className="absolute inset-0 m-auto w-20 h-20 rounded-lg overflow-hidden backdrop-blur-sm bg-gradient-to-br from-amber-500/90 to-amber-600/90 flex items-center justify-center rotate-45 shadow-lg border-2 border-amber-300/30"
                initial={{ scale: 0.9, opacity: 0.7, rotate: 45 }}
                animate={{ 
                  scale: [0.9, 1, 0.9],
                  opacity: [0.7, 1, 0.7],
                  boxShadow: [
                    "0 0 10px rgba(251, 191, 36, 0.3)",
                    "0 0 20px rgba(251, 191, 36, 0.5)",
                    "0 0 10px rgba(251, 191, 36, 0.3)"
                  ]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <div className="rotate-[-45deg] flex flex-col items-center justify-center">
                  <span className="text-white text-xl font-bold tracking-wider">FI</span>
                  <div className="w-full h-px bg-white/30 mt-1 mb-1"></div>
                  <span className="text-white/70 text-[9px] tracking-widest">FEATHER ISLAND</span>
                </div>
              </motion.div>
              
              {/* Dış ışık halkası */}
              <motion.div
                className="absolute inset-0 m-auto w-36 h-36 rounded-full border border-blue-400/20"
                animate={{
                  opacity: [0.2, 0.4, 0.2],
                  scale: [0.9, 1.05, 0.9]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>
            
            {/* Yükleniyor metni */}
            <div className="mt-6 text-xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Yükleniyor...</div>
            
            {/* Altındaki mini bar */}
            <motion.div 
              className="mt-4 h-1 bg-blue-600/30 rounded-full overflow-hidden"
              style={{ width: "160px" }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-400"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ 
                  duration: 2.5, 
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
              />
            </motion.div>
          </div>
        </div>
      )}
      
      <div className="absolute inset-0 flex items-center justify-between z-10">
        {/* Sol tarafta geliştirilmiş TFT tarzı altıgen paneller */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="hidden lg:block w-1/4 h-full"
        >
          <div className="flex flex-col items-end justify-center h-full pr-10 relative">
            {/* Büyük altıgen panel - Peacock savaşçısı içeren panel */}
            <motion.div 
              className="w-56 h-72 backdrop-blur-sm relative overflow-hidden"
              style={{ 
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                background: 'linear-gradient(135deg, rgba(30,41,59,0.6) 0%, rgba(30,58,138,0.3) 100%)'
              }}
              initial={{ y: 30, opacity: 0.6 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 2, delay: 0.8 }}
            >
              <div className="absolute inset-0 border-2 border-blue-400/20" 
                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
              
              {/* İç çerçeve */}
              <div className="absolute inset-2 border border-blue-400/10"
                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
              
              {/* Üst kısım - Başlık */}
              <div className="absolute top-4 left-0 right-0 text-center">
                <div className="font-semibold text-blue-300/90 uppercase tracking-wider text-sm">Adacı Savaşçı</div>
                <div className="w-16 h-0.5 bg-blue-500/30 mx-auto mt-1"></div>
              </div>
              
              {/* Orta kısım - İçerik */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ rotateY: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="w-48 h-48 opacity-70"
                >
                  {/* Burada bir peacock grafiği/ikonu olacak */}
                  <div className="w-full h-full rounded-full flex items-center justify-center">
                    <div className="w-16 h-16 rotate-45 bg-gradient-to-br from-amber-500/30 to-amber-600/20 backdrop-blur-sm rounded-lg"></div>
                  </div>
                </motion.div>
              </div>
              
              {/* Alt kısım - Özellikler */}
              <div className="absolute bottom-6 left-0 right-0 text-center">
                <div className="flex justify-center space-x-4">
                  <div className="flex flex-col items-center">
                    <div className="text-amber-400 text-xs">GÜÇ</div>
                    <div className="text-white font-bold">15</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-amber-400 text-xs">SAVUNMA</div>
                    <div className="text-white font-bold">12</div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Küçük altıgen panel - Oyun bilgisi */}
            <motion.div 
              className="w-36 h-36 backdrop-blur-sm relative overflow-hidden ml-24 -mt-20"
              style={{ 
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                background: 'linear-gradient(135deg, rgba(67,56,202,0.4) 0%, rgba(79,70,229,0.2) 100%)'
              }}
              initial={{ y: 30, opacity: 0.6, rotate: 30 }}
              animate={{ y: 0, opacity: 1, rotate: 30 }}
              transition={{ duration: 2, delay: 1.2 }}
            >
              <div className="absolute inset-0 border-2 border-indigo-400/20" 
                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
              
              <div className="absolute inset-0 flex items-center justify-center -rotate-30">
                <div className="text-center">
                  <div className="font-semibold text-indigo-300/90 text-sm">Savaş Taktiği</div>
                  <div className="w-12 h-0.5 bg-indigo-500/30 mx-auto my-1"></div>
                  <div className="text-white/70 text-xs">Savunma ve Strateji</div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Orta kısım - Ana menü */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full md:w-2/3 lg:w-1/2 mx-auto px-6"
        >
          <div className="text-center relative">
            {/* Arka planda altıgen desen */}
            <div className="absolute inset-0 -z-10 opacity-10">
              {Array.from({ length: 20 }).map((_, i) => (
                <div 
                  key={`bg-hex-${i}`}
                  className="absolute bg-white/5"
                  style={{ 
                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                    width: `${30 + Math.random() * 20}px`,
                    height: `${30 + Math.random() * 20}px`,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    transform: `rotate(${Math.random() * 60}deg)`,
                    opacity: 0.1 + Math.random() * 0.2
                  }}
                />
              ))}
            </div>
            
            {/* Logo/Amblem */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.1 }}
              className="mx-auto w-24 h-24 mb-3 relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-xl rotate-45 backdrop-blur-sm border border-amber-500/20" />
              <div className="absolute inset-2 border border-amber-500/10 rounded-lg rotate-45" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-2xl font-bold text-amber-400/90 rotate-[-45deg]">FI</div>
              </div>
              
              {/* Işık efekti */}
              <motion.div
                animate={{ 
                  boxShadow: ['0 0 10px rgba(251,191,36,0.1)', '0 0 20px rgba(251,191,36,0.3)', '0 0 10px rgba(251,191,36,0.1)'] 
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-xl rotate-45"
              />
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-6xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 drop-shadow-[0_2px_5px_rgba(255,175,0,0.5)]"
            >
              Feather Island
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