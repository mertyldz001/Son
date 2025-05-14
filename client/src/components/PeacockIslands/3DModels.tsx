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

// Tavus Kuşu Savaşçısı - Basitleştirilmiş
export function PeacockWarriorModel({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, type = "adult" }: { 
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  type?: "adult" | "baby";
}) {
  const gltf = useSafeGLTF('/models/peacock_warrior_opt.glb');
  
  if (!gltf) {
    return null;
  }
  
  // Yetişkin veya bebek savaşçıya göre boyut ayarla
  const modelScale = type === "adult" ? scale : scale * 0.5;
  
  return (
    <group position={position} rotation={rotation} scale={[modelScale, modelScale, modelScale]}>
      <primitive object={gltf.scene.clone()} />
    </group>
  );
}

// İnsan Askeri - Basitleştirilmiş
export function HumanSoldierModel({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }: { 
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}) {
  const gltf = useSafeGLTF('/models/human_soldier_opt.glb');
  
  if (!gltf) {
    return null;
  }
  
  return (
    <group position={position} rotation={rotation} scale={[scale, scale, scale]}>
      <primitive object={gltf.scene.clone()} />
    </group>
  );
}

// Modelleri preload et
useGLTF.preload('/models/peacock_feather.glb');
useGLTF.preload('/models/magic_egg.glb');
useGLTF.preload('/models/peacock_warrior_opt.glb');
useGLTF.preload('/models/human_soldier_opt.glb');
