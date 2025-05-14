import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { usePeacockIslandsStore } from '../../lib/stores/usePeacockIslandsStore';

// Hex harita oluşturucu yardımcı fonksiyonlar
const createHexPosition = (q: number, r: number, size: number = 1) => {
  // Hex koordinatlarını 3D koordinatlara dönüştür
  const x = size * (3/2 * q);
  const z = size * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
  return [x, 0, z];
};

// Hex şeklinde geometri oluştur
const HexTile = ({ position, color, isHighlighted, isPlayerSide }: any) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  // Hover efektini yönet
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    
    // Hover durumuna göre yükseklik ayarla
    const targetY = hovered || isHighlighted ? 0.1 : 0;
    meshRef.current.position.y += (targetY - meshRef.current.position.y) * 5 * delta;
    
    // Renk değişimini yönet
    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    const targetColor = new THREE.Color(
      isHighlighted ? '#4488ff' : 
      hovered ? '#44aa44' : 
      color
    );
    material.color.lerp(targetColor, 10 * delta);
  });

  // Hex geometrisi oluştur
  const hexShape = new THREE.Shape();
  const size = 0.95; // Kenar aralarında boşluk bırakmak için biraz küçült
  
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const x = size * Math.cos(angle);
    const y = size * Math.sin(angle);
    if (i === 0) {
      hexShape.moveTo(x, y);
    } else {
      hexShape.lineTo(x, y);
    }
  }
  
  return (
    <mesh 
      ref={meshRef}
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      castShadow
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <extrudeGeometry 
        args={[
          hexShape, 
          { 
            depth: 0.1,
            bevelEnabled: true,
            bevelSegments: 2,
            bevelSize: 0.02,
            bevelThickness: 0.02
          }
        ]} 
      />
      <meshStandardMaterial 
        color={color} 
        roughness={0.7}
        metalness={0.2}
      />
    </mesh>
  );
};

