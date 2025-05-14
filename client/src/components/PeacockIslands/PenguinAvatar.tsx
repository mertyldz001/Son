import { useRef, useState, useEffect } from "react";
import { useGLTF, Float, Sparkles, useKeyboardControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { GLTF } from "three-stdlib";
import * as THREE from "three";
import { usePeacockIslandsStore } from "../../lib/stores/usePeacockIslandsStore";

// TFT tarzı penguen modeli - Kullanıcı için avatar
export function PenguinAvatar() {
  const { currentPhase } = usePeacockIslandsStore();
  const model = useRef<THREE.Group>(null);
  const [position, setPosition] = useState<[number, number, number]>([0, 0.3, 0]);
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0]);
  const [isMoving, setIsMoving] = useState(false);
  
  // Keyboard kontrolleri
  const moveForward = useKeyboardControls(state => state.KeyW);
  const moveBackward = useKeyboardControls(state => state.KeyS);
  const moveLeft = useKeyboardControls(state => state.KeyA);
  const moveRight = useKeyboardControls(state => state.KeyD);
  
  // Hareket hızı
  const speed = 0.05;
  const rotateSpeed = 0.1;
  
  // Animasyon ve hareket
  useFrame((_, delta) => {
    if (currentPhase === "preparation") {  // Sadece hazırlık aşamasında hareket etsin
      let moving = false;
      const newPosition = [...position] as [number, number, number];
      let newRotation = rotation[1];
      
      if (moveForward) {
        newPosition[0] += Math.sin(rotation[1]) * speed;
        newPosition[2] += Math.cos(rotation[1]) * speed;
        moving = true;
      }
      
      if (moveBackward) {
        newPosition[0] -= Math.sin(rotation[1]) * speed;
        newPosition[2] -= Math.cos(rotation[1]) * speed;
        moving = true;
      }
      
      if (moveLeft) {
        newRotation += rotateSpeed;
        moving = true;
      }
      
      if (moveRight) {
        newRotation -= rotateSpeed;
        moving = true;
      }
      
      // Adanın sınırlarını kontrol et
      const distanceFromCenter = Math.sqrt(newPosition[0] * newPosition[0] + newPosition[2] * newPosition[2]);
      if (distanceFromCenter > 4.5) {  // Ada yarıçapı
        const angle = Math.atan2(newPosition[0], newPosition[2]);
        newPosition[0] = Math.sin(angle) * 4.5;
        newPosition[2] = Math.cos(angle) * 4.5;
      }
      
      // Pozisyon ve rotasyon güncelle
      setPosition(newPosition);
      setRotation([0, newRotation, 0]);
      setIsMoving(moving);
      
      // Kamera takibi için kullanılabilir
      if (model.current) {
        // Model animasyonu
        if (moving) {
          const bounce = Math.sin(Date.now() * 0.01) * 0.05;
          model.current.position.y = 0.3 + bounce;
        }
      }
    }
  });
  
  // Model (useGLTF fonksiyonu error özelliğini döndürmez)
  const gltf = useGLTF('/models/tft_penguin.glb');
  
  if (!gltf.scene || currentPhase !== "preparation") {
    return null;  // Sadece hazırlık aşamasında görünür
  }
  
  return (
    <Float 
      speed={1.5}
      rotationIntensity={0.2}
      floatIntensity={0.2}
      position={position}
    >
      <group ref={model} rotation={rotation} scale={[1.2, 1.2, 1.2]}>
        <primitive object={gltf.scene.clone()} />
        
        {/* Avatar efektleri */}
        <Sparkles 
          count={15}
          scale={1.5}
          size={0.2}
          speed={0.3}
          color="#aaddff"
          position={[0, 0.5, 0]}
        />
        
        {/* Oyuncu vurgusu */}
        <pointLight
          position={[0, 0.5, 0]}
          intensity={0.4}
          distance={2}
          color="#66ccff"
        />
      </group>
    </Float>
  );
}

// Modelimizi önceden yükle
useGLTF.preload('/models/tft_penguin.glb');
