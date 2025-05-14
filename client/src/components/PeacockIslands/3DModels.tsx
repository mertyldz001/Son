import { useRef, useState, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { GLTF } from "three-stdlib";
import * as THREE from "three";

// Modelleri önceden yükle
useGLTF.preload('/models/peacock_feather.glb');
useGLTF.preload('/models/magic_egg.glb');
useGLTF.preload('/models/peacock_warrior.glb');
useGLTF.preload('/models/human_soldier.glb');

// Tip tanımlamaları
type GLTFResult = GLTF & {
  nodes: {
    [key: string]: THREE.Mesh;
  };
  materials: {
    [key: string]: THREE.Material;
  };
};

// Basitleştirilmiş Tüy 3D modeli
export function FeatherModel({ color = "green", position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }: { 
  color?: "green" | "blue" | "orange"; 
  position?: [number, number, number]; 
  rotation?: [number, number, number];
  scale?: number;
}) {
  // Renkleri belirleme
  const meshColor = 
    color === "green" ? "#00ff88" : 
    color === "blue" ? "#2288ff" : 
    "#ff8800";
  
  return (
    <group position={position} rotation={rotation} scale={[scale, scale, scale]}>
      <mesh>
        <boxGeometry args={[0.3, 0.8, 0.1]} />
        <meshStandardMaterial color={meshColor} />
      </mesh>
    </group>
  );
}

// Basitleştirilmiş Yumurta 3D modeli
export function EggModel({ color = "green", position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, isActive = false }: { 
  color?: "green" | "blue" | "orange"; 
  position?: [number, number, number]; 
  rotation?: [number, number, number];
  scale?: number;
  isActive?: boolean;
}) {
  // Renkleri belirleme
  const meshColor = 
    color === "green" ? "#00ff88" : 
    color === "blue" ? "#2288ff" : 
    "#ff8800";
  
  return (
    <group position={position} rotation={rotation} scale={[scale * 0.6, scale, scale * 0.6]}>
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial 
          color={meshColor} 
          emissive={isActive ? meshColor : "#000000"} 
          emissiveIntensity={isActive ? 0.5 : 0}
          metalness={0.6}
          roughness={0.2}
        />
      </mesh>
      
      {/* Aktif yumurtalar için parlama efekti */}
      {isActive && (
        <pointLight 
          position={[0, 0.5, 0]} 
          intensity={0.5} 
          distance={2}
          color={meshColor}
        />
      )}
    </group>
  );
}

// Basitleştirilmiş Tavus Kuşu Savaşçı modeli
export function PeacockWarriorModel({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, type = "adult" }: { 
  position?: [number, number, number]; 
  rotation?: [number, number, number];
  scale?: number;
  type?: "chick" | "juvenile" | "adult" | "alpha";
}) {
  // Düşman türüne göre boyut ve renk ayarla
  let modelScale = scale;
  let color;
  
  switch (type) {
    case "chick":
      modelScale *= 0.5;
      color = "#ffcc44";
      break;
    case "juvenile":
      modelScale *= 0.75;
      color = "#ff9944";
      break;
    case "adult":
      modelScale *= 1.0;
      color = "#ff6644";
      break;
    case "alpha":
      modelScale *= 1.3;
      color = "#ff3333";
      break;
    default:
      color = "#ff6644";
  }
  
  return (
    <group position={position} rotation={rotation} scale={[modelScale, modelScale, modelScale]}>
      <mesh>
        <boxGeometry args={[0.5, 0.8, 0.5]} />
        <meshStandardMaterial 
          color={color} 
          metalness={0.4}
          roughness={0.3}
          emissive={type === "alpha" ? "#ff3300" : "#000000"}
          emissiveIntensity={type === "alpha" ? 0.3 : 0}
        />
      </mesh>
      
      {/* Kafa kısmı */}
      <mesh position={[0, 0.6, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial 
          color={color} 
          metalness={0.4}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

// Basitleştirilmiş insan asker modeli
export function HumanSoldierModel({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }: { 
  position?: [number, number, number]; 
  rotation?: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} rotation={rotation} scale={[scale, scale, scale]}>
      {/* Gövde */}
      <mesh>
        <boxGeometry args={[0.5, 0.8, 0.3]} />
        <meshStandardMaterial 
          color="#999999" 
          metalness={0.7}
          roughness={0.2}
        />
      </mesh>
      
      {/* Kafa */}
      <mesh position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial 
          color="#ffddbb" 
          metalness={0.1}
          roughness={0.8}
        />
      </mesh>
      
      {/* Hafif mavi ışık efekti */}
      <pointLight 
        position={[0, 0.5, 0]} 
        intensity={0.3} 
        distance={1} 
        color="#6699ff"
      />
    </group>
  );
}