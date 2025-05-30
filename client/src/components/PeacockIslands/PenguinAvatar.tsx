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
  
  // TFT oyun alanının sınırları - Çok daha geniş erişim için
  // Tüm alanın erişilebilir olması için maksimum genişletildi
  const gameBounds = useMemo(() => {
    return {
      minX: -10, // Daha geniş yatay erişim
      maxX: 10,  // Daha geniş yatay erişim
      minZ: -25, // Çok daha aşağı erişim sağlandı
      maxZ: 10   // Çok daha yukarı erişim sağlandı
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
  
  // Performans iyileştirmesi - Hareket için optimize edilmiş değerler
  const lastFrameTime = useRef(0);
  const frameSkipCount = useRef(0);
  
  // Animasyon frame'lerini atla (her X frame'de bir güncelle) - performans optimizasyonu
  const FRAME_SKIP = 1; // Her 2 frame'de bir hesaplama yap
  
  useFrame(({ clock }, delta) => {
    if (!isMoving || !targetPosition) return;
    
    // Frame atlama mekanizması - performans iyileştirmesi
    frameSkipCount.current++;
    if (frameSkipCount.current <= FRAME_SKIP) return;
    frameSkipCount.current = 0;
    
    // Performans optimizasyonu - eğer çok kısa süre geçtiyse hesaplama yapma
    const now = clock.getElapsedTime();
    if (now - lastFrameTime.current < 0.016 && lastFrameTime.current > 0) return; // 60 FPS'den hızlı güncellemelerden kaçın
    lastFrameTime.current = now;
    
    // Mevcut pozisyon
    const currentPos = new THREE.Vector3(position[0], position[1], position[2]);
    
    // Hedef mesafesi - Math.hypot daha performanslı
    const dx = targetPosition.x - currentPos.x;
    const dz = targetPosition.z - currentPos.z;
    const distance = Math.hypot(dx, dz);
    
    // Hedefe ulaşıldı mı?
    if (distance < 0.1) {
      setIsMoving(false);
      setTargetPosition(null);
      return;
    }
    
    // Yön hesaplama - normalize kullanmadan daha hızlı
    const normalizedDx = dx / distance;
    const normalizedDz = dz / distance;
    
    // Hareket hızı - sabit hızda, precalculate
    const moveDistance = Math.min(speed * delta * 60, distance);
    
    // Yeni pozisyon hesapla - cache friendly ve optimize
    const newX = currentPos.x + normalizedDx * moveDistance;
    const newZ = currentPos.z + normalizedDz * moveDistance;
    
    // Pozisyonu güncelle - tek seferde yap
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
