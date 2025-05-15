import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Unit, HatcherySlot } from '../../lib/game/peacockIslands/types';
import { PeacockWarriorModel, HumanSoldierModel } from './3DModels';
import { usePeacockIslandsStore } from '../../lib/stores/usePeacockIslandsStore';

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
  const glowIntensity = useRef(0);
  
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
        onPointerOver={onHover}
        onPointerOut={onUnhover}
        onClick={(e) => {
          e.stopPropagation();
          window.dispatchEvent(
            new CustomEvent('hex-click', { 
              detail: { 
                hexCoords,
                isPlayerSide,
                isOccupied 
              } 
            })
          );
        }}
        userData={{ 
          hexCoords,
          type: "hex-tile",
          q: hexCoords.q,
          r: hexCoords.r,
          s: hexCoords.s,
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
      {/*
      <Text
        position={[0, 0.05, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {`${hexCoords.q},${hexCoords.r}`}
      </Text>
      */}
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
  const [hoveredTile, setHoveredTile] = useState<string | null>(null);

  // Hexagon grid oluşturma
  const hexagons = [];
  
  // Ekran görüntüsündeki düzene uygun grid oluşturma (3. ve 4. İstek)
  // 3x7 ve 3x7 olarak toplam 42 hücre (21 oyuncu, 21 düşman) (4. İstek)
  // İlk altıgen sol taraftan bir çıkıntı yapacak şekilde yerleşim (3. İstek)
  const totalRows = 6; // 3 oyuncu, 3 düşman sırası
  const columnsPerRow = 7; // Her sırada 7 sütun
  
  // Başlangıçta gridWidth ve gridHeight değerleri yerine sabit değerler kullanalım
  gridWidth = columnsPerRow;
  gridHeight = totalRows;
  
  // Toplam grid oluşumu (3+3=6 sıra)
  for (let row = 0; row < totalRows; row++) {
    // Oyuncu tarafı için ilk 3 sıra, düşman tarafı için son 3 sıra
    const isPlayerRow = row < totalRows / 2;
    
    for (let col = 0; col < columnsPerRow; col++) {
      // Altıgen koordinatlarını hesapla
      const r = row;
      const q = col;
      const s = -q - r;
      const key = `${q},${r},${s}`;
      
      // 3. İstek: Resimde gösterilen düzene uygun yerleşim (nizami sıralama)
      // Sol taraftan çıkıntı ile başlayan düzen
      // Her satır için alternatif offset - tam ekran görüntüsündeki gibi
      const offsetX = (row % 2 === 0) ? 0.5 : 0; // Çift numaralı sıralar offset'li
      const x = size * 1.1 * (col - columnsPerRow/2 + offsetX);  // Yatay mesafe - daha yakın
      
      // 5. İstek: Z pozisyonu: Tam yeşil alanın ortasında olacak şekilde ayarla
      const z = size * 1.2 * (row - totalRows/2 + 0.5);  // Dikey mesafe - yeşil alanın ortasına
      
      // TFT tarzı: Oyuncu ve rakip tarafı - net ayrım
      const isPlayerSide = row < totalRows / 2;
      
      // Koordinat stringi (işgal durumunu kontrol etmek için)
      const coordString = `${q},${r},${s}`;
      
      // Bu hexagon'da birim var mı?
      const isOccupied = unitPositions.has(coordString);
      
      hexagons.push(
        <HexTile 
          key={key} 
          position={[x, 0, z]} 
          size={size} 
          hexCoords={{ q, r, s }}
          isPlayerSide={isPlayerSide}
          isHovered={hoveredTile === key}
          isOccupied={isOccupied}
          onHover={() => {
            setHoveredTile(key);
            onTileHover({ q, r, s });
          }}
          onUnhover={() => {
            if (hoveredTile === key) {
              setHoveredTile(null);
            }
          }}
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
    
    // Hesaplanan pozisyonlar
    const x = size * (3/2) * q;
    const z = size * Math.sqrt(3) * (r + q/2);
    
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