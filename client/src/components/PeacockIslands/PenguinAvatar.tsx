import { useRef, useState, useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// TFT tarzı penguen modeli - Kullanıcı için avatar
export function PenguinAvatar() {
  const model = useRef<THREE.Group>(null);
  const [position, setPosition] = useState<[number, number, number]>([0, 0.2, 0]);
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0]);
  const [isMoving, setIsMoving] = useState(false);
  const [targetPosition, setTargetPosition] = useState<THREE.Vector3 | null>(null);
  
  // Daha hızlı hareket - performans iyileştirmesi
  const speed = 0.12;
  
  // ThreeJS dünyası için erişim
  const { raycaster, camera } = useThree();
  
  // Penguen modeli - Performans için memo
  const { scene: penguinScene } = useGLTF('/models/penguin_-_tft.glb');
  const penguinModel = useMemo(() => penguinScene?.clone(), [penguinScene]);
  
  // TFT oyun alanının sınırları - HexGrid'e göre ölçeklenmiş
  // HexGrid içindeki koordinat yapısına göre ayarlandı
  const gameBounds = useMemo(() => {
    return {
      minX: -6, 
      maxX: 6,
      minZ: -8, 
      maxZ: 2
    };
  }, []);
  
  // Tıklama işlemcisi - Performans için iyileştirildi
  const handleTouch = useMemo(() => {
    return (event: TouchEvent | MouseEvent) => {
      // Canvas elemanını bul ve sınır kontrolü
      const canvas = document.querySelector('canvas');
      if (!canvas) return;
      
      // Tıklama veya dokunma koordinatları
      let clientX: number, clientY: number;
      
      if ('touches' in event) {
        // Dokunma olayı
        if (event.touches.length === 0) return;
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else {
        // Mouse tıklaması
        clientX = event.clientX;
        clientY = event.clientY;
      }
      
      // Canvas dışı tıklamaları yoksay
      const rect = canvas.getBoundingClientRect();
      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        return;
      }
      
      // Canvas koordinatlarını normalize et (-1 ile 1 arasında)
      const normalizedX = ((clientX - rect.left) / rect.width) * 2 - 1;
      const normalizedY = -((clientY - rect.top) / rect.height) * 2 + 1;
      
      // Raycaster'ı hazırla
      raycaster.setFromCamera(new THREE.Vector2(normalizedX, normalizedY), camera);
      
      // Zemin düzlemi - Y=0 düzleminde
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const targetPoint = new THREE.Vector3();
      
      // Işın-düzlem kesişimi hesapla
      if (raycaster.ray.intersectPlane(groundPlane, targetPoint)) {
        // Tıklanan nokta oyun alanı içinde mi?
        if (
          targetPoint.x < gameBounds.minX || 
          targetPoint.x > gameBounds.maxX || 
          targetPoint.z < gameBounds.minZ || 
          targetPoint.z > gameBounds.maxZ
        ) {
          // Sınırlar dışında - hareket etme
          console.log("Sınırlar dışında tıklama:", targetPoint.x, targetPoint.z);
          return;
        }
        
        // Hareket et
        console.log("Hareket hedefi:", targetPoint.x, targetPoint.z);
        
        // Hedefi ayarla ve hareketi başlat
        setTargetPosition(targetPoint);
        setIsMoving(true);
        
        // Hedefe dön
        const deltaX = targetPoint.x - position[0];
        const deltaZ = targetPoint.z - position[2];
        const angle = Math.atan2(deltaX, deltaZ);
        setRotation([0, angle, 0]);
      }
    };
  }, [camera, raycaster, gameBounds, position]);
  
  // Event listener'ları ekle/kaldır
  useEffect(() => {
    document.addEventListener('click', handleTouch);
    document.addEventListener('touchstart', handleTouch);
    
    return () => {
      document.removeEventListener('click', handleTouch);
      document.removeEventListener('touchstart', handleTouch);
    };
  }, [handleTouch]);
  
  // Performans iyileştirmesi - Hareket için memo değerler
  useFrame(({ clock }, delta) => {
    if (!isMoving || !targetPosition) return;
    
    // Mevcut pozisyon
    const currentPos = new THREE.Vector3(position[0], position[1], position[2]);
    
    // Hedef mesafesi
    const distance = currentPos.distanceTo(targetPosition);
    
    // Hedefe ulaşıldı mı?
    if (distance < 0.1) {
      setIsMoving(false);
      setTargetPosition(null);
      return;
    }
    
    // Hareket yönü
    const direction = new THREE.Vector3().subVectors(targetPosition, currentPos).normalize();
    
    // Hareket hızı - sabit hızda
    const moveDistance = speed * delta * 60;
    
    // Yeni pozisyon hesapla
    const newX = currentPos.x + direction.x * Math.min(moveDistance, distance);
    const newZ = currentPos.z + direction.z * Math.min(moveDistance, distance);
    
    // Pozisyonu güncelle
    setPosition([newX, position[1], newZ]);
    
    // Sabit yükseklik - idle animasyonu yok
    if (model.current) {
      model.current.position.y = 0;
    }
  });
  
  // Penguen modeli yüklü değilse render etme
  if (!penguinModel) return null;
  
  return (
    <group position={[position[0], position[1], position[2]]}>
      <group 
        ref={model} 
        rotation={[rotation[0], rotation[1], rotation[2]]} 
        scale={[0.3, 0.3, 0.3]}
      >
        <primitive object={penguinModel} />
      </group>
    </group>
  );
}

// Modelimizi önceden yükle - performans için
useGLTF.preload('/models/penguin_-_tft.glb');
