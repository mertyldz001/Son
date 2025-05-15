import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePeacockIslandsStore } from '../../lib/stores/usePeacockIslandsStore';
import { PeacockWarriorModel, HumanSoldierModel } from './3DModels';
import { Unit } from '../../lib/types';

interface HexCoordinates {
  q: number;
  r: number;
  s: number;
}

interface HexTileProps {
  position: [number, number, number];
  size: number;
  hexCoords: HexCoordinates;
  isPlayerSide: boolean;
  isHovered: boolean;
  isOccupied: boolean;
  onHover: () => void;
  onUnhover: () => void;
}

function HexTile({ 
  position, 
  size, 
  hexCoords, 
  isPlayerSide, 
  isHovered, 
  isOccupied,
  onHover, 
  onUnhover 
}: HexTileProps) {
  // Aktif oyuncunun yumurta rengine göre renklendirme özelliği
  const { player } = usePeacockIslandsStore();
  
  // Aktif kuluçkaya alınmış yumurta var mı kontrol et (1. İstek: Renk değişimi)
  const activeEggSlot = player.island.hatchery.find((slot) => slot.isActive === true && slot.egg !== null);
  const activeEggColor = activeEggSlot?.egg?.color || null;

  // Renklendirme: Başlangıçta beyaz, yumurta aktivasyonuna göre renk değişimi (1. İstek)
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
  
  // TFT stili hover animasyonu - yumuşak geçişli
  const hoverScale = useRef(new THREE.Vector3(1, 1, 1));
  const hoverHeight = useRef(0);
  const glowIntensity = useRef(0.3);

  // Hover animasyonu - TFT stili yumuşak geçiş - İÇ VE DIŞ HER ZAMAN UYUMLU
  useFrame(() => {
    if (isHovered) {
      // Hover durumunda iç ve dış geometri birlikte hareket eder
      hoverScale.current.lerp(new THREE.Vector3(1.1, 1.1, 1.1), 0.15);
      hoverHeight.current += (0.15 - hoverHeight.current) * 0.15;
      glowIntensity.current += (1.0 - glowIntensity.current) * 0.2;
    } else {
      // Normal durumda aynı şekilde birlikte hareket
      hoverScale.current.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      hoverHeight.current += (0 - hoverHeight.current) * 0.15;
      glowIntensity.current += (0.3 - glowIntensity.current) * 0.15;
    }
  });
  
  // TypeScript hata düzeltmesi (3. İstek)
  const safePosition = Array.isArray(position) ? 
    [position[0] || 0, position[1] || 0, position[2] || 0] as [number, number, number] : 
    [0, 0, 0] as [number, number, number];
  
  return (
    <group position={safePosition}>
      {/* Tamamı altıgen olarak yeniden düzenlendi */}
      <group
        position={[0, hoverHeight.current, 0]}
        scale={hoverScale.current}
        onClick={onHover}
        onPointerEnter={onHover}
        onPointerLeave={onUnhover}
        userData={{
          hexCoords,
          isPlayerSide,
          isOccupied
        }}
      >
        {/* DIŞARIDA ALTIGEN ÇIZGI - KALIN VE NET */}
        <mesh rotation={[-Math.PI / 2, Math.PI, 0]} position={[0, 0.025, 0]}>
          <ringGeometry args={[size * 0.94, size * 1.05, 6]} />
          <meshBasicMaterial 
            color={isHovered ? "#ffffff" : edgeColor}
            side={THREE.DoubleSide}
            transparent={false}
          />
        </mesh>
        
        {/* İÇERDEKI RENK ALANI - ALTIGEN - 180 derece çevrildi (2. İstek) */}
        <mesh rotation={[-Math.PI / 2, Math.PI, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0, size * 0.92, 6]} />
          <meshStandardMaterial 
            color={isHovered ? hoverColor : baseColor}
            emissive={isHovered ? hoverColor : baseColor}
            emissiveIntensity={0.4}
            roughness={0.2}
            metalness={0.7}
          />
        </mesh>
      </group>
      
      {/* Koordinat bilgisi (debug için) */}
      {/* <Text
        position={[0, 0.3, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {hexCoords.q},{hexCoords.r},{hexCoords.s}
      </Text> */}
    </group>
  );
}

interface HexGridProps {
  size?: number;
  gridWidth?: number;
  gridHeight?: number;
  unitPositions: Map<string, Unit>;
  onTileHover: (coords: HexCoordinates) => void;
}

