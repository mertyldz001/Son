import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Unit } from '../../lib/game/peacockIslands/types';
import { PeacockWarriorModel, HumanSoldierModel } from './3DModels';

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
  // TFT tarzı renkler - ekran görüntüsündeki gibi
  const baseColor = isPlayerSide ? "#4f9bff" : "#ff4040"; // Ana karo renkleri
  const hoverColor = isPlayerSide ? "#64bdff" : "#ff6060"; // Vurgu renkleri
  // Kenar çizgisi rengi içerideki renkle uyumlu (TFT stilinde)
  const edgeColor = isPlayerSide ? "#60a5ff" : "#ff6060";
  
  // TFT stili hover animasyonu - yumuşak geçişli
  const hoverScale = useRef(new THREE.Vector3(1, 1, 1));
  const hoverHeight = useRef(0);
  const glowIntensity = useRef(0);
  
  // Hover animasyonu - TFT stili yumuşak geçiş
  useFrame(() => {
    if (isHovered) {
      hoverScale.current.lerp(new THREE.Vector3(1.08, 1.1, 1.08), 0.15);
      hoverHeight.current += (0.1 - hoverHeight.current) * 0.1;
      glowIntensity.current += (1.0 - glowIntensity.current) * 0.15;
    } else {
      hoverScale.current.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      hoverHeight.current += (0 - hoverHeight.current) * 0.1;
      glowIntensity.current += (0.4 - glowIntensity.current) * 0.1;
    }
  });
  
  return (
    <group position={position}>
      <mesh 
        position={[0, hoverHeight.current, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
        scale={hoverScale.current}
        onPointerOver={onHover}
        onPointerOut={onUnhover}
        onClick={(e) => {
          e.stopPropagation();
          // Özel olay tetikle
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
        {/* TFT stili hexagonal geometri yerine kareden */}
        <cylinderGeometry args={[size * 1.2, size * 1.2, 0.25, 6, 1, false]} />
        <meshPhysicalMaterial 
          color={isHovered ? hoverColor : baseColor} 
          roughness={0.15} // Çok parlak
          metalness={0.7}  // Daha metalik görünüm
          transparent={true}
          opacity={isOccupied ? 0.85 : 0.95}
          emissive={isHovered ? hoverColor : baseColor}
          emissiveIntensity={glowIntensity.current} // Animasyonlu glow efekti
          clearcoat={1.0}  // Tam parlak yüzey
          clearcoatRoughness={0.2}
          transmission={0.4}
          reflectivity={0.8}
          envMapIntensity={1.5} // Çevre yansıması
        />
      </mesh>
      
      {/* TFT stili kenar çizgisi - içerideki renkle uyumlu */}
      <mesh 
        position={[0, 0.03, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
        scale={hoverScale.current}
      >
        <ringGeometry args={[size * 1.18, size * 1.24, 6]} />
        <meshBasicMaterial 
          color={isHovered ? "#ffffff" : edgeColor} 
          side={THREE.DoubleSide} 
          transparent={true}
          opacity={isHovered ? 1.0 : 0.95}
        />
      </mesh>
      
      {/* TFT stili ince kenar çizgisi - ekstra detay */}
      <mesh 
        position={[0, 0.035, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
        scale={hoverScale.current}
      >
        <ringGeometry args={[size * 1.25, size * 1.27, 6]} />
        <meshBasicMaterial 
          color={isHovered ? "#ffffff" : edgeColor} 
          side={THREE.DoubleSide} 
          transparent={true}
          opacity={isHovered ? 0.9 : 0.6}
        />
      </mesh>
      
      {/* TFT stili glow efekti */}
      <mesh 
        position={[0, 0.02, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
        scale={hoverScale.current}
      >
        <ringGeometry args={[size * 1.15, size * 1.17, 6]} />
        <meshStandardMaterial 
          color={isHovered ? "#ffffff" : baseColor} 
          side={THREE.DoubleSide} 
          transparent={true}
          opacity={isHovered ? 0.9 : 0.7}
          emissive={isHovered ? "#ffffff" : baseColor}
          emissiveIntensity={glowIntensity.current}
        />
      </mesh>
      
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
  
  // TFT tarzı düzgün grid oluşturma - Sütunları tam düz hizala
  // Her sütun kendi kolonunda olacak şekilde düzenle
  for (let r = 0; r < gridHeight; r++) {
    // TFT tarzı düzen için ofseti kaldır - sütunlar düz olsun
    for (let q = 0; q < gridWidth; q++) {
      const s = -q - r;
      const key = `${q},${r},${s}`;
      
      // Pozisyonlar - sütunlar TFT tarzında daha yakın
      const x = size * 2.0 * (q - gridWidth/2 + 0.5);  // Yatay olarak optimal boşluk
      const z = size * 2.0 * r;  // Dikey olarak optimal boşluk
      
      // TFT tarzı: Oyuncu ve rakip tarafı - net ayrım
      const isPlayerSide = r < gridHeight / 2;
      
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