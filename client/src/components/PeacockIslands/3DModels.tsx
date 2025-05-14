import { useRef, useState, useEffect } from "react";
import { useGLTF, Float, Sparkles, useTexture } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import * as THREE from "three";

// Hata yakalama fonksiyonu
function useSafeGLTF(path: string) {
  const [error, setError] = useState(false);
  const gltf = useGLTF(path, undefined, undefined, (error) => {
    console.error(`Error loading model from ${path}:`, error);
    setError(true);
  });
  
  return { ...gltf, error };
}

// Modelleri önceden yükle - yüksek kaliteli versiyonlar
// useGLTF.preload kullanımını kaldırdık, hataya sebep olabilir
// Modeller doğrudan bileşenlerde yüklenecek

// Tip tanımlamaları
type GLTFResult = GLTF & {
  nodes: {
    [key: string]: THREE.Mesh;
  };
  materials: {
    [key: string]: THREE.Material;
  };
};

// Gelişmiş Tüy 3D modeli
export function FeatherModel({ color = "green", position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }: { 
  color?: "green" | "blue" | "orange"; 
  position?: [number, number, number]; 
  rotation?: [number, number, number];
  scale?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const { scene, error } = useSafeGLTF('/models/peacock_feather.glb') as GLTFResult & { error: boolean };
  
  // Model yüklenemezse basit bir alternatif gösteriyoruz
  if (error) {
    console.warn("Tüy modeli yüklenemedi, basit alternatif kullanılıyor");
    const meshColor = 
      color === "green" ? "#00ff88" : 
      color === "blue" ? "#2288ff" : 
      "#ff8800";
      
    return (
      <Float
        speed={2}
        rotationIntensity={0.2}
        floatIntensity={0.2}
        position={position}
        rotation={rotation}
      >
        <mesh scale={[0.1, 0.5, 0.05]}>
          <boxGeometry />
          <meshStandardMaterial color={meshColor} emissive={meshColor} emissiveIntensity={0.2} />
        </mesh>
      </Float>
    );
  }
  
  // Animasyon için başlangıç değeri
  const [rotationOffset] = useState(Math.random() * Math.PI * 2);
  
  // Tüy animasyonu için
  useEffect(() => {
    let rafId: number;
    const animate = () => {
      if (group.current) {
        // Hafif dalgalanma efekti
        group.current.rotation.z = rotation[2] + Math.sin(Date.now() * 0.001 + rotationOffset) * 0.1;
        group.current.position.y = position[1] + Math.sin(Date.now() * 0.0015 + rotationOffset) * 0.05;
      }
      rafId = requestAnimationFrame(animate);
    };
    
    animate();
    return () => cancelAnimationFrame(rafId);
  }, [position, rotation, rotationOffset]);
  
  // Tüy rengini ve materyal özelliklerini ayarla
  useEffect(() => {
    if (!scene) return;
    
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        child.material = child.material.clone();
        
        // Rengi değiştir ve renk canlılığını artır
        if (color === "green") {
          child.material.color.set(new THREE.Color(0x00ff88));
          child.material.emissive = new THREE.Color(0x005522);
        } else if (color === "blue") {
          child.material.color.set(new THREE.Color(0x2288ff));
          child.material.emissive = new THREE.Color(0x002255);
        } else if (color === "orange") {
          child.material.color.set(new THREE.Color(0xff8800));
          child.material.emissive = new THREE.Color(0x551100);
        }
        
        // Gelişmiş materyal özellikleri
        child.material.emissiveIntensity = 0.2;
        child.material.metalness = 0.4;
        child.material.roughness = 0.4;
        child.material.envMapIntensity = 1.2;
        
        // Gölge oluşturma ve alma
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene, color]);
  
  return (
    <Float 
      speed={2} 
      rotationIntensity={0.2} 
      floatIntensity={0.2}
      position={position}
      rotation={rotation}
    >
      <group ref={group} scale={[scale * 1.5, scale * 1.5, scale * 1.5]}>
        <primitive object={scene} />
        
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
        
        {/* Parlama efekti */}
        <Sparkles 
          count={5} 
          scale={1} 
          size={0.2} 
          speed={0.2} 
          color={
            color === "green" ? "#00ff88" : 
            color === "blue" ? "#2288ff" : 
            "#ff8800"
          } 
        />
      </group>
    </Float>
  );
}

// Gelişmiş Yumurta 3D modeli
export function EggModel({ color = "green", position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, isActive = false }: { 
  color?: "green" | "blue" | "orange"; 
  position?: [number, number, number]; 
  rotation?: [number, number, number];
  scale?: number;
  isActive?: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const { scene, error } = useSafeGLTF('/models/magic_egg.glb') as GLTFResult & { error: boolean };
  
  // Model yüklenemezse basit bir alternatif gösteriyoruz
  if (error) {
    console.warn("Yumurta modeli yüklenemedi, basit alternatif kullanılıyor");
    const meshColor = 
      color === "green" ? "#00ff88" : 
      color === "blue" ? "#2288ff" : 
      "#ff8800";
    
    return (
      <Float 
        speed={isActive ? 1.5 : 1} 
        rotationIntensity={isActive ? 0.3 : 0.1} 
        floatIntensity={isActive ? 0.5 : 0.2}
        position={position}
        rotation={rotation}
      >
        <mesh scale={[scale * 0.4, scale * 0.6, scale * 0.4]}>
          <sphereGeometry />
          <meshStandardMaterial 
            color={meshColor} 
            emissive={meshColor} 
            emissiveIntensity={isActive ? 0.5 : 0.1}
            metalness={0.6}
            roughness={0.2}
          />
        </mesh>
        
        {isActive && (
          <pointLight
            position={[0, 0.3, 0]}
            intensity={0.5}
            distance={1.5}
            color={meshColor}
          />
        )}
      </Float>
    );
  }
  
  // Animasyon için başlangıç değeri
  const [rotationOffset] = useState(Math.random() * Math.PI * 2);
  
  // Yumurta animasyonu için
  useEffect(() => {
    let rafId: number;
    const animate = () => {
      if (group.current) {
        if (isActive) {
          // Aktif yumurtalar için titreme animasyonu
          group.current.rotation.y = rotation[1] + Math.sin(Date.now() * 0.003 + rotationOffset) * 0.1;
          group.current.rotation.x = rotation[0] + Math.cos(Date.now() * 0.002 + rotationOffset) * 0.05;
          
          // Hafif yukarı-aşağı hareketi
          group.current.position.y = position[1] + Math.sin(Date.now() * 0.002) * 0.05;
          
          // Nabız atma efekti
          const pulseFactor = 1 + Math.sin(Date.now() * 0.004) * 0.03;
          group.current.scale.set(
            scale * pulseFactor, 
            scale * pulseFactor, 
            scale * pulseFactor
          );
        } else {
          // Aktif olmayan yumurtalar için yavaş dönüş 
          group.current.rotation.y = rotation[1] + Math.sin(Date.now() * 0.001) * 0.05;
        }
      }
      rafId = requestAnimationFrame(animate);
    };
    
    animate();
    return () => cancelAnimationFrame(rafId);
  }, [position, rotation, scale, isActive, rotationOffset]);
  
  // Yumurta rengini ve materyal özelliklerini ayarla
  useEffect(() => {
    if (!scene) return;
    
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        child.material = child.material.clone();
        
        // Rengi değiştir
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
        child.material.envMapIntensity = 1.5;
        
        // Gölge oluşturma ve alma
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Aktif yumurtalar daha parlak ve daha metalik
        if (isActive) {
          child.material.emissiveIntensity = 1.0;
          child.material.metalness = 0.8;
          child.material.roughness = 0.1;
        } else {
          child.material.emissiveIntensity = 0.3;
        }
      }
    });
  }, [scene, color, isActive]);
  
  return (
    <Float 
      speed={isActive ? 1.5 : 1} 
      rotationIntensity={isActive ? 0.3 : 0.1} 
      floatIntensity={isActive ? 0.5 : 0.2}
      position={position}
      rotation={rotation}
    >
      <group ref={group} scale={[scale * 1.3, scale * 1.3, scale * 1.3]}>
        <primitive object={scene} />
        
        {/* Aktif yumurtalar için parlama efekti */}
        {isActive && (
          <>
            <pointLight 
              position={[0, 0.3, 0]} 
              intensity={0.8} 
              distance={2}
              color={
                color === "green" ? "#00ff88" : 
                color === "blue" ? "#2288ff" : "#ff8800"
              }
            />
            
            {/* Parlama efekti */}
            <Sparkles 
              count={15} 
              scale={1.2} 
              size={0.3} 
              speed={0.3} 
              color={
                color === "green" ? "#00ff88" : 
                color === "blue" ? "#2288ff" : 
                "#ff8800"
              } 
            />
          </>
        )}
      </group>
    </Float>
  );
}