const HexGrid: React.FC<HexGridProps> = ({ 
  size = 0.7, 
  gridWidth = 7, 
  gridHeight = 6,
  unitPositions,
  onTileHover
}) => {
  const [hoveredTile, setHoveredTile] = useState<HexCoordinates | null>(null);

  // Hexagon grid oluşturma
  const hexagons = [];
  
  // Ekran görüntüsündeki düzene uygun grid oluşturma
  // Tam balık pulu şeklinde nizami dizilim
  const totalRows = 3; // Oyuncu ve düşman tarafı için ayrı ayrı 3'er sıra (toplam 6)
  const columnsPerRow = 7; // Her sırada 7 sütun
  
  // Başlangıçta gridWidth ve gridHeight değerleri yerine sabit değerler kullanalım
  gridWidth = columnsPerRow;
  gridHeight = totalRows * 2; // Toplam 6 sıra (3 oyuncu + 3 düşman)
  
  // Daha düzenli ve nizami görünüm için sıklaştırma faktörleri
  const horizontalSpacing = size * 1.05; // Yatay hücreler arası mesafe
  const verticalSpacing = size * 0.85;   // Dikey hücreler arası mesafe
  const gridWidthTotal = horizontalSpacing * columnsPerRow; // Grid toplam genişliği
  
  // Grid merkezi
  const centerX = 0;
  const centerZ = 0;
  
  // Önce oyuncu tarafı (ilk 3 sıra)
  for (let row = 0; row < totalRows; row++) {
    for (let col = 0; col < columnsPerRow; col++) {
      const r = row;
      const q = col;
      const s = -q - r;
      const key = `${q},${r},${s}`;
      
      // Altıgenlerin balıksırtı/petek düzeni için offset hesaplama
      // Tek numaralı sıralar yarım birim sağa kaydırılır
      const rowOffset = row % 2 === 1 ? horizontalSpacing / 2 : 0;
      
      // X pozisyonu: Grid'in merkezini referans alarak ve petek düzeni için offset uygulayarak
      const x = centerX + (col * horizontalSpacing) - (gridWidthTotal / 2) + (horizontalSpacing / 2) + rowOffset;
      
      // Z pozisyonu: Oyuncu tarafı (pozitif z) - aşağıdan yukarı sıralanır
      const z = centerZ + (verticalSpacing * (totalRows - 1 - row));
      
      // Bu tam olarak oyuncu tarafı (ilk 3 sıra)
      const isPlayerSide = true;
      
      // Pozisyon oluşturma ve hex grid'e ekleme
      const position: [number, number, number] = [x, 0, z];
      
      // Altıgen hücreyi oluştur ve ekle
      hexagons.push(
        <HexTile 
          key={key}
          position={position}
          size={size}
          hexCoords={{ q, r, s }}
          isPlayerSide={isPlayerSide}
          isHovered={hoveredTile ? hoveredTile.q === q && hoveredTile.r === r && hoveredTile.s === s : false}
          isOccupied={Boolean(unitPositions.get(key))}
          onHover={() => {
            setHoveredTile({ q, r, s });
            onTileHover({ q, r, s });
          }}
          onUnhover={() => {}}
        />
      );
    }
  }
  
  // Sonra düşman tarafı (son 3 sıra) - negatif z yönünde
  for (let row = 0; row < totalRows; row++) {
    for (let col = 0; col < columnsPerRow; col++) {
      const r = row + totalRows; // Düşman koordinatları için offset
      const q = col;
      const s = -q - r;
      const key = `${q},${r},${s}`;
      
      // Altıgenlerin balıksırtı/petek düzeni için offset hesaplama
      // Tek numaralı sıralar yarım birim sağa kaydırılır
      const rowOffset = row % 2 === 1 ? horizontalSpacing / 2 : 0;
      
      // X pozisyonu: Grid'in merkezini referans alarak ve petek düzeni için offset uygulayarak
      const x = centerX + (col * horizontalSpacing) - (gridWidthTotal / 2) + (horizontalSpacing / 2) + rowOffset;
      
      // Z pozisyonu: Düşman tarafı (negatif z) - yukarıdan aşağı sıralanır
      const z = centerZ - (verticalSpacing * row) - verticalSpacing; // Boşluk ekleyerek
      
      // Bu düşman tarafı (son 3 sıra)
      const isPlayerSide = false;
      
      // Pozisyon oluşturma ve hex grid'e ekleme 
      const position: [number, number, number] = [x, 0, z];
      
      // Altıgen hücreyi oluştur ve ekle
      hexagons.push(
        <HexTile 
          key={key}
          position={position}
          size={size}
          hexCoords={{ q, r, s }}
          isPlayerSide={isPlayerSide}
          isHovered={hoveredTile ? hoveredTile.q === q && hoveredTile.r === r && hoveredTile.s === s : false}
          isOccupied={Boolean(unitPositions.get(key))}
          onHover={() => {
            setHoveredTile({ q, r, s });
            onTileHover({ q, r, s });
          }}
          onUnhover={() => {}}
        />
      );
    }
  }
  
  // Birimleri göster
  const unitElements = [];
  
  // Map'i diziyi çevirerek üzerinde işlem yapalım
  const unitPositionsArray = Array.from(unitPositions);
  
  for (const [coordString, unit] of unitPositionsArray) {
    const [q, r, s] = coordString.split(',').map(Number);
    
    // Koordinat pozisyonu bulmak için (oyuncuya/düşmana göre)
    // Aynı yerleşim mantığını kullanarak birimlerin konumlarını hesapla
    
    let isPlayerSide = r < totalRows;
    let realRow = isPlayerSide ? r : r - totalRows;
    
    const rowOffset = realRow % 2 === 1 ? horizontalSpacing / 2 : 0;
    const x = centerX + (q * horizontalSpacing) - (gridWidthTotal / 2) + (horizontalSpacing / 2) + rowOffset;
    let z = 0;
    
    if (isPlayerSide) {
      z = centerZ + (verticalSpacing * (totalRows - 1 - realRow));
    } else {
      z = centerZ - (verticalSpacing * realRow) - verticalSpacing;
    }
    
    unitElements.push(
      <group key={`unit-${unit.id}`} position={[x, 0.25, z]}>
        {unit.type === 'warrior' ? (
          <PeacockWarriorModel 
            position={[0, 0, 0]} 
            rotation={[0, Math.PI, 0]} 
            scale={0.3} 
            type="adult" 
          />
        ) : (
          <HumanSoldierModel 
            position={[0, 0, 0]} 
            rotation={[0, Math.PI, 0]} 
            scale={0.3} 
          />
        )}
      </group>
    );
  }
  
  return (
    <group>
      {hexagons}
      {unitElements}
    </group>
  );
};

export default HexGrid;