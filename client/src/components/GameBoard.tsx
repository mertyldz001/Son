import { useThree, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useGameStore } from "../lib/stores/useGameStore";
import { useKeyboardControls } from "@react-three/drei";
import { useAudio } from "../lib/stores/useAudio";
import { processAITurn } from "../lib/game/ai";
import { processCombat } from "../lib/game/combat";
import HexTile from "./HexTile";
import Card from "./Card";
import DragControls from "./DragControls";

// Define the radius of the hex board (number of hexes from center to edge)
const BOARD_RADIUS = 3;
// Size of each hex
const HEX_SIZE = 1;

const GameBoard = () => {
  const { 
    gameState, 
    gamePhase, 
    playerHand, 
    enemyHand, 
    placedCards,
    hoveredHex,
    setHoveredHex,
    placeCard,
    setGamePhase,
    setSelectedCard,
    selectedCard,
    endPlayerTurn,
    resetBoard
  } = useGameStore();
  
  const { playHit } = useAudio();
  const { camera } = useThree();
  const clockRef = useRef(new THREE.Clock());

  // Generate hex grid positions
  const hexPositions = useMemo(() => {
    const positions = [];
    
    // Generate a hex grid with the given radius
    for (let q = -BOARD_RADIUS; q <= BOARD_RADIUS; q++) {
      for (let r = -BOARD_RADIUS; r <= BOARD_RADIUS; r++) {
        // Skip invalid positions that would make the board too large
        if (Math.abs(q + r) > BOARD_RADIUS) continue;
        
        // Convert hex coordinates to 3D space
        const x = HEX_SIZE * (3/2 * q);
        const z = HEX_SIZE * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
        
        // Add position with hex coordinates
        positions.push({ x, z, q, r, s: -q-r });
      }
    }
    
    return positions;
  }, []);

  // Keyboard controls
  const [, getKeyboardControls] = useKeyboardControls();
  
  // Initial camera setup
  useEffect(() => {
    // Position camera to view the board at an angle
    camera.position.set(0, 10, 10);
    camera.lookAt(0, 0, 0);
    
    // Reset the board when component mounts
    resetBoard();
    
    console.log("Game board initialized with", hexPositions.length, "hex tiles");
  }, [camera, hexPositions.length, resetBoard]);

  // Game loop
  useFrame(() => {
    const delta = clockRef.current.getDelta();
    
    // Handle AI turn
    if (gamePhase === "enemyTurn") {
      // Process AI's turn with some delay to make it feel natural
      if (clockRef.current.getElapsedTime() > 1.5) {
        processAITurn();
        clockRef.current.start(); // Reset the clock
        
        // After AI places its cards, start combat
        processCombat(playHit);
        
        // End enemy turn, back to player
        setGamePhase("playing");
      }
    }
    
    // Process drag and drop logic
    if (gamePhase === "playing" && selectedCard) {
      const controls = getKeyboardControls();
      
      // Handle placing cards with keyboard
      if (controls.place && hoveredHex) {
        placeCard(selectedCard, hoveredHex);
        setSelectedCard(null);
        playHit();
      }
    }
  });

  return (
    <group>
      {/* Board base */}
      <mesh 
        position={[0, -0.1, 0]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        receiveShadow
      >
        <planeGeometry args={[15, 15]} />
        <meshStandardMaterial color="#0a0a1a" />
      </mesh>
      
      {/* Render hex tiles */}
      {hexPositions.map((pos, index) => (
        <HexTile 
          key={`hex-${index}`}
          position={[pos.x, 0, pos.z]} 
          hexCoords={{ q: pos.q, r: pos.r, s: pos.s }}
          onHover={() => setHoveredHex({ q: pos.q, r: pos.r, s: pos.s })}
          isHovered={hoveredHex?.q === pos.q && hoveredHex?.r === pos.r}
          isPlayerSide={pos.z > 0}
          isOccupied={placedCards.some(card => 
            card.position.q === pos.q && 
            card.position.r === pos.r
          )}
        />
      ))}
      
      {/* Render placed cards */}
      {placedCards.map((placedCard, index) => {
        // Find the world position for this card based on its hex coordinates
        const hexPos = hexPositions.find(
          pos => pos.q === placedCard.position.q && pos.r === placedCard.position.r
        );
        
        if (!hexPos) return null;
        
        return (
          <Card
            key={`placed-${placedCard.id}`}
            card={placedCard}
            position={[hexPos.x, 0.5, hexPos.z]}
            isPlaced={true}
          />
        );
      })}
      
      {/* Drag controls for cards */}
      <DragControls />
    </group>
  );
};

export default GameBoard;
