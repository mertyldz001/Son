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
  size: tileSize, // Rename to avoid duplication 
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
  
  // Hex ölçüleri - daha geniş aralıklı hexagon için
  // Boyutu zaten parametre olarak alıyoruz
  const hexLineWidth = 0.018; // İnce kenar çizgisi
  
  // TFT stili hover animasyonu - yumuşak geçişli
  const hoverScale = useRef(new THREE.Vector3(1, 1, 1));
  const hoverHeight = useRef(0);
  const glowIntensity = useRef(0.3);

  // Optimizasyon: Update sayacı - her 2 frame'de bir hesaplama yapar
  const frameCounter = useRef(0);
  
  // Hover animasyonu - TFT stili yumuşak geçiş - İÇ VE DIŞ HER ZAMAN UYUMLU
  useFrame((_, delta) => {
    // Performans optimizasyonu - her frame'de değil belirli frame'lerde güncelle
    frameCounter.current++;
    if (frameCounter.current % 2 !== 0) return;
    frameCounter.current = 0;
    
    // Lerp faktörü hesaplaması - daha etkili
    const lerpFactor = Math.min(0.15 * delta * 60, 1);
    const relaxFactor = Math.min(0.1 * delta * 60, 1);
    
    if (isHovered) {
      // Hover durumunda iç ve dış geometri birlikte hareket eder
      // Vector3.lerp yerine manuel hesaplama - daha hızlı
      hoverScale.current.x += (1.1 - hoverScale.current.x) * lerpFactor;
      hoverScale.current.y += (1.1 - hoverScale.current.y) * lerpFactor;
      hoverScale.current.z += (1.1 - hoverScale.current.z) * lerpFactor;
      
      // Yükseklik hesabını optimize et
      hoverHeight.current += (0.15 - hoverHeight.current) * lerpFactor;
      glowIntensity.current += (1.0 - glowIntensity.current) * lerpFactor;
    } else {
      // Normal durumda aynı şekilde birlikte hareket
      hoverScale.current.x += (1 - hoverScale.current.x) * relaxFactor;
      hoverScale.current.y += (1 - hoverScale.current.y) * relaxFactor;
      hoverScale.current.z += (1 - hoverScale.current.z) * relaxFactor;
      
      hoverHeight.current += (0 - hoverHeight.current) * relaxFactor;
      glowIntensity.current += (0.3 - glowIntensity.current) * relaxFactor;
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
        {/* DIŞARIDA ALTIGEN ÇIZGI - SADECE İNCE KENAR ÇİZGİSİ */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
          <ringGeometry args={[tileSize * 0.8, tileSize, 6]} />
          <meshBasicMaterial 
            color="#ffffff"
            side={THREE.DoubleSide}
            transparent={true}
            opacity={isHovered ? 1.0 : 0.9}
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
  
  // Tam olarak istenen ekran görüntüsündeki gibi 3D geometri oluşturma
  // Nizami dizilimli basit grid
  const totalRows = 3; // Oyuncu ve düşman tarafı için ayrı ayrı 3'er sıra (toplam 6)
  const columnsPerRow = 7; // Her sırada 7 sütun
  
  // Başlangıçta gridWidth ve gridHeight değerleri yerine sabit değerler kullanalım
  const actualGridWidth = columnsPerRow;
  const actualGridHeight = totalRows * 2; // Toplam 6 sıra (3 oyuncu + 3 düşman)
  
  // Daha düzenli ve geniş aralıklı grid için ölçekleme faktörleri
  const horizontalSpacing = size * 2.2; // Yatay hücreler arası mesafe - geniş
  const verticalSpacing = size * 2.2;   // Dikey hücreler arası mesafe - geniş
  // Tam ekran görüntüsündeki gibi çok daha sade ve düzenli grid
  const gridWidthTotal = horizontalSpacing * columnsPerRow; // Grid toplam genişliği
  
  // Grid merkezi - yeşil dikdörtgenin tam ortasına yerleştirme
  const centerX = 0; // X koordinatı ortalı
  const centerZ = 6; // Z koordinatını yeşil dikdörtgenin orta noktasına ayarla (GameBoard3DNew'deki group position'a göre)
  
  // Hexagon oluşturma işlemini memoize ediyoruz - performans için
  const hexTiles = React.useMemo(() => {
    const tiles = [];
    
    // Grid genişlik hesaplaması - sürekli tekrarlanmaması için cache'le
    const halfGridWidth = gridWidthTotal / 2;
    const xOffset = horizontalSpacing / 2;
    
    // Önce oyuncu tarafı (ilk 3 sıra)
    for (let row = 0; row < totalRows; row++) {
      const baseZ = centerZ + (verticalSpacing * (totalRows - 1 - row));
      
      for (let col = 0; col < columnsPerRow; col++) {
        const r = row;
        const q = col;
        const s = -q - r;
        const key = `${q},${r},${s}`;
        
        // X pozisyonu - daha az hesaplama, çarpma işlemlerini minimize et
        const x = centerX + (col * horizontalSpacing) - halfGridWidth + xOffset;
        
        // Bu tam olarak oyuncu tarafı (ilk 3 sıra)
        const isPlayerSide = true;
        
        // Entegrasyonu doğru yap
        const isHovered = hoveredTile ? 
          hoveredTile.q === q && hoveredTile.r === r && hoveredTile.s === s : 
          false;
          
        const isOccupied = Boolean(unitPositions.get(key));
        
        // Pozisyon oluşturma
        const position: [number, number, number] = [x, 0, baseZ];
        
        // Altıgen hücreyi oluştur ve ekle
        tiles.push(
          <HexTile 
            key={key}
            position={position}
            size={size}
            hexCoords={{ q, r, s }}
            isPlayerSide={isPlayerSide}
            isHovered={isHovered}
            isOccupied={isOccupied}
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
      const baseZ = centerZ - (verticalSpacing * row) - verticalSpacing;
      
      for (let col = 0; col < columnsPerRow; col++) {
        const r = row + totalRows; // Düşman koordinatları için offset
        const q = col;
        const s = -q - r;
        const key = `${q},${r},${s}`;
        
        // X pozisyonu - daha az hesaplama, çarpma işlemlerini minimize et
        const x = centerX + (col * horizontalSpacing) - halfGridWidth + xOffset;
        
        // Bu düşman tarafı (son 3 sıra)
        const isPlayerSide = false;
        
        // Entegrasyonu doğru yap
        const isHovered = hoveredTile ? 
          hoveredTile.q === q && hoveredTile.r === r && hoveredTile.s === s : 
          false;
          
        const isOccupied = Boolean(unitPositions.get(key));
        
        // Pozisyon oluşturma
        const position: [number, number, number] = [x, 0, baseZ];
        
        // Altıgen hücreyi oluştur ve ekle
        tiles.push(
          <HexTile 
            key={key}
            position={position}
            size={size}
            hexCoords={{ q, r, s }}
            isPlayerSide={isPlayerSide}
            isHovered={isHovered}
            isOccupied={isOccupied}
            onHover={() => {
              setHoveredTile({ q, r, s });
              onTileHover({ q, r, s });
            }}
            onUnhover={() => {}}
          />
        );
      }
    }
    
    return tiles;
  }, [
    hoveredTile, 
    unitPositions, 
    size, 
    totalRows, 
    columnsPerRow, 
    centerX, 
    centerZ, 
    horizontalSpacing, 
    verticalSpacing, 
    gridWidthTotal,
    onTileHover
  ]);
  
  // Birimleri göster - performans optimizasyonu için useMemo
  const unitElements = React.useMemo(() => {
    const elements = [];
    
    // Map'i diziyi çevirerek üzerinde işlem yapalım
    const unitPositionsArray = Array.from(unitPositions);
    
    for (const [coordString, unit] of unitPositionsArray) {
      const [q, r, s] = coordString.split(',').map(Number);
      
      // Pozisyon hesaplama optimizasyonu - gereksiz değişkenleri kaldır
      const isPlayerSide = r < totalRows;
      const realRow = isPlayerSide ? r : r - totalRows;
      
      // Pozisyon hesaplamalarını optimize et - daha az matematiksel işlem
      const halfGridWidth = gridWidthTotal / 2;
      const x = centerX + (q * horizontalSpacing) - halfGridWidth + (horizontalSpacing / 2);
      
      // Z hesaplaması için tek bir formül kullan - daha hızlı
      const z = isPlayerSide 
        ? centerZ + (verticalSpacing * (totalRows - 1 - realRow))
        : centerZ - (verticalSpacing * (realRow + 1));
      
      elements.push(
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
    
    return elements;
  }, [unitPositions, centerX, centerZ, horizontalSpacing, verticalSpacing, gridWidthTotal, totalRows]);
  
  return (
    <group>
      {hexTiles}
      {unitElements}
    </group>
  );
};

export default HexGrid;