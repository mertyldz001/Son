import { useRef, useState, useEffect } from "react";
import { useGLTF, Float, Html, Text } from "@react-three/drei";
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
  
  // Küçük şampiyon pengu ismi
  const penguName = "Küçük şampiyon pengu";
  
  // Hareket hızı
  const speed = 0.05;
  
  // Zemin ile mouse etkileşimi için gerekli
  const { raycaster, camera, scene } = useThree();
  
  // Zemine tıklama işleyicisi - tüm fazlarda etkin
  const handleGroundClick = (event: ThreeEvent<MouseEvent>) => {
    // Tıklanan noktayı al
    event.stopPropagation();
    
    // Tıklanan nokta için hedef pozisyon belirle
    // Y değerini (yükseklik) sabit tutuyoruz, sadece x ve z değişecek
    const target = new THREE.Vector3(
      event.point.x,
      position[1], // Y pozisyonunu değiştirme (yerden yükseklik)
      event.point.z
    );
    
    // Oyun alanının sınırlarını kontrol et
    // Hexagonal grid alanının yaklaşık sınırları
    const maxX = 6; // X ekseninde sınır
    const maxZ = 5; // Z ekseninde sınır
    const minX = -6;
    const minZ = -5;
    
    // Sınırlar içinde kal
    target.x = Math.max(minX, Math.min(maxX, target.x));
    target.z = Math.max(minZ, Math.min(maxZ, target.z));
    
    // Hedef pozisyonu güncelle
    setTargetPosition(target);
    setIsMoving(true);
    
    // Hedef yöne dönecek şekilde rotasyonu ayarla
    const deltaX = target.x - position[0];
    const deltaZ = target.z - position[2];
    const angle = Math.atan2(deltaX, deltaZ);
    setRotation([0, angle, 0]);
    
    // Hareket durumunu loglayalım
    console.log("Pengu hareket ediyor: ", target);
  };
  
  // Animasyon ve hareket - her fazda etkin
  useFrame((_, delta) => {
    if (targetPosition && isMoving) {
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
  
  // Eğer model yüklenmediyse gösterme
  if (!gltf.scene) {
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
        <mesh position={[0, 1.5, 0]} rotation={[0, 0, 0]}>
          <coneGeometry args={[0.2, 0.4, 3]} />
          <meshBasicMaterial color="#4ade80" />
        </mesh>
        
        {/* Penguen modeli */}
        <group ref={model} rotation={[rotation[0], rotation[1], rotation[2]]} scale={[0.3, 0.3, 0.3]}>
          <primitive object={gltf.scene.clone()} />
        </group>
      </Float>
    </>
  );
}

// Modelimizi önceden yükle - daha küçük modeli kullan
useGLTF.preload('/models/penguin_-_tft.glb');