// Birim taşı (karakter)
const UnitPiece = ({ position, color, power, size = 0.4 }: any) => {
  // Karakter pozisyonu - hexin üzerinde biraz yukarıda durmalı
  const adjustedPosition: [number, number, number] = [
    position[0], 
    position[1] + 0.3, 
    position[2]
  ];
  
  const meshRef = useRef<THREE.Group>(null);
  
  // Hafif sallanma animasyonu
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.position.y = adjustedPosition[1] + Math.sin(Date.now() * 0.003) * 0.05;
    meshRef.current.rotation.y += delta * 0.5; // Yavaşça dön
  });
  
  return (
    <group ref={meshRef} position={adjustedPosition}>
      {/* Karakter gövdesi */}
      <mesh castShadow>
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      
      {/* Güç göstergesi */}
      <Text
        position={[0, size + 0.2, 0]}
        rotation={[0, 0, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {power}
      </Text>
    </group>
  );
};

// Ada temsili
const Island = ({ position, isPlayerIsland = false }: any) => {
  // Ada zemini oluştur
  return (
    <group position={position}>
      {/* Ana ada platformu */}
      <mesh 
        position={[0, -0.1, 0]} 
        receiveShadow
      >
        <cylinderGeometry args={[3, 3.5, 0.5, 6]} />
        <meshStandardMaterial 
          color={isPlayerIsland ? "#88aa99" : "#aa8899"} 
          roughness={0.8}
        />
      </mesh>
      
      {/* Ada süslemeleri - ağaçlar veya yapılar */}
      {Array.from({ length: 5 }).map((_, i) => {
        const angle = (Math.PI * 2 / 5) * i;
        const radius = 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        return (
          <group key={i} position={[x, 0, z]}>
            {/* Ağaç veya yapı */}
            <mesh position={[0, 0.5, 0]} castShadow>
              <coneGeometry args={[0.3, 1, 5]} />
              <meshStandardMaterial color={isPlayerIsland ? "#33aa33" : "#aa3333"} />
            </mesh>
            <mesh position={[0, 0, 0]} castShadow>
              <cylinderGeometry args={[0.1, 0.1, 0.5, 8]} />
              <meshStandardMaterial color="#774411" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

// Ana oyun alanı bileşeni
const Battlefield = () => {
  const { player, npc, currentEnemyWave } = usePeacockIslandsStore();
  
  // Hex harita ızgarasını oluştur
  const boardRadius = 3;
  const hexSize = 1;
  const hexPositions: any[] = [];
  
  // Hex pozisyonlarını hesapla
  for (let q = -boardRadius; q <= boardRadius; q++) {
    for (let r = -boardRadius; r <= boardRadius; r++) {
      // Geçerli bir hex ızgara pozisyonu mu?
      if (Math.abs(q + r) <= boardRadius) {
        const pos = createHexPosition(q, r, hexSize);
        hexPositions.push({
          position: pos,
          q, r,
          isPlayerSide: r > 0,
          isEnemySide: r < 0
        });
      }
    }
  }
  
  // Hex ızgarasını renderla
  return (
    <group>
      {/* Arkaplan zemini */}
      <mesh 
        position={[0, -0.2, 0]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        receiveShadow
      >
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#385048" />
      </mesh>
      
      {/* Su efekti */}
      <mesh 
        position={[0, -0.15, 0]} 
        rotation={[-Math.PI / 2, 0, 0]} 
      >
        <planeGeometry args={[18, 18]} />
        <meshStandardMaterial 
          color="#4488aa" 
          transparent 
          opacity={0.7}
          roughness={0.1}
          metalness={0.2}
        />
      </mesh>
      
      {/* Oyuncu adası */}
      <Island 
        position={[0, 0, 7]} 
        isPlayerIsland={true} 
      />
      
      {/* Düşman adası */}
      <Island 
        position={[0, 0, -7]} 
        isPlayerIsland={false} 
      />
      
      {/* Hex harita */}
      {hexPositions.map((hex, i) => (
        <HexTile 
          key={i}
          position={hex.position}
          color={hex.isPlayerSide ? "#77aa88" : hex.isEnemySide ? "#aa7788" : "#88aa99"}
          isHighlighted={false}
          isPlayerSide={hex.isPlayerSide}
        />
      ))}
      
      {/* Oyuncu birimleri/askerleri */}
      {player && (
        <UnitPiece
          position={[0, 0, 5]}
          color="#4488ff"
          power={player.island.army.power}
        />
      )}
      
      {/* Düşman birimleri */}
      {currentEnemyWave && (
        <UnitPiece
          position={[0, 0, -5]}
          color="#ff5544"
          power={currentEnemyWave.power}
        />
      )}
    </group>
  );
};

// Kamera kontrolü
const CameraController = () => {
  const { camera, gl } = useThree();
  const controls = useRef<any>();
  
  useEffect(() => {
    // Kamera başlangıç pozisyonu
    camera.position.set(0, 10, 12);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return (
    <OrbitControls
      ref={controls}
      args={[camera, gl.domElement]}
      enableZoom={true}
      enablePan={true}
      enableRotate={true}
      minDistance={5}
      maxDistance={20}
      minPolarAngle={Math.PI / 6} // Alt açı limiti
      maxPolarAngle={Math.PI / 2.5} // Üst açı limiti
      target={[0, 0, 0]}
    />
  );
};

// Ana canvas bileşeni
const GameBoard3D = () => {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        shadows
        camera={{
          position: [0, 10, 12],
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        gl={{
          antialias: true,
          powerPreference: "default"
        }}
      >
        <color attach="background" args={["#4a6880"]} />
        
        {/* Işıklandırma */}
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1} 
          castShadow 
          shadow-mapSize={[2048, 2048]} 
        />
        
        {/* Kamera kontrolleri */}
        <CameraController />
        
        {/* Oyun alanı */}
        <Battlefield />
      </Canvas>
    </div>
  );
};

export default GameBoard3D;