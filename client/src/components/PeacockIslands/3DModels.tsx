import { useRef } from "react";
import { useGLTF } from "@react-three/drei";
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

// Tüy 3D modeli
export function FeatherModel({ color = "green", position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }: { 
  color?: "green" | "blue" | "orange"; 
  position?: [number, number, number]; 
  rotation?: [number, number, number];
  scale?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/peacock_feather.glb') as GLTFResult;
  
  // Tüy rengini ayarla
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
      // Rengi değiştir
      if (color === "green") {
        child.material = child.material.clone();
        child.material.color.set(new THREE.Color(0x00ff88));
      } else if (color === "blue") {
        child.material = child.material.clone();
        child.material.color.set(new THREE.Color(0x2288ff));
      } else if (color === "orange") {
        child.material = child.material.clone();
        child.material.color.set(new THREE.Color(0xff8800));
      }
    }
  });
  
  return (
    <group ref={group} position={position} rotation={rotation} scale={[scale, scale, scale]}>
      <primitive object={scene.clone()} />
    </group>
  );
}

// Yumurta 3D modeli
export function EggModel({ color = "green", position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, isActive = false }: { 
  color?: "green" | "blue" | "orange"; 
  position?: [number, number, number]; 
  rotation?: [number, number, number];
  scale?: number;
  isActive?: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/magic_egg.glb') as GLTFResult;
  
  // Yumurta rengini ayarla
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
      // Rengi değiştir
      child.material = child.material.clone();
      
      if (color === "green") {
        child.material.color.set(new THREE.Color(0x00ff88));
        child.material.emissive.set(new THREE.Color(0x00aa44)); 
      } else if (color === "blue") {
        child.material.color.set(new THREE.Color(0x2288ff));
        child.material.emissive.set(new THREE.Color(0x0044aa));
      } else if (color === "orange") {
        child.material.color.set(new THREE.Color(0xff8800));
        child.material.emissive.set(new THREE.Color(0xaa4400));
      }
      
      // Aktif yumurtalar daha parlak
      if (isActive) {
        child.material.emissiveIntensity = 1.0;
      } else {
        child.material.emissiveIntensity = 0.3;
      }
    }
  });
  
  return (
    <group ref={group} position={position} rotation={rotation} scale={[scale, scale, scale]}>
      <primitive object={scene.clone()} />
      
      {/* Aktif yumurtalar için parlama efekti */}
      {isActive && (
        <pointLight 
          position={[0, 0.5, 0]} 
          intensity={1} 
          distance={3}
          color={
            color === "green" ? "#00ff88" : 
            color === "blue" ? "#2288ff" : "#ff8800"
          }
        />
      )}
    </group>
  );
}

// Tavus Kuşu Savaşçı modeli
export function PeacockWarriorModel({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, type = "adult" }: { 
  position?: [number, number, number]; 
  rotation?: [number, number, number];
  scale?: number;
  type?: "chick" | "juvenile" | "adult" | "alpha";
}) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/peacock_warrior.glb') as GLTFResult;
  
  // Düşman türüne göre boyut ve renk ayarla
  let modelScale = scale;
  let color = new THREE.Color(0xffffff);
  
  switch (type) {
    case "chick":
      modelScale *= 0.5;
      color.set(0xffcc44);
      break;
    case "juvenile":
      modelScale *= 0.75;
      color.set(0xff9944);
      break;
    case "adult":
      modelScale *= 1.0;
      color.set(0xff6644);
      break;
    case "alpha":
      modelScale *= 1.3;
      color.set(0xff3333);
      break;
  }
  
  // Modelin rengini ayarla
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
      child.material = child.material.clone();
      child.material.color.multiplyRGB(color);
    }
  });
  
  return (
    <group ref={group} position={position} rotation={rotation} scale={[modelScale, modelScale, modelScale]}>
      <primitive object={scene.clone()} />
    </group>
  );
}

// İnsan asker modeli
export function HumanSoldierModel({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }: { 
  position?: [number, number, number]; 
  rotation?: [number, number, number];
  scale?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/human_soldier.glb') as GLTFResult;
  
  return (
    <group ref={group} position={position} rotation={rotation} scale={[scale, scale, scale]}>
      <primitive object={scene.clone()} />
    </group>
  );
}