import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useGameStore } from "../lib/stores/useGameStore";
import { CardType } from "../lib/game/types";

interface CardProps {
  card: CardType;
  position?: [number, number, number];
  isPlaced?: boolean;
  isHand?: boolean;
  index?: number;
}

const Card = ({ card, position = [0, 0, 0], isPlaced = false, isHand = false, index = 0 }: CardProps) => {
  const meshRef = useRef<THREE.Group>(null);
  const { selectedCard, setSelectedCard } = useGameStore();
  const [hovered, setHovered] = useState(false);
  
  // Load texture
  const texture = useTexture("/textures/wood.jpg");
  
  // Card's visual properties based on state
  const isSelected = selectedCard?.id === card.id;
  const scale = isSelected ? 1.1 : hovered ? 1.05 : 1;
  const hoverY = isSelected ? 0.5 : hovered ? 0.3 : 0;
  
  // Calculate card colors based on card properties
  const getCardColor = () => {
    // Different rarities have different colors
    switch (card.rarity) {
      case "common": return "#aaaaaa";
      case "rare": return "#4477dd";
      case "epic": return "#aa44dd";
      case "legendary": return "#ffaa22";
      default: return "#ffffff";
    }
  };
  
  // Set up card position in hand
  const handPosition = isHand ? [
    -2 + index * 1.2, // X position spaced out based on index
    0.5, // Y position
    position[2] // Z position from props
  ] : position;
  
  // Animate the card
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    
    // Smooth transitions for hover and selection states
    if (isHand) {
      const targetY = 0.5 + (hovered ? 0.3 : 0) + (isSelected ? 0.5 : 0);
      meshRef.current.position.y += (targetY - meshRef.current.position.y) * 5 * delta;
      
      // Scale effect
      const targetScale = scale;
      meshRef.current.scale.x += (targetScale - meshRef.current.scale.x) * 5 * delta;
      meshRef.current.scale.y += (targetScale - meshRef.current.scale.y) * 5 * delta;
      meshRef.current.scale.z += (targetScale - meshRef.current.scale.z) * 5 * delta;
    }
    
    // Add a subtle floating animation for placed cards
    if (isPlaced) {
      meshRef.current.position.y = position[1] + Math.sin(Date.now() * 0.002) * 0.05;
      
      // Rotation effect for combat cards
      if (card.isAttacking) {
        meshRef.current.rotation.y += delta * 2;
      } else {
        // Smoothly rotate back to facing forward
        meshRef.current.rotation.y += (0 - meshRef.current.rotation.y) * delta;
      }
    }
  });
  
  // Handle card selection
  const handleClick = () => {
    if (isHand) {
      setSelectedCard(isSelected ? null : card);
    }
  };
  
  return (
    <group
      ref={meshRef}
      position={isHand ? handPosition as [number, number, number] : position}
      rotation={[0, 0, 0]}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Card base */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.1, 1.2]} />
        <meshStandardMaterial 
          color={getCardColor()} 
          map={texture} 
          metalness={0.2} 
          roughness={0.8}
        />
      </mesh>
      
      {/* Card face with stats */}
      <mesh position={[0, 0.06, 0]} castShadow>
        <boxGeometry args={[0.7, 0.01, 1.1]} />
        <meshStandardMaterial color="#f8f8f8" />
      </mesh>
      
      {/* Champion name */}
      <Text
        position={[0, 0.07, -0.4]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.13}
        color="#000000"
        maxWidth={0.6}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
      >
        {card.name}
      </Text>
      
      {/* Attack stat */}
      <group position={[-0.25, 0.07, 0.4]}>
        <mesh>
          <circleGeometry args={[0.15, 32]} />
          <meshStandardMaterial color="#d04040" />
        </mesh>
        <Text
          position={[0, 0.01, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.15}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {card.attack}
        </Text>
      </group>
      
      {/* Health stat */}
      <group position={[0.25, 0.07, 0.4]}>
        <mesh>
          <circleGeometry args={[0.15, 32]} />
          <meshStandardMaterial color="#40a040" />
        </mesh>
        <Text
          position={[0, 0.01, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.15}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {card.health}
        </Text>
      </group>
      
      {/* Class icon */}
      <group position={[0, 0.07, 0]}>
        <mesh>
          <circleGeometry args={[0.12, 32]} />
          <meshStandardMaterial color="#4488cc" />
        </mesh>
        <Text
          position={[0, 0.01, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.11}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {card.class.charAt(0).toUpperCase()}
        </Text>
      </group>
      
      {/* Show owner indicator */}
      {isPlaced && (
        <mesh position={[0, -0.06, 0]}>
          <boxGeometry args={[0.8, 0.01, 1.2]} />
          <meshStandardMaterial color={card.owner === "player" ? "#3377ff" : "#ff3333"} />
        </mesh>
      )}
    </group>
  );
};

export default Card;