// Gelişmiş Tavus Kuşu Savaşçı modeli
export function PeacockWarriorModel({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, type = "adult" }: { 
  position?: [number, number, number]; 
  rotation?: [number, number, number];
  scale?: number;
  type?: "chick" | "juvenile" | "adult" | "alpha";
}) {
  const group = useRef<THREE.Group>(null);
  const { scene, error } = useSafeGLTF('/models/peacock_warrior.glb') as GLTFResult & { error: boolean };
  
  // Düşman türüne göre renk belirle
  const fallbackColor = 
    type === "chick" ? "#ffcc44" :
    type === "juvenile" ? "#ff9944" :
    type === "alpha" ? "#ff3333" :
    "#ff6644"; // adult
    
  const fallbackScale = 
    type === "chick" ? scale * 0.5 :
    type === "juvenile" ? scale * 0.75 :
    type === "alpha" ? scale * 1.3 :
    scale; // adult
  
  // Model yüklenemezse basit bir alternatif gösteriyoruz
  if (error) {
    console.warn("Tavus kuşu savaşçı modeli yüklenemedi, basit alternatif kullanılıyor");
    
    return (
      <Float 
        speed={type === "alpha" ? 1.5 : 1}
        rotationIntensity={0.1}
        floatIntensity={type === "alpha" ? 0.3 : 0.1}
        position={position}
        rotation={rotation}
      >
        <group>
          {/* Gövde */}
          <mesh scale={[0.3 * modelScale, 0.7 * modelScale, 0.3 * modelScale]}>
            <boxGeometry />
            <meshStandardMaterial 
              color={modelColor}
              emissive={type === "alpha" ? "#ff3300" : "#000000"}
              emissiveIntensity={type === "alpha" ? 0.3 : 0}
              metalness={0.4}
              roughness={0.3}
            />
          </mesh>
          
          {/* Kafa */}
          <mesh 
            position={[0, 0.45 * modelScale, 0]} 
            scale={[0.2 * modelScale, 0.2 * modelScale, 0.2 * modelScale]}
          >
            <sphereGeometry />
            <meshStandardMaterial color={modelColor} />
          </mesh>
          
          {/* Alpha olanlar için ışık efekti */}
          {type === "alpha" && (
            <pointLight 
              position={[0, 0.5, 0]} 
              intensity={0.5} 
              distance={1.5} 
              color="#ff3300" 
            />
          )}
        </group>
      </Float>
    );
  }
  
  // Düşman türüne göre boyut ve renk ayarla
  const actualScale = scale;
  const colorRef = useRef(new THREE.Color(0xffffff));
  
  // Farklı düşman tiplerine göre ayarlar
  useEffect(() => {
    switch (type) {
      case "chick":
        modelScale *= 0.5;
        colorRef.current.set(0xffcc44);
        break;
      case "juvenile":
        modelScale *= 0.75;
        colorRef.current.set(0xff9944);
        break;
      case "adult":
        modelScale *= 1.0;
        colorRef.current.set(0xff6644);
        break;
      case "alpha":
        modelScale *= 1.3;
        colorRef.current.set(0xff3333);
        break;
    }
    
    if (!scene) return;
    
    // Modelin rengini ve materyal özelliklerini ayarla
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        child.material = child.material.clone();
        child.material.color.multiply(colorRef.current);
        
        // Gelişmiş materyal özellikleri
        child.material.metalness = 0.4;
        child.material.roughness = 0.3;
        child.material.envMapIntensity = 1.5;
        
        // Gölge oluşturma ve alma
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Emissive (kendi kendine parlayan) özellik ekle
        if (type === "alpha") {
          child.material.emissive = new THREE.Color(0xff3300);
          child.material.emissiveIntensity = 0.3;
        }
      }
    });
  }, [scene, type, actualScale]);
  
  // Savaşçı animasyonu için
  useEffect(() => {
    let rafId: number;
    
    const animate = () => {
      if (group.current) {
        // Nefes alma hareketi
        const breathFactor = Math.sin(Date.now() * 0.001) * 0.03;
        
        // Alfa düşmanlarda daha belirgin nefes alma
        const breathIntensity = type === "alpha" ? 0.05 : 0.03;
        group.current.position.y = position[1] + Math.sin(Date.now() * 0.002) * breathIntensity;
        
        // Alpha düşmanlar için ekstra yatay salınım
        if (type === "alpha") {
          group.current.rotation.y = rotation[1] + Math.sin(Date.now() * 0.001) * 0.1;
        }
      }
      
      rafId = requestAnimationFrame(animate);
    };
    
    animate();
    return () => cancelAnimationFrame(rafId);
  }, [position, rotation, type]);
  
  const floatSpeed = type === "alpha" ? 2 : 1;
  const floatIntensity = type === "alpha" ? 0.3 : 0.1;
  
  return (
    <Float 
      speed={floatSpeed} 
      rotationIntensity={0.1} 
      floatIntensity={floatIntensity}
      position={position}
      rotation={rotation}
    >
      <group ref={group} scale={[modelScale * 1.5, modelScale * 1.5, modelScale * 1.5]}>
        <primitive object={scene} />
        
        {/* Alpha düşmanlar için özel efektler */}
        {type === "alpha" && (
          <>
            <pointLight
              position={[0, 1, 0]}
              intensity={0.6}
              distance={2}
              color="#ff3300"
            />
            
            <Sparkles 
              count={10} 
              scale={1.5} 
              size={0.3} 
              speed={0.3} 
              color="#ff3300" 
            />
          </>
        )}
      </group>
    </Float>
  );
}

