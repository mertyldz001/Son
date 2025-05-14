import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
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
  // Neon modern cam efekti - canlı renkler
  const baseColor = isPlayerSide ? "#4f9bff" : "#ff5252"; // Çok daha parlak neon mavi ve kırmızı
  const hoverColor = isPlayerSide ? "#64bdff" : "#ff7070"; // Ultra parlak vurgu renkleri
  const edgeColor = isPlayerSide ? "#0088ff" : "#ff2222";
  
  return (
    <group position={position}>
      <mesh 
        position={[0, 0.01, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
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
        <boxGeometry args={[size * 1.7, 0.25, size * 1.7]} />
        <meshPhysicalMaterial 
          color={isHovered ? hoverColor : baseColor} 
          roughness={0.2}
          metalness={0.4}
          transparent={true}
          opacity={isOccupied ? 0.8 : 0.9}
          emissive={isHovered ? hoverColor : baseColor}
          emissiveIntensity={0.4}
          clearcoat={0.8}
          clearcoatRoughness={0.3}
          transmission={0.6}
          reflectivity={0.5}
        />
      </mesh>
      
      {/* Modern neon kenar çizgisi */}
      <mesh 
        position={[0, 0.035, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[size * 1.7, size * 1.75, 6]} />
        <meshBasicMaterial 
          color={isHovered ? "#ffffff" : edgeColor} 
          side={THREE.DoubleSide} 
          transparent={true}
          opacity={0.9}
        />
      </mesh>
      
      {/* İç parlama efekti */}
      <mesh 
        position={[0, 0.02, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[size * 1.6, size * 1.65, 6]} />
        <meshBasicMaterial 
          color={isHovered ? "#ffffff" : baseColor} 
          side={THREE.DoubleSide} 
          transparent={true}
          opacity={0.7}
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
      
      // Pozisyonlar - tam dikey sütunlar için
      const x = size * 2 * (q - gridWidth/2 + 0.5);  // Merkezi hizalama için ofset ekle
      const z = size * 2 * r;  // Tam dikey hizalama
      
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