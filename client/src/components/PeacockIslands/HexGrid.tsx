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
  const baseColor = isPlayerSide ? "#4f9bff" : "#e04040"; // Ekran görüntüsündeki gibi ana renkler
  const hoverColor = isPlayerSide ? "#64bdff" : "#ff6060"; // Vurgu renkleri
  // Kenar çizgisi renkleri - exact match ekran görüntüsüne göre
  const edgeColor = isPlayerSide ? "#4692e8" : "#eb6060";
  
  // TFT stili hover animasyonu - yumuşak geçişli
  const hoverScale = useRef(new THREE.Vector3(1, 1, 1));
  const hoverHeight = useRef(0);
  const glowIntensity = useRef(0);
  
  // Hover animasyonu - TFT stili yumuşak geçiş
  useFrame(() => {
    if (isHovered) {
      hoverScale.current.lerp(new THREE.Vector3(1.05, 1.05, 1.05), 0.15);
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
      {/* SADECE tek bir altıgen - TFT tarzı basit */}
      <mesh 
        position={[0, hoverHeight.current, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
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
        {/* TFT style hexagon - single piece with outline */}
        <cylinderGeometry args={[size, size, 0.1, 6, 1, false]} />
        <meshStandardMaterial 
          color={isHovered ? hoverColor : baseColor} 
          emissive={isHovered ? hoverColor : baseColor}
          emissiveIntensity={0.3}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>
      
      {/* Line along the edge */}
      <mesh 
        position={[0, 0.06, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
        scale={hoverScale.current}
      >
        <ringGeometry args={[size * 0.98, size * 1.02, 6]} />
        <meshBasicMaterial 
          color={isHovered ? "#ffffff" : edgeColor}
          side={THREE.DoubleSide}
          transparent={true}
          opacity={0.8}
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
      
      // Pozisyonlar - gönderilen ekran görüntüsündeki gibi daha yakın
      const x = size * 1.8 * (q - gridWidth/2 + 0.5);  // Yatay olarak daha yakın
      const z = size * 1.8 * r;  // Dikey olarak daha yakın
      
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