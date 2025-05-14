import { useRef, useState } from "react";
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

// Tüy 3D modeli
export function FeatherModel({ color = "green", position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }: { 
  color?: "green" | "blue" | "orange"; 
  position?: [number, number, number]; 
  rotation?: [number, number, number];
  scale?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/peacock_feather.glb') as GLTFResult;
  
  // Tüy animasyonu için başlangıç değeri
  const [rotationOffset, setRotationOffset] = useState(Math.random() * Math.PI * 2);
  
  // Animasyon için useFrame hook'u
  useFrame((_: any, delta: number) => {
    if (group.current) {
      // Hafif dalgalanma efekti
      group.current.rotation.z = rotation[2] + Math.sin(Date.now() * 0.001 + rotationOffset) * 0.1;
      group.current.position.y = position[1] + Math.sin(Date.now() * 0.0015 + rotationOffset) * 0.05;
    }
  });
  
  // Tüy rengini ve materyal özelliklerini ayarla
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
      child.material = child.material.clone();
      
      // Rengi değiştir ve renk canlılığını artır
      if (color === "green") {
        child.material.color.set(new THREE.Color(0x00ff88));
        // Yeşil tüyler için metalik yeşil yansıma
        child.material.emissive = new THREE.Color(0x005522);
      } else if (color === "blue") {
        child.material.color.set(new THREE.Color(0x2288ff));
        // Mavi tüyler için metalik mavi yansıma
        child.material.emissive = new THREE.Color(0x002255);
      } else if (color === "orange") {
        child.material.color.set(new THREE.Color(0xff8800));
        // Turuncu tüyler için ateş benzeri yansıma
        child.material.emissive = new THREE.Color(0x551100);
      }
      
      // Gelişmiş materyal özellikleri
      child.material.emissiveIntensity = 0.2;
      child.material.metalness = 0.3;
      child.material.roughness = 0.4;
      child.material.envMapIntensity = 1.2;
      
      // Gölge oluşturma ve alma
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  
  return (
    <group ref={group} position={position} rotation={rotation} scale={[scale, scale, scale]}>
      <primitive object={scene.clone()} />
      
      {/* Renge göre nokta ışık kaynağı */}
      <pointLight
        position={[0, 0.2, 0]}
        intensity={0.3}
        distance={1.0}
        color={
          color === "green" ? "#00ff88" : 
          color === "blue" ? "#2288ff" : 
          "#ff8800"
        }
      />
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
  
  // Animasyon için başlangıç değeri
  const [rotationOffset] = useState(Math.random() * Math.PI * 2);
  
  // Animasyon için useFrame hook'u
  useFrame((_: any, delta: number) => {
    if (group.current) {
      if (isActive) {
        // Aktif yumurtalar için titreme animasyonu
        group.current.rotation.y = rotation[1] + Math.sin(Date.now() * 0.003 + rotationOffset) * 0.1;
        group.current.rotation.x = rotation[0] + Math.cos(Date.now() * 0.002 + rotationOffset) * 0.05;
        // Hafif yukarı-aşağı hareketi
        group.current.position.y = position[1] + Math.sin(Date.now() * 0.002) * 0.05;
        group.current.scale.set(
          scale + Math.sin(Date.now() * 0.004) * 0.03, 
          scale + Math.sin(Date.now() * 0.004) * 0.03, 
          scale + Math.sin(Date.now() * 0.004) * 0.03
        );
      } else {
        // Aktif olmayan yumurtalar için yavaş dönüş 
        group.current.rotation.y = rotation[1] + Math.sin(Date.now() * 0.001) * 0.05;
      }
    }
  });
  
  // Yumurta rengini ve materyal özelliklerini gelişmiş hale getir
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
      // Rengi ve materyal özelliklerini değiştir
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
      
      // Gelişmiş materyal özellikleri
      child.material.metalness = 0.6;
      child.material.roughness = 0.2;
      child.material.envMapIntensity = 1.8;
      
      // Gölge oluşturma ve alma
      child.castShadow = true;
      child.receiveShadow = true;
      
      // Aktif yumurtalar daha parlak ve daha metalik
      if (isActive) {
        child.material.emissiveIntensity = 1.2;
        child.material.metalness = 0.8;
        child.material.roughness = 0.1;
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
  
  // Modelin rengini ve materyalini gelişmiş hale getir
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
      child.material = child.material.clone();
      child.material.color.multiply(color);
      
      // Gelişmiş materyal özellikleri
      child.material.metalness = 0.4;  // Metalik görünüm
      child.material.roughness = 0.3;  // Daha pürüzsüz yüzey
      child.material.envMapIntensity = 1.5; // Çevre yansıması
      
      // Gölge ve ışık efektleri
      child.castShadow = true;
      child.receiveShadow = true;
      
      // Emissive (kendi kendine parlayan) özellik ekle
      if (type === "alpha") {
        child.material.emissive = new THREE.Color(0xff3300);
        child.material.emissiveIntensity = 0.3;
      }
    }
  });
  
  return (
    <group ref={group} position={position} rotation={rotation} scale={[modelScale, modelScale, modelScale]}>
      <primitive object={scene.clone()} />
    </group>
  );
}

// Geliştirilmiş insan asker modeli
export function HumanSoldierModel({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }: { 
  position?: [number, number, number]; 
  rotation?: [number, number, number];
  scale?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/human_soldier.glb') as GLTFResult;
  
  // Model animasyonu için
  useFrame((_: any, delta: number) => {
    if (group.current) {
      // Hafif nefes alma hareketi
      group.current.position.y = position[1] + Math.sin(Date.now() * 0.002) * 0.03;
    }
  });
  
  // Modeli geliştir
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
      child.material = child.material.clone();
      
      // Metalik zırh parçaları için
      child.material.metalness = 0.7;
      child.material.roughness = 0.2;
      child.material.envMapIntensity = 1.8;
      
      // Gölge oluşturma ve alma
      child.castShadow = true;
      child.receiveShadow = true;
      
      // Hafif parlaklık
      child.material.emissive = new THREE.Color(0x3366ff);
      child.material.emissiveIntensity = 0.1;
    }
  });
  
  return (
    <group ref={group} position={position} rotation={rotation} scale={[scale, scale, scale]}>
      <primitive object={scene.clone()} />
      
      {/* Asker etrafında hafif ışık efekti */}
      <pointLight 
        position={[0, 0.5, 0]} 
        intensity={0.4} 
        distance={1.5} 
        color="#6699ff"
      />
    </group>
  );
}