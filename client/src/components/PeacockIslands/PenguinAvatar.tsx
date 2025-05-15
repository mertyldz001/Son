import { useRef, useState, useEffect } from "react";
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
  
  // Hareket hızı - daha akıcı hareket için hızı artır
  const speed = 0.08;
  
  // ThreeJS dünyası için erişim
  const { raycaster, camera, scene } = useThree();
  
  // Sadece sütunlar ve yeşil bahçe alanında hareket edebilme kontrolü
  const isValidPosition = (point: THREE.Vector3): boolean => {
    // Hexagonal sütunlar ve yeşil bahçe bölgesi için sınırlar
    // Merkezden başlayarak hex grid ve çevresindeki yeşil alan tanımı
    const centerX = 0;
    const centerZ = 0;
    
    // Hexagonal grid alanı (sütunlar)
    const gridWidth = 7;  // x-ekseninde 7 sütun
    const gridHeight = 6; // z-ekseninde 6 sütun
    const cellSize = 1.2; // Her hücrenin boyutu
    
    // Grid alanını hesapla
    const gridBoundsX = (gridWidth * cellSize) / 2;
    const gridBoundsZ = (gridHeight * cellSize) / 2;
    
    // Yeşil bahçe alanı için ilave sınır
    const gardenMargin = 2.0; // Gridden yeşil alana doğru uzanan mesafe
    
    // X ve Z koordinatları merkeze göre normalize et
    const relativeX = Math.abs(point.x - centerX);
    const relativeZ = Math.abs(point.z - centerZ);
    
    // Sütunlar ve yeşil bahçe alanında mı kontrol et
    return relativeX <= (gridBoundsX + gardenMargin) && 
           relativeZ <= (gridBoundsZ + gardenMargin);
  };
  
  // Mobil dokunma ve tıklama için DOM tabanlı çözüm
  useEffect(() => {
    // Mobil cihazlar için dokunma olayını yakalamak için
    const handleTouch = (event: TouchEvent | MouseEvent) => {
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
        // Geçerli pozisyon kontrolü
        if (!isValidPosition(targetPoint)) {
          console.log("Geçersiz hedef: Sütunlar ve bahçe dışında");
          return; // Geçersiz pozisyon
        }
        
        // Hedef pozisyonu ayarla
        setTargetPosition(targetPoint);
        setIsMoving(true);
        
        // Hedef yöne dönüş - daha yumuşak rotasyon
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
  }, [camera, raycaster, scene, position]);
  
  // Animasyon ve hareket - daha akıcı ve gçzel
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
        // Karakterin sabit kalmasını sağla - idle animasyonu olmadan
        return;
      }
      
      // Hareket yönü - daha akıcı hareket için
      const direction = new THREE.Vector3().subVectors(targetPosition, currentPos).normalize();
      
      // Hız eğrisi - hareket başlangıcında ve bitişinde yavaşlama
      let moveSpeed = speed;
      if (distance < 1.0) {
        // Hedefe yaklaşırken yavaşla
        moveSpeed = speed * (distance / 1.0);
      }
      
      // Minimum hız garantisi
      moveSpeed = Math.max(speed * 0.5, moveSpeed);
      
      // Hareket mesafesini hesapla
      const moveDistance = moveSpeed * delta * 60;
      
      // Yeni pozisyon
      const newX = currentPos.x + direction.x * Math.min(moveDistance, distance);
      const newZ = currentPos.z + direction.z * Math.min(moveDistance, distance);
      
      // Pozisyonu güncelle
      setPosition([newX, position[1], newZ]);
      
      // Hareket sırasında karakterin yüksekliği sabit kalır
      if (model.current) {
        // Idle animasyonu olmadan, sabit yükseklik
        model.current.position.y = 0.05;
      }
    }
  });
  
  // Penguen modeli
  const { scene: penguinScene } = useGLTF('/models/penguin_-_tft.glb');
  if (!penguinScene) return null;
  
  return (
    <group
      position={[position[0], position[1], position[2]]}
    >
      {/* Penguen modeli */}
      <group 
        ref={model} 
        rotation={[rotation[0], rotation[1], rotation[2]]} 
        scale={[0.3, 0.3, 0.3]}
      >
        <primitive object={penguinScene.clone()} />
      </group>
    </group>
  );
}

// Modelimizi önceden yükle
useGLTF.preload('/models/penguin_-_tft.glb');
