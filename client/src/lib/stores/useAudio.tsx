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
  isMuted: true, // Start muted by default
  
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
        backgroundMusic.play().catch(error => {
          console.log("Müzik başlatılamadı:", error);
        });
      }
    }
    
    // Just update the muted state
    set({ isMuted: newMutedState });
    
    // Log the change
    console.log(`Sound ${newMutedState ? 'muted' : 'unmuted'}`);
  },
  
  playHit: () => {
    const { hitSound, isMuted } = get();
    if (hitSound) {
      // If sound is muted, don't play anything
      if (isMuted) {
        console.log("Hit sound skipped (muted)");
        return;
      }
      
      // Clone the sound to allow overlapping playback
      const soundClone = hitSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.3;
      soundClone.play().catch(error => {
        console.log("Hit sound play prevented:", error);
      });
    }
  },
  
  playSuccess: () => {
    const { successSound, isMuted } = get();
    if (successSound) {
      // If sound is muted, don't play anything
      if (isMuted) {
        console.log("Success sound skipped (muted)");
        return;
      }
      
      successSound.currentTime = 0;
      successSound.play().catch(error => {
        console.log("Success sound play prevented:", error);
      });
    }
  },
  
  playClick: () => {
    const { clickSound, isMuted } = get();
    if (clickSound) {
      if (isMuted) {
        console.log("Click sound skipped (muted)");
        return;
      }
      
      const soundClone = clickSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.2;
      soundClone.play().catch(error => {
        console.log("Click sound play prevented:", error);
      });
    } else {
      // Geçici bir tıklama sesi
      get().playHit();
    }
  },
  
  playCollect: () => {
    const { collectSound, isMuted } = get();
    if (collectSound) {
      if (isMuted) {
        console.log("Collect sound skipped (muted)");
        return;
      }
      
      const soundClone = collectSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.2;
      soundClone.play().catch(error => {
        console.log("Collect sound play prevented:", error);
      });
    } else {
      // Geçici bir ses
      get().playSuccess();
    }
  },
  
  playBuild: () => {
    const { buildSound, isMuted } = get();
    if (buildSound) {
      if (isMuted) {
        console.log("Build sound skipped (muted)");
        return;
      }
      
      const soundClone = buildSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.2;
      soundClone.play().catch(error => {
        console.log("Build sound play prevented:", error);
      });
    } else {
      // Geçici bir ses
      get().playSuccess();
    }
  }
}));
