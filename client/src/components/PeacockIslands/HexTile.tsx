import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePeacockIslandsStore } from '../../lib/stores/usePeacockIslandsStore';

interface HexCoordinates {
  q: number;
  r: number;
  s: number;
}

interface HexTileProps {
  position: [number, number, number];
  hexCoords: HexCoordinates;
  onHover: () => void;
  isHovered: boolean;
  isPlayerSide: boolean;
  isOccupied: boolean;
}

const HexTile: React.FC<HexTileProps> = ({ 
  position, 
  hexCoords, 
  onHover, 
  isHovered, 
  isPlayerSide, 
  isOccupied
}: HexTileProps) => {
  // Aktif oyuncunun yumurta rengine göre renklendirme özelliği 
  const { player } = usePeacockIslandsStore();
  
  // Aktif kuluçkaya alınmış yumurta var mı kontrol et
  const activeEggSlot = player.island.hatchery?.find((slot) => slot.isActive === true && slot.egg !== null);
  const activeEggColor = activeEggSlot?.egg?.color || null;

  // Renklendirme: Başlangıçta beyaz, yumurta aktivasyonuna göre renk değişimi
  let tileBaseColor = "#ffffff"; // Varsayılan beyaz
  let tileHoverColor = "#f0f0f0"; // Hover halinde biraz daha koyu
  let tileEdgeColor = "#e0e0e0"; // Kenar rengi

  // Eğer aktif yumurta varsa rengi değiştir
  if (isPlayerSide && activeEggColor) {
    switch (activeEggColor) {
      case "green":
        tileBaseColor = "#4caf50"; // Yeşil
        tileHoverColor = "#66bb6a"; 
        tileEdgeColor = "#388e3c";
        break;
      case "blue":
        tileBaseColor = "#2196f3"; // Mavi
        tileHoverColor = "#42a5f5"; 
        tileEdgeColor = "#1976d2";
        break;
      case "orange":
        tileBaseColor = "#ff9800"; // Turuncu
        tileHoverColor = "#ffa726"; 
        tileEdgeColor = "#f57c00";
        break;
      default:
        // Varsayılan beyaz kalır
        break;
    }
  }
  
  const baseColor = tileBaseColor;
  const hoverColor = tileHoverColor;
  const edgeColor = tileEdgeColor;

  // Hexagon'un ölçüleri - sabit
  const size = 0.45;

  // Hover animasyonu için
  const scale = useRef(new THREE.Vector3(1, 1, 1));
  const hoverHeight = useRef(0);
  const glowIntensity = useRef(0.3);

  // Hover durumunda yumuşak animasyon için frame bazlı güncelleme
  useFrame(() => {
    if (isHovered) {
      // Hover durumunda iç ve dış geometri birlikte hareket eder
      scale.current.lerp(new THREE.Vector3(1.1, 1.1, 1.1), 0.15);
      hoverHeight.current += (0.15 - hoverHeight.current) * 0.15;
      glowIntensity.current += (1.0 - glowIntensity.current) * 0.2;
    } else {
      // Normal durumda aynı şekilde birlikte hareket
      scale.current.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      hoverHeight.current += (0 - hoverHeight.current) * 0.15;
      glowIntensity.current += (0.3 - glowIntensity.current) * 0.15;
    }
  });

  // Position TypeScript hatası düzeltmesi
  const safePosition = Array.isArray(position) ? 
    [position[0] || 0, position[1] || 0, position[2] || 0] as [number, number, number] : 
    [0, 0, 0] as [number, number, number];

  return (
    <group 
      position={safePosition} 
      onPointerOver={onHover}
      onClick={onHover}
    >
      <group position={[0, hoverHeight.current, 0]} scale={scale.current}>
        {/* Dış çizgi - hep beyaz (çizgi grafiğindeki gibi) - 180 derece döndürülmüş */}
        <mesh rotation={[-Math.PI / 2, Math.PI, 0]} position={[0, 0.025, 0]}>
          <ringGeometry args={[size * 0.94, size * 1.05, 6]} />
          <meshBasicMaterial 
            color={isHovered ? "#ffffff" : edgeColor}
            side={THREE.DoubleSide}
            transparent={false}
          />
        </mesh>
        
        {/* İç kısım - renk değişimi burada olur - 180 derece döndürülmüş (advanced mode) */}
        <mesh rotation={[-Math.PI / 2, Math.PI, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0, size * 0.92, 6]} />
          <meshStandardMaterial 
            color={isHovered ? hoverColor : baseColor}
            emissive={isHovered ? hoverColor : baseColor}
            emissiveIntensity={0.5}
            roughness={0.1}
            metalness={0.9}
          />
        </mesh>
      </group>
    </group>
  );
};

export default HexTile;