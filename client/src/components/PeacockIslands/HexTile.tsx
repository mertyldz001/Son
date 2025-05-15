import React, { useRef, useMemo } from 'react';
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

  // Hexagon'un ölçüleri - daha büyük aralıklı 
  const size = 0.7; // En büyük hex ölçüsü - referans görüntüdeki gibi geniş aralıklar için

  // İnce çizgili hexagon için geometri değişiklikleri
  const hexLineWidth = 0.02; // Orta kalınlıkta kenar çizgisi
  
  // Geometrileri memorize et - performans için aynı geometriler tekrar tekrar oluşturulmasın
  const outerRingGeometry = useMemo(() => new THREE.RingGeometry(size - hexLineWidth, size, 6), [size, hexLineWidth]);
  
  // Işıklı halka efekti için ek geometri
  const glowRingGeometry = useMemo(() => new THREE.RingGeometry(size + 0.01, size + 0.02, 6), [size]);

  // Hover animasyonu için
  const scale = useRef(new THREE.Vector3(1, 1, 1));
  const hoverHeight = useRef(0);
  const glowIntensity = useRef(0.3);

  // Performans optimizasyonu: Update sayacı - her 2 frame'de bir hesaplama yapar
  const frameCounter = useRef(0);
  
  // Hover durumunda yumuşak animasyon için frame bazlı güncelleme - optimize edildi
  useFrame((_, delta) => {
    // Performans optimizasyonu - her frame'de değil belirli frame'lerde güncelle
    frameCounter.current++;
    if (frameCounter.current % 2 !== 0) return;
    frameCounter.current = 0;
    
    // Lerp faktörü hesaplaması - delta bazlı, daha tutarlı ve verimli
    const lerpFactor = Math.min(0.15 * delta * 60, 1);
    const relaxFactor = Math.min(0.1 * delta * 60, 1);
    
    if (isHovered) {
      // Hover durumunda - manuel hızlı hesaplama
      scale.current.x += (1.1 - scale.current.x) * lerpFactor;
      scale.current.y += (1.1 - scale.current.y) * lerpFactor;
      scale.current.z += (1.1 - scale.current.z) * lerpFactor;
      
      hoverHeight.current += (0.15 - hoverHeight.current) * lerpFactor;
      glowIntensity.current += (1.0 - glowIntensity.current) * lerpFactor;
    } else {
      // Normal durumda - manuel hızlı hesaplama
      scale.current.x += (1 - scale.current.x) * relaxFactor;
      scale.current.y += (1 - scale.current.y) * relaxFactor;
      scale.current.z += (1 - scale.current.z) * relaxFactor;
      
      hoverHeight.current += (0 - hoverHeight.current) * relaxFactor;
      glowIntensity.current += (0.3 - glowIntensity.current) * relaxFactor;
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
        {/* Geometri ve materyal optimizasyonu - azaltılmış hesaplamalar */}
        {/* Dış çizgi - sadece ince kenarlı altıgen - daha estetik */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
          <primitive attach="geometry" object={outerRingGeometry} />
          <meshBasicMaterial 
            color={isHovered ? (isPlayerSide ? "#80cbc4" : "#ef9a9a") : "#ffffff"}
            side={THREE.DoubleSide}
            transparent={true}
            opacity={isHovered ? 1.0 : 0.9}
            toneMapped={false} // Daha az post-processing
          />
        </mesh>
        
        {/* İç kısım - artık iç kısım yok, sadece dış çizgi var */}
        
        {/* Işıklı halka efekti - hover durumunda görünür */}
        {isHovered && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <primitive attach="geometry" object={glowRingGeometry} />
            <meshBasicMaterial 
              color={isPlayerSide ? "#4db6ac" : "#e57373"}
              side={THREE.DoubleSide}
              transparent={true}
              opacity={0.7}
              toneMapped={false}
            />
          </mesh>
        )}
      </group>
    </group>
  );
};

export default HexTile;