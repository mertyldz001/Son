import { useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import * as THREE from "three";

// useGLTF hook'u için güvenli wrapper - daha basit hali
function useSafeGLTF(path: string) {
  try {
    return useGLTF(path);
  } catch (e) {
    console.error(`Model yüklenemedi: ${path}:`, e);
    return null;
  }
}

// GLTF modelimizin tipini tanımlıyoruz
type GLTFResult = GLTF & {
  nodes: {
    [key: string]: THREE.Mesh;
  };
  materials: {
    [key: string]: THREE.Material;
  };
};

// Tüy modeli
export function FeatherModel({ color = "green", position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }: { 
  color?: "green" | "blue" | "orange"; 
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}) {
  // Farklı renk tüyler için renk değerleri
  const colors = {
    green: "#00aa44",
    blue: "#2266ff",
    orange: "#ff6622"
  };
  
  // Modeli yükle
  const gltf = useSafeGLTF('/models/peacock_feather.glb');
  
  if (!gltf) {
    return null;
  }
  
  return (
    <group position={position} rotation={rotation} scale={[scale, scale, scale]}>
      <primitive object={gltf.scene.clone()} />
      <meshStandardMaterial color={colors[color]} />
    </group>
  );
}

// Yumurta modeli
export function EggModel({ color = "green", position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, isActive = false }: { 
  color?: "green" | "blue" | "orange"; 
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  isActive?: boolean;
}) {
  // Farklı renk yumurtalar için renk değerleri
  const colors = {
    green: "#00aa44",
    blue: "#2266ff",
    orange: "#ff6622"
  };
  
  // Modeli yükle
  const gltf = useSafeGLTF('/models/magic_egg.glb');
  
  if (!gltf) {
    return null;
  }
  
  return (
    <group position={position} rotation={rotation} scale={[scale, scale, scale]}>
      <primitive object={gltf.scene.clone()} />
      <meshStandardMaterial 
        color={colors[color]} 
        emissive={colors[color]}
        emissiveIntensity={isActive ? 0.5 : 0.1}
      />
    </group>
  );
}

// Tavus Kuşu Savaşçısı - Ultra Basitleştirilmiş
export function PeacockWarriorModel({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, type = "adult" }: { 
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  type?: "adult" | "baby";
}) {
  // Basitleştirilmiş model yerine doğrudan Three.js ile temel geometriler kullanalım
  // Yetişkin veya bebek savaşçıya göre boyut ayarla
  const modelScale = type === "adult" ? scale : scale * 0.5;
  
  return (
    <group position={position} rotation={rotation} scale={[modelScale, modelScale, modelScale]}>
      {/* Vücut */}
      <mesh castShadow position={[0, 0.7, 0]}>
        <capsuleGeometry args={[0.3, 0.7, 8, 8]} />
        <meshStandardMaterial color="#3D85C6" />
      </mesh>
      
      {/* Baş */}
      <mesh castShadow position={[0, 1.4, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#76A5AF" />
      </mesh>
      
      {/* Kuyruk (tavus kuşu kuyruğu) */}
      <mesh castShadow position={[0, 0.7, -0.4]} rotation={[Math.PI * 0.2, 0, 0]}>
        <coneGeometry args={[0.5, 1, 8]} />
        <meshStandardMaterial color="#6AA84F" />
      </mesh>
      
      {/* Silah (mızrak) */}
      <mesh castShadow position={[0.4, 0.8, 0]} rotation={[0, 0, Math.PI * 0.1]}>
        <cylinderGeometry args={[0.03, 0.03, 1.5, 6]} />
        <meshStandardMaterial color="#B45F06" />
      </mesh>
      <mesh castShadow position={[0.4, 1.5, 0]}>
        <coneGeometry args={[0.08, 0.2, 6]} />
        <meshStandardMaterial color="#E69138" />
      </mesh>
    </group>
  );
}

// İnsan Askeri - Ultra Basitleştirilmiş
export function HumanSoldierModel({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }: { 
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} rotation={rotation} scale={[scale, scale, scale]}>
      {/* Vücut */}
      <mesh castShadow position={[0, 0.7, 0]}>
        <capsuleGeometry args={[0.3, 0.7, 8, 8]} />
        <meshStandardMaterial color="#990000" />
      </mesh>
      
      {/* Baş */}
      <mesh castShadow position={[0, 1.4, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#FFB973" />
      </mesh>
      
      {/* Miğfer */}
      <mesh castShadow position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.28, 0.25, 0.2, 8]} />
        <meshStandardMaterial color="#666666" />
      </mesh>
      
      {/* Kılıç */}
      <mesh castShadow position={[0.5, 0.9, 0]} rotation={[0, 0, Math.PI * 0.1]}>
        <boxGeometry args={[0.1, 0.8, 0.05]} />
        <meshStandardMaterial color="#CCCCCC" />
      </mesh>
      <mesh castShadow position={[0.5, 0.4, 0]} rotation={[0, 0, Math.PI * 0.1]}>
        <boxGeometry args={[0.2, 0.1, 0.07]} />
        <meshStandardMaterial color="#B45F06" />
      </mesh>
    </group>
  );
}

// Sadece gerekli modelleri preload et
useGLTF.preload('/models/peacock_feather.glb');
useGLTF.preload('/models/magic_egg.glb');