// Gelişmiş İnsan Asker modeli
export function HumanSoldierModel({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }: { 
  position?: [number, number, number]; 
  rotation?: [number, number, number];
  scale?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/human_soldier.glb') as GLTFResult;
  
  // Asker animasyonu için
  useEffect(() => {
    let rafId: number;
    
    const animate = () => {
      if (group.current) {
        // Hafif nefes alma hareketi
        group.current.position.y = position[1] + Math.sin(Date.now() * 0.002) * 0.03;
        
        // Hafif silah veya kalkan hareketi
        if (group.current.children.length > 1) {
          const rightArm = group.current.children[1];
          if (rightArm) {
            rightArm.rotation.x = Math.sin(Date.now() * 0.001) * 0.05;
          }
        }
      }
      
      rafId = requestAnimationFrame(animate);
    };
    
    animate();
    return () => cancelAnimationFrame(rafId);
  }, [position]);
  
  // Materyal geliştirmeleri
  useEffect(() => {
    if (!scene) return;
    
    // Modeli geliştir
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        child.material = child.material.clone();
        
        // Metalik parçalar için
        const isArmor = child.name.includes('armor') || child.name.includes('helmet');
        const isWeapon = child.name.includes('sword') || child.name.includes('shield');
        
        if (isArmor) {
          // Zırh parçaları için parlak metal efekti
          child.material.metalness = 0.8;
          child.material.roughness = 0.2;
          child.material.envMapIntensity = 2.0;
          child.material.emissive = new THREE.Color(0x3366ff);
          child.material.emissiveIntensity = 0.1;
        } else if (isWeapon) {
          // Silah için daha belirgin metalik görünüm
          child.material.metalness = 0.9;
          child.material.roughness = 0.1;
          child.material.envMapIntensity = 2.5;
        } else {
          // Diğer parçalar için normal ayarlar
          child.material.metalness = 0.3;
          child.material.roughness = 0.7;
        }
        
        // Gölge oluşturma ve alma
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  return (
    <Float 
      speed={1} 
      rotationIntensity={0.1} 
      floatIntensity={0.1}
      position={position}
      rotation={rotation}
    >
      <group ref={group} scale={[scale * 1.5, scale * 1.5, scale * 1.5]}>
        <primitive object={scene} />
        
        {/* Asker için mavi ışık efekti */}
        <pointLight 
          position={[0, 0.8, 0]} 
          intensity={0.4} 
          distance={1.5} 
          color="#6699ff"
        />
        
        {/* Silah üzerinde parıltı efekti */}
        <Sparkles 
          count={5} 
          scale={0.7} 
          size={0.2} 
          speed={0.1} 
          color="#99ccff" 
          position={[0.3, 0.5, 0.3]}
        />
      </group>
    </Float>
  );
}