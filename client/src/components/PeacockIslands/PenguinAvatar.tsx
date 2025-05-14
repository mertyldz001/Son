import { useRef, useState, useEffect } from "react";
import { useGLTF, Float } from "@react-three/drei";
import { useFrame, ThreeEvent, useThree } from "@react-three/fiber";
import { GLTF } from "three-stdlib";
import * as THREE from "three";
import { usePeacockIslandsStore } from "../../lib/stores/usePeacockIslandsStore";

// TFT tarzı penguen modeli - Kullanıcı için avatar
export function PenguinAvatar() {
  const { currentPhase } = usePeacockIslandsStore();
  const model = useRef<THREE.Group>(null);
  const [position, setPosition] = useState<[number, number, number]>([0, 0.2, 0]);
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0]);
  const [isMoving, setIsMoving] = useState(false);
  const [targetPosition, setTargetPosition] = useState<THREE.Vector3 | null>(null);
  
  // Hareket hızı
  const speed = 0.05;
  
  // Zemin ile mouse etkileşimi için gerekli
  const { raycaster, camera, scene } = useThree();
  
  // Zemine tıklama işleyicisi
  const handleGroundClick = (event: ThreeEvent<MouseEvent>) => {
    // Eğer hazırlık aşamasında değilsek işlem yapma
    if (currentPhase !== "preparation") return;
    
    // Tıklanan noktayı al
    event.stopPropagation();
    
    // Tıklanan nokta için hedef pozisyon belirle
    // Y değerini (yükseklik) sabit tutuyoruz, sadece x ve z değişecek
    const target = new THREE.Vector3(
      event.point.x,
      position[1], // Y pozisyonunu değiştirme (yerden yükseklik)
      event.point.z
    );
    
    // Adanın sınırlarını kontrol et
    const distanceFromCenter = Math.sqrt(target.x * target.x + target.z * target.z);
    if (distanceFromCenter > 4.5) {  // Ada yarıçapı
      const angle = Math.atan2(target.x, target.z);
      target.x = Math.sin(angle) * 4.5;
      target.z = Math.cos(angle) * 4.5;
    }
    
    // Hedef pozisyonu güncelle
    setTargetPosition(target);
    setIsMoving(true);
    
    // Hedef yöne dönecek şekilde rotasyonu ayarla
    const deltaX = target.x - position[0];
    const deltaZ = target.z - position[2];
    const angle = Math.atan2(deltaX, deltaZ);
    setRotation([0, angle, 0]);
  };
  
  // Animasyon ve hareket
  useFrame((_, delta) => {
    if (currentPhase === "preparation" && targetPosition && isMoving) {
      // Mevcut pozisyonu al
      const currentPos = new THREE.Vector3(position[0], position[1], position[2]);
      
      // Hedefe olan mesafe
      const distance = currentPos.distanceTo(targetPosition);
      
      // Eğer hedefe yeterince yaklaşmışsak, hareketi durdur
      if (distance < 0.1) {
        setIsMoving(false);
        setTargetPosition(null);
        return;
      }
      
      // Yeni pozisyonu hesapla (hedefe doğru hareket)
      const direction = new THREE.Vector3().subVectors(targetPosition, currentPos).normalize();
      const moveDistance = speed * delta * 60; // 60 FPS'de normal hız
      
      const newX = currentPos.x + direction.x * Math.min(moveDistance, distance);
      const newZ = currentPos.z + direction.z * Math.min(moveDistance, distance);
      
      // Pozisyonu güncelle
      setPosition([newX, position[1], newZ]);
      
      // Model animasyonu
      if (model.current && isMoving) {
        const bounce = Math.sin(Date.now() * 0.01) * 0.05;
        model.current.position.y = 0.05 + bounce; // Hareket ederken zıplama efekti
      }
    }
  });
  
  // Model yükle - daha küçük model kullan
  const gltf = useGLTF('/models/penguin_-_tft.glb');
  
  // Eğer model yüklenmediyse veya hazırlık aşamasında değilsek gösterme
  if (!gltf.scene || currentPhase !== "preparation") {
    return null;
  }
  
  return (
    <>
      {/* Tıklanabilir zemin oluştur - görünmez ama tıklanabilir */}
      <mesh 
        position={[0, 0, 0]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        receiveShadow 
        onClick={handleGroundClick}
      >
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial 
          transparent={true} 
          opacity={0.0} 
        />
      </mesh>
      
      {/* Penguen karakteri */}
      <Float 
        speed={1.5}
        rotationIntensity={0.2}
        floatIntensity={0.2}
        position={position}
      >
        <group ref={model} rotation={rotation} scale={[1.0, 1.0, 1.0]}>
          <primitive object={gltf.scene.clone()} />
          
          {/* Efektler performans için kaldırıldı */}
        </group>
      </Float>
    </>
  );
}

// Modelimizi önceden yükle - daha küçük modeli kullan
useGLTF.preload('/models/penguin_-_tft.glb');
