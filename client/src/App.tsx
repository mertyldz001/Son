import { Canvas } from "@react-three/fiber";
import { KeyboardControls, Stats } from "@react-three/drei";
import { Suspense, useEffect, useState } from "react";
import { useAudio } from "./lib/stores/useAudio";
import GameUI from "./components/UI/GameUI";
import GameMenu from "./components/UI/GameMenu";
import GameOver from "./components/UI/GameOver";
import GameBoard from "./components/GameBoard";
import { useGameStore } from "./lib/stores/useGameStore";
import "@fontsource/inter";

// Controls mapping for the game
const controls = [
  { name: "rotate", keys: ["KeyR"] },
  { name: "place", keys: ["Space"] },
  { name: "forward", keys: ["KeyW", "ArrowUp"] },
  { name: "backward", keys: ["KeyS", "ArrowDown"] },
  { name: "leftward", keys: ["KeyA", "ArrowLeft"] },
  { name: "rightward", keys: ["KeyD", "ArrowRight"] },
];

// Main App component that handles the game state and renders the appropriate components
function App() {
  const { gamePhase, setGamePhase } = useGameStore();
  const [showCanvas, setShowCanvas] = useState(false);
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
    
    // Show the canvas after a short delay to ensure resources are loaded
    setShowCanvas(true);
    
    // Log initialization
    console.log("Game initialized");
  }, [setBackgroundMusic, setHitSound, setSuccessSound]);

  return (
    <div className="w-full h-full">
      {showCanvas && (
        <KeyboardControls map={controls}>
          {gamePhase === "menu" && <GameMenu />}

          {(gamePhase === "playing" || gamePhase === "enemyTurn") && (
            <>
              <Canvas
                shadows
                camera={{
                  position: [0, 10, 10],
                  fov: 45,
                  near: 0.1,
                  far: 1000
                }}
                gl={{
                  antialias: true,
                  powerPreference: "default"
                }}
              >
                <color attach="background" args={["#111122"]} />
                
                {/* Lighting setup */}
                <ambientLight intensity={0.5} />
                <directionalLight 
                  position={[10, 10, 5]} 
                  intensity={1} 
                  castShadow 
                  shadow-mapSize={[2048, 2048]} 
                />
                
                <Suspense fallback={null}>
                  <GameBoard />
                </Suspense>
                
                {process.env.NODE_ENV === "development" && <Stats />}
              </Canvas>
              <GameUI />
            </>
          )}

          {gamePhase === "gameOver" && <GameOver />}
        </KeyboardControls>
      )}
    </div>
  );
}

export default App;
