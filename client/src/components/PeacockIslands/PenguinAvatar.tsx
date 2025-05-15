import { useRef, useState, useEffect } from "react";
import { useGLTF, Float, Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { usePeacockIslandsStore } from "../../lib/stores/usePeacockIslandsStore";

// TFT tarzı penguen modeli - Kullanıcı için avatar
export function PenguinAvatar() {
  const model = useRef<THREE.Group>(null);
  const [position, setPosition] = useState<[number, number, number]>([0, 0.2, 0]);
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0]);
  const [isMoving, setIsMoving] = useState(false);
  const [targetPosition, setTargetPosition] = useState<THREE.Vector3 | null>(null);
  
  // Küçük şampiyon pengu ismi
  const penguName = "Küçük şampiyon pengu";
  
  // Hareket hızı
  const speed = 0.05;
  
  // ThreeJS dünyası için erişim
  const { raycaster, camera, scene } = useThree();
  
  // Mobil dokunma ve tıklama için DOM tabanlı çözüm
  useEffect(() => {
    // Mobil cihazlar için dokunma olayını yakalamak için
    const handleTouch = (event: TouchEvent | MouseEvent) => {
      console.log("Dokunma veya tıklama algılandı!");
      
      // Canvas elemanını bul
      const canvas = document.querySelector('canvas');
      if (!canvas) return;
      
      // Dokunma veya tıklama koordinatlarını al
      let x, y;
      
      if ('touches' in event) {
        // Dokunma olayı için
        if (event.touches.length === 0) return;
        const touch = event.touches[0];
        x = touch.clientX;
        y = touch.clientY;
      } else {
        // Mouse tıklaması için
        x = event.clientX;
        y = event.clientY;
      }
      
      // Canvas sınırları içinde mi kontrol et
      const rect = canvas.getBoundingClientRect();
      if (
        x < rect.left ||
        x > rect.right ||
        y < rect.top ||
        y > rect.bottom
      ) {
        return; // Canvas dışında
      }
      
      // Normalize edilmiş koordinatlar (-1 ile 1 arasında)
      const normalizedX = ((x - rect.left) / rect.width) * 2 - 1;
      const normalizedY = -((y - rect.top) / rect.height) * 2 + 1;
      
      // Raycaster kullanarak 3D dünyada kesişim noktası bul
      raycaster.setFromCamera(
        new THREE.Vector2(normalizedX, normalizedY),
        camera
      );
      
      // Zemini bulmak için bir yardımcı düzlem oluştur
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const targetPoint = new THREE.Vector3();
      
      // Raycaster ile düzlemin kesişimini bul
      if (raycaster.ray.intersectPlane(groundPlane, targetPoint)) {
        console.log("Hedef nokta bulundu:", targetPoint);
        
        // Sınırlar içinde kal
        const maxX = 6, maxZ = 5;
        const minX = -6, minZ = -5;
        targetPoint.x = Math.max(minX, Math.min(maxX, targetPoint.x));
        targetPoint.z = Math.max(minZ, Math.min(maxZ, targetPoint.z));
        
        // Hedef pozisyonu ayarla
        setTargetPosition(targetPoint);
        setIsMoving(true);
        
        // Hedef yöne dönüş
        const deltaX = targetPoint.x - position[0];
        const deltaZ = targetPoint.z - position[2];
        const angle = Math.atan2(deltaX, deltaZ);
        setRotation([0, angle, 0]);
      }
    };
    
    // Olayları ekle - hem tıklama hem dokunma için
    document.addEventListener('click', handleTouch);
    document.addEventListener('touchstart', handleTouch);
    
    // Temizleme
    return () => {
      document.removeEventListener('click', handleTouch);
      document.removeEventListener('touchstart', handleTouch);
    };
  }, [camera, raycaster, position]);
  
  // Animasyon ve hareket
  useFrame((_, delta) => {
    if (targetPosition && isMoving) {
      // Mevcut pozisyon
      const currentPos = new THREE.Vector3(position[0], position[1], position[2]);
      
      // Hedefe kalan mesafe
      const distance = currentPos.distanceTo(targetPosition);
      
      // Hedefe vardıysak dur
      if (distance < 0.1) {
        setIsMoving(false);
        setTargetPosition(null);
        return;
      }
      
      // Hareket yönü ve mesafesi
      const direction = new THREE.Vector3().subVectors(targetPosition, currentPos).normalize();
      const moveDistance = speed * delta * 60; // 60 FPS'de normal hız
      
      // Yeni pozisyon
      const newX = currentPos.x + direction.x * Math.min(moveDistance, distance);
      const newZ = currentPos.z + direction.z * Math.min(moveDistance, distance);
      
      // Pozisyonu güncelle
      setPosition([newX, position[1], newZ]);
      
      // Zıplama efekti
      if (model.current) {
        const bounce = Math.sin(Date.now() * 0.01) * 0.05;
        model.current.position.y = 0.05 + bounce;
      }
    }
  });
  
  // Penguen modeli
  const { scene: penguinScene } = useGLTF('/models/penguin_-_tft.glb');
  if (!penguinScene) return null;
  
  return (
    <Float 
      speed={1.5}
      rotationIntensity={0.2}
      floatIntensity={0.2}
      position={[position[0], position[1], position[2]]}
    >
      {/* İsim etiketi */}
      <Html
        position={[0, 1.2, 0]}
        center
        distanceFactor={10}
      >
        <div className="bg-white px-2 py-1 rounded-full text-black font-medium text-sm whitespace-nowrap">
          {penguName}
        </div>
      </Html>
      
      {/* Yeşil ok - aşağıya doğru */}
      <mesh position={[0, 1.5, 0]}>
        <coneGeometry args={[0.2, 0.4, 3]} />
        <meshBasicMaterial color="#4ade80" />
      </mesh>
      
      {/* Penguen modeli */}
      <group 
        ref={model} 
        rotation={[rotation[0], rotation[1], rotation[2]]} 
        scale={[0.3, 0.3, 0.3]}
      >
        <primitive object={penguinScene.clone()} />
      </group>
    </Float>
  );
}

// Modelimizi önceden yükle
useGLTF.preload('/models/penguin_-_tft.glb');
