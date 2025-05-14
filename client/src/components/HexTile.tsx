import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { HexCoordinates } from "../lib/game/types";
import { useGameStore } from "../lib/stores/useGameStore";

interface HexTileProps {
  position: [number, number, number];
  hexCoords: HexCoordinates;
  onHover: () => void;
  isHovered: boolean;
  isPlayerSide: boolean;
  isOccupied: boolean;
}

const HexTile = ({
  position,
  hexCoords,
  onHover,
  isHovered,
  isPlayerSide,
  isOccupied
}: HexTileProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { gamePhase, selectedCard } = useGameStore();
  const [pointerOver, setPointerOver] = useState(false);
  
  // Load texture
  const texture = useTexture("/textures/grass.png");
  
  // Create hex shape geometry
  const hexShape = useMemo(() => {
    const shape = new THREE.Shape();
    const size = 0.9; // Slightly smaller than position spacing to create gaps
    
    // Create a hexagon shape
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = size * Math.cos(angle);
      const y = size * Math.sin(angle);
      if (i === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }
    }
    shape.closePath();
    
    return shape;
  }, []);
  
  // Handle hex hover effects
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    
    // Animate the hex tile when hovered
    const targetY = isHovered ? 0.1 : 0;
    meshRef.current.position.y += (targetY - meshRef.current.position.y) * 5 * delta;
    
    // Color change based on state
    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    
    // Base color based on side (player/enemy)
    let targetColor = isPlayerSide ? new THREE.Color(0x6688cc) : new THREE.Color(0xcc6666);
    
    // Modify color for occupied tiles
    if (isOccupied) {
      targetColor = new THREE.Color(targetColor).lerp(new THREE.Color(0x333333), 0.3);
    }
    
    // Highlight when hovered
    if (isHovered && selectedCard && gamePhase === "playing") {
      targetColor = new THREE.Color(0x44ff44);
    }
    
    // Smooth color transition
    material.color.lerp(targetColor, 5 * delta);
  });
  
  // Handle pointer events
  const handlePointerOver = () => {
    setPointerOver(true);
    onHover();
  };
  
  const handlePointerOut = () => {
    setPointerOver(false);
  };
  
  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      castShadow
      receiveShadow
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <extrudeGeometry
        args={[
          hexShape,
          {
            depth: 0.1,
            bevelEnabled: true,
            bevelSegments: 2,
            bevelSize: 0.02,
            bevelThickness: 0.02
          }
        ]}
      />
      <meshStandardMaterial
        map={texture}
        color={isPlayerSide ? 0x6688cc : 0xcc6666} 
        roughness={0.8}
        metalness={0.2}
      />
    </mesh>
  );
};

export default HexTile;
