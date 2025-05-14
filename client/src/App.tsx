import { KeyboardControls } from "@react-three/drei";
import { Suspense, useEffect, useState } from "react";
import { useAudio } from "./lib/stores/useAudio";
import { usePeacockIslandsStore } from "./lib/stores/usePeacockIslandsStore";
import GameMenu from "./components/PeacockIslands/GameMenu";
import PreparationPhase from "./components/PeacockIslands/PreparationPhase";
import BattlePhase from "./components/PeacockIslands/BattlePhase";
import GameOver from "./components/PeacockIslands/GameOver";
import "@fontsource/inter";

// Controls mapping for the game
const controls = [
  { name: "select", keys: ["Space"] },
  { name: "confirm", keys: ["Enter"] },
  { name: "cancel", keys: ["Escape"] },
  { name: "up", keys: ["ArrowUp", "KeyW"] },
  { name: "down", keys: ["ArrowDown", "KeyS"] },
  { name: "left", keys: ["ArrowLeft", "KeyA"] },
  { name: "right", keys: ["ArrowRight", "KeyD"] },
];

// Main App component that handles the game state and renders the appropriate components
function App() {
  const { currentPhase } = usePeacockIslandsStore();
  const [isLoaded, setIsLoaded] = useState(false);
  const { setBackgroundMusic, setHitSound, setSuccessSound } = useAudio();

  // Load audio elements once the component mounts
  useEffect(() => {
    // Load game sounds
    const bgMusic = new Audio("/sounds/background.mp3");
    bgMusic.loop = true;
    bgMusic.volume = 0.4;
    
    const hitSfx = new Audio("/sounds/hit.mp3");
    hitSfx.volume = 0.5;
    
    const successSfx = new Audio("/sounds/success.mp3");
    successSfx.volume = 0.5;
    
    // Store audio elements in the audio store
    setBackgroundMusic(bgMusic);
    setHitSound(hitSfx);
    setSuccessSound(successSfx);
    
    // Show the UI after a short delay to ensure resources are loaded
    setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    
    // Log initialization
    console.log("Game initialized");
  }, [setBackgroundMusic, setHitSound, setSuccessSound]);

  return (
    <div className="w-full h-full">
      {isLoaded && (
        <KeyboardControls map={controls}>
          <Suspense fallback={<div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">Yükleniyor...</div>}>
            {/* Oyun fazına göre bileşenleri göster */}
            {currentPhase === "menu" && <GameMenu />}
            
            {currentPhase === "preparation" && <PreparationPhase />}
            
            {currentPhase === "battle" && <BattlePhase />}
            
            {currentPhase === "gameOver" && <GameOver />}
          </Suspense>
          
          {/* Link to material icons */}
          <link 
            href="https://fonts.googleapis.com/icon?family=Material+Icons" 
            rel="stylesheet" 
          />
        </KeyboardControls>
      )}
    </div>
  );
}

export default App;
