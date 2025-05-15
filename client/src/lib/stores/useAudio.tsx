import { create } from "zustand";

interface AudioState {
  backgroundMusic: HTMLAudioElement | null;
  hitSound: HTMLAudioElement | null;
  successSound: HTMLAudioElement | null;
  clickSound: HTMLAudioElement | null;
  collectSound: HTMLAudioElement | null;
  buildSound: HTMLAudioElement | null;
  isMuted: boolean;
  
  // Setter functions
  setBackgroundMusic: (music: HTMLAudioElement) => void;
  setHitSound: (sound: HTMLAudioElement) => void;
  setSuccessSound: (sound: HTMLAudioElement) => void;
  setClickSound: (sound: HTMLAudioElement) => void;
  setCollectSound: (sound: HTMLAudioElement) => void;
  setBuildSound: (sound: HTMLAudioElement) => void;
  
  // Control functions
  toggleMute: () => void;
  playHit: () => void;
  playSuccess: () => void;
  playClick: () => void;
  playCollect: () => void;
  playBuild: () => void;
}

export const useAudio = create<AudioState>((set, get) => ({
  backgroundMusic: null,
  hitSound: null,
  successSound: null,
  clickSound: null,
  collectSound: null,
  buildSound: null,
  isMuted: false, // Varsayılan olarak ses açık
  
  setBackgroundMusic: (music) => set({ backgroundMusic: music }),
  setHitSound: (sound) => set({ hitSound: sound }),
  setSuccessSound: (sound) => set({ successSound: sound }),
  setClickSound: (sound) => set({ clickSound: sound }),
  setCollectSound: (sound) => set({ collectSound: sound }),
  setBuildSound: (sound) => set({ buildSound: sound }),
  
  toggleMute: () => {
    const { isMuted, backgroundMusic } = get();
    const newMutedState = !isMuted;
    
    // Müzik çalarsa durdur, durmuşsa çalmaya başlat
    if (backgroundMusic) {
      if (newMutedState) {
        backgroundMusic.pause();
      } else {
        try {
          const context = new (window.AudioContext || (window as any).webkitAudioContext)();
          context.resume().then(() => {
            backgroundMusic.play().catch(error => {
              // Hata mesajını konsola yazdırmayalım, hata oluşursa sessizce devam et
              console.log("Müzik başlatılıyor: Kullanıcı etkileşimi bekliyor");
            });
          });
        } catch (e) {
          // Eğer AudioContext desteklenmiyorsa sessizce devam et
        }
      }
    }
    
    // Just update the muted state
    set({ isMuted: newMutedState });
  },
  
  playHit: () => {
    const { hitSound, isMuted } = get();
    if (hitSound && !isMuted) {
      try {
        // Clone the sound to allow overlapping playback
        const soundClone = hitSound.cloneNode() as HTMLAudioElement;
        soundClone.volume = 0.3;
        
        // Kullanıcı etkileşimi varsa ses çal
        const playPromise = soundClone.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Hata durumunda sessizce devam et
          });
        }
      } catch (e) {
        // Hata durumunda sessizce devam et
      }
    }
  },
  
  playSuccess: () => {
    const { successSound, isMuted } = get();
    if (successSound && !isMuted) {
      try {
        successSound.currentTime = 0;
        
        // Kullanıcı etkileşimi varsa ses çal
        const playPromise = successSound.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Hata durumunda sessizce devam et
          });
        }
      } catch (e) {
        // Hata durumunda sessizce devam et
      }
    }
  },
  
  playClick: () => {
    const { clickSound, isMuted } = get();
    if (clickSound && !isMuted) {
      try {
        const soundClone = clickSound.cloneNode() as HTMLAudioElement;
        soundClone.volume = 0.2;
        
        // Kullanıcı etkileşimi varsa ses çal
        const playPromise = soundClone.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Hata durumunda sessizce devam et
          });
        }
      } catch (e) {
        // Hata durumunda sessizce devam et
      }
    } else if (!isMuted) {
      // Geçici bir tıklama sesi
      get().playHit();
    }
  },
  
  playCollect: () => {
    const { collectSound, isMuted } = get();
    if (collectSound && !isMuted) {
      try {
        const soundClone = collectSound.cloneNode() as HTMLAudioElement;
        soundClone.volume = 0.2;
        
        // Kullanıcı etkileşimi varsa ses çal
        const playPromise = soundClone.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Hata durumunda sessizce devam et
          });
        }
      } catch (e) {
        // Hata durumunda sessizce devam et
      }
    } else if (!isMuted) {
      // Geçici bir ses
      get().playSuccess();
    }
  },
  
  playBuild: () => {
    const { buildSound, isMuted } = get();
    if (buildSound && !isMuted) {
      try {
        const soundClone = buildSound.cloneNode() as HTMLAudioElement;
        soundClone.volume = 0.2;
        
        // Kullanıcı etkileşimi varsa ses çal
        const playPromise = soundClone.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Hata durumunda sessizce devam et
          });
        }
      } catch (e) {
        // Hata durumunda sessizce devam et
      }
    } else if (!isMuted) {
      // Geçici bir ses
      get().playSuccess();
    }
  }
}));
