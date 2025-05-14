import { useRef, useState, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  Text, 
  useTexture, 
  Sky, 
  Environment, 
  Sparkles,
  Cloud,
  Float,
  MeshDistortMaterial,
  PresentationControls,
  KeyboardControls,
  Line
} from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { usePeacockIslandsStore } from '../../lib/stores/usePeacockIslandsStore';
import { PeacockWarriorModel, HumanSoldierModel } from './3DModels';
import { PenguinAvatar } from './PenguinAvatar';

// Animasyonlu su yüzeyi bileşeni
const AnimatedWater = ({ position = [0, 0, 0], size = 20 }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [time, setTime] = useState(0);
  
  useFrame((_, delta) => {
    setTime(prev => prev + delta * 0.3);
    
    if (meshRef.current) {
      // Hafif dalgalanma efekti
      meshRef.current.position.y = Math.sin(time * 0.5) * 0.05;
    }
  });
  
  return (
    <mesh 
      ref={meshRef} 
      position={[position[0], position[1], position[2]]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[size, size, 32, 32]} />
      <MeshDistortMaterial
        color="#4488aa"
        transparent
        opacity={0.7}
        distort={0.3} // dalgalanma miktarı
        speed={1.5} // dalgalanma hızı
        roughness={0.4}
        metalness={0.2}
      />
    </mesh>
  );
};

// Ada temsili
const Island = ({ position, isPlayerIsland = false }: any) => {
  // Ada için renkler
  const islandColors = isPlayerIsland ? 
    { 
      base: "#88aa99", 
      terrain: "#76a288", 
      buildings: "#d5b981", 
      trees: "#33aa33",
      roofs: "#8b4513"
    } : 
    { 
      base: "#aa8899", 
      terrain: "#b38598", 
      buildings: "#a48871", 
      trees: "#aa3333",
      roofs: "#553322"
    };
  
  // Ada süsleme faktörü - kenarlar boyunca
  const decorationCount = 12;  // Daha fazla süs ekle
    
  return (
    <group position={position}>
      {/* Deniz altı bazı */}
      <mesh 
        position={[0, -0.5, 0]} 
        receiveShadow
      >
        <cylinderGeometry args={[5.5, 6.5, 0.5, 8]} />
        <meshStandardMaterial 
          color="#336677" 
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
      
      {/* Ana ada platformu - düzleştirilmiş */}
      <mesh 
        position={[0, -0.1, 0]} 
        receiveShadow
      >
        <cylinderGeometry args={[5, 5.5, 0.2, 8]} />
        <meshStandardMaterial 
          color={islandColors.base} 
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      
      {/* İkinci seviye toprak katmanı - düzleştirilmiş */}
      <mesh 
        position={[0, 0.05, 0]} 
        receiveShadow
      >
        <cylinderGeometry args={[4, 4.5, 0.1, 8]} />
        <meshStandardMaterial 
          color={islandColors.terrain} 
          roughness={0.9}
        />
      </mesh>
      
      {/* Merkez bina - Ada kenarına taşındı */}
      <group position={[3.5, 0.5, 0]}>
        {/* Temel */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.2, 0.6, 1.2]} />
          <meshStandardMaterial color={islandColors.buildings} roughness={0.8} />
        </mesh>
        
        {/* Kule 1 */}
        <mesh position={[-0.4, 0.8, -0.4]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 1.0, 8]} />
          <meshStandardMaterial color={islandColors.buildings} roughness={0.7} />
        </mesh>
        
        {/* Kule 1 Çatısı */}
        <mesh position={[-0.4, 1.3, -0.4]} castShadow>
          <coneGeometry args={[0.3, 0.4, 8]} />
          <meshStandardMaterial color={islandColors.roofs} roughness={0.6} />
        </mesh>
        
        {/* Ana bina çatısı */}
        <mesh position={[0, 0.8, 0]} castShadow>
          <boxGeometry args={[1.0, 0.5, 1.0]} />
          <meshStandardMaterial color={islandColors.roofs} roughness={0.6} />
        </mesh>
      </group>
      
      {/* İkinci bina, karşı tarafa */}
      <group position={[-3.2, 0.5, -1.0]}>
        {/* Temel */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.0, 0.6, 1.0]} />
          <meshStandardMaterial color={islandColors.buildings} roughness={0.8} />
        </mesh>
        
        {/* Çatı - piramit şeklinde */}
        <mesh position={[0, 0.6, 0]} castShadow>
          <coneGeometry args={[0.7, 0.8, 4]} />
          <meshStandardMaterial color={islandColors.roofs} roughness={0.6} />
        </mesh>
      </group>
      
      {/* Savaş alanını belirginleştiren mermer düzlem - ortadaki alanı belirtmek için */}
      <mesh 
        position={[0, 0.25, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[6, 6]} />
        <meshStandardMaterial 
          color={isPlayerIsland ? "#9bb5a5" : "#b59b9b"}
          roughness={0.7}
          metalness={0.1}
          transparent={true}
          opacity={0.6}
        />
      </mesh>
      
      {/* Ortadaki savaş alanının sınırlarını belirten taşlar */}
      {Array.from({ length: 4 }).map((_, i) => {
        const angle = (Math.PI / 2) * i;
        const x = Math.cos(angle) * 3;
        const z = Math.sin(angle) * 3;
        
        return (
          <group key={`corner-${i}`} position={[x, 0.3, z]}>
            <mesh castShadow>
              <boxGeometry args={[0.3, 0.3, 0.3]} />
              <meshStandardMaterial color="#aaaaaa" roughness={0.9} />
            </mesh>
          </group>
        );
      })}
      
      {/* Ada süslemeleri - Sadece kenarlar boyunca dizilmiş */}
      {Array.from({ length: decorationCount }).map((_, i) => {
        const angle = (Math.PI * 2 / decorationCount) * i;
        const radius = 4; // Adanın en dış çevresine yerleştir
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        // Dekorasyon türünü belirle: ağaç, bina veya kaya
        const decorationType = i % 3; // 0: ağaç, 1: bina, 2: kaya
        
        // Merkezi 3x3 alanına gelecek süslemeleri engelle
        const distanceFromCenter = Math.sqrt(x*x + z*z);
        if (distanceFromCenter < 2.5) return null; // Merkez alanı boş bırak
        
        return (
          <group key={i} position={[x, 0.3, z]}>
            {decorationType === 0 && (
              // Ağaç
              <>
                <mesh position={[0, 0.5, 0]} castShadow>
                  <coneGeometry args={[0.4, 1.2, 5]} />
                  <meshStandardMaterial color={islandColors.trees} roughness={0.7} />
                </mesh>
                <mesh position={[0, 0, 0]} castShadow>
                  <cylinderGeometry args={[0.1, 0.15, 0.6, 8]} />
                  <meshStandardMaterial color="#774411" roughness={0.8} />
                </mesh>
              </>
            )}
            
            {decorationType === 1 && (
              // Küçük bina
              <>
                <mesh position={[0, 0.3, 0]} castShadow>
                  <boxGeometry args={[0.5, 0.5, 0.5]} />
                  <meshStandardMaterial color={islandColors.buildings} roughness={0.8} />
                </mesh>
                <mesh position={[0, 0.7, 0]} castShadow>
                  <coneGeometry args={[0.4, 0.4, 4]} />
                  <meshStandardMaterial color={islandColors.roofs} roughness={0.7} />
                </mesh>
              </>
            )}
            
            {decorationType === 2 && (
              // Kaya
              <mesh position={[0, 0.15, 0]} castShadow rotation={[Math.random(), Math.random(), Math.random()]}>
                <dodecahedronGeometry args={[0.3, 0]} />
                <meshStandardMaterial color="#778899" roughness={0.9} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
};

// 6x7 Izgara savaş meydanı
const Battlefield = () => {
  const { currentPhase } = usePeacockIslandsStore();
  
  // Izgara hücre boyutu ve diğer sabitler
  const cellSize = 1.0; // Her bir kare hücrenin boyutu
  const gridWidth = 7; // 7 sütun
  const gridHeight = 6; // 6 satır
  const cellGap = 0.1; // Hücreler arası boşluk
  
  // Izgaranın tam boyutu (boşluklar dahil)
  const totalWidth = gridWidth * (cellSize + cellGap) - cellGap;
  const totalHeight = gridHeight * (cellSize + cellGap) - cellGap;
  
  // Merkeze hizalama için ofset hesapla
  const offsetX = -totalWidth / 2 + cellSize / 2;
  const offsetZ = -totalHeight / 2 + cellSize / 2;

  // 6x7 kare hücreleri oluştur
  const cells = [];
  for (let row = 0; row < gridHeight; row++) {
    for (let col = 0; col < gridWidth; col++) {
      // Kare pozisyonunu hesapla
      const x = offsetX + col * (cellSize + cellGap);
      const z = offsetZ + row * (cellSize + cellGap);
      
      // Hücre ID'si (benzersiz tanımlayıcı)
      const cellId = `kutu_${row * gridWidth + col + 1}`;
      
      // Oyuncu veya düşman tarafını belirle (üst 3 satır: düşman, alt 3 satır: oyuncu)
      const isPlayerSide = row >= gridHeight / 2;
      
      // Başlangıçta hücreler boş
      const isOccupied = false;
      
      // Renk (oyuncu/düşman tarafına göre)
      const color = isPlayerSide ? "#4477aa" : "#aa7744";
      
      cells.push(
        <group key={cellId} position={[x, 0.05, z]}>
          {/* Kare zemini */}
          <mesh receiveShadow>
            <boxGeometry args={[cellSize, 0.05, cellSize]} />
            <meshStandardMaterial 
              color={color} 
              roughness={0.7} 
              transparent={true}
              opacity={isOccupied ? 0.9 : 0.5}
            />
          </mesh>
          
          {/* Kare kenarları - daha belirgin görünüm için */}
          <mesh position={[0, 0.01, 0]}>
            <boxGeometry args={[cellSize, 0.01, cellSize]} />
            <meshBasicMaterial 
              color={isPlayerSide ? "#66aaff" : "#ffaa66"} 
              wireframe={true}
              linewidth={3}
            />
          </mesh>
          
          {/* Hücre ID'si (geliştirme aşamasında gösterilir) */}
          {/* <Text
            position={[0, 0.1, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.2}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            {cellId}
          </Text> */}
        </group>
      );
    }
  }
  
  return (
    <group>
      {/* Oyuncu alanı (ada) */}
      <group position={[0, 0, 5]}>
        <Island isPlayerIsland={true} />
      </group>
      
      {/* Düşman alanı (ada) */}
      <group position={[0, 0, -5]}>
        <Island isPlayerIsland={false} />
      </group>
      
      {/* Izgara (grid) yapısı - savaş meydanı - daha yukarıda */}
      <group position={[0, 0.3, 0]}>
        {cells}
      </group>
      
      {/* Zemindeki su animasyonu */}
      <AnimatedWater position={[0, -0.5, 0]} size={30} />
    </group>
  );
};

// Ana canvas bileşeni
const GameBoard3D = () => {
  const { currentPhase } = usePeacockIslandsStore();
  const isBattlePhase = currentPhase === "battle";
  
  // Fazlara göre farklı kamera ve arka plan renkleri
  const cameraPosition: [number, number, number] = isBattlePhase ? [0, 15, 0] : [8, 10, 12];
  const backgroundColor = isBattlePhase ? "#1a3545" : "#2a4860";
  
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        shadows
        camera={{
          position: [cameraPosition[0], cameraPosition[1], cameraPosition[2]],
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        gl={{
          antialias: true,
          powerPreference: "default"
        }}
      >
        <color attach="background" args={[backgroundColor]} />
        
        {/* Ortam ışığı */}
        <ambientLight intensity={0.5} />
        
        {/* Ana yönlü ışık - Güneş benzeri */}
        <directionalLight 
          position={[10, 15, 5]} 
          intensity={1.8} 
          castShadow 
          shadow-mapSize={[2048, 2048]} 
          shadow-camera-far={30}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        
        {/* Dramatik arka ışık */}
        <directionalLight
          position={[-5, 5, -5]}
          intensity={0.5}
          color="#aabbff"
        />
        
        {/* Dekoratif ışıklar */}
        <pointLight
          position={[5, 5, 5]}
          intensity={0.8}
          color={isBattlePhase ? "#3355cc" : "#cc7733"}
          distance={20}
          castShadow={false}
        />
        
        {/* Ortam Işığı - Adayı aydınlatır */}
        <pointLight
          position={[0, 8, 0]}
          intensity={1.0}
          color={isBattlePhase ? "#3366dd" : "#ffcc66"}
          distance={30}
          decay={2}
        />
        
        {/* Kenar vurgu ışıkları */}
        <pointLight
          position={[15, 3, 15]}
          intensity={0.6}
          color={isBattlePhase ? "#66aaff" : "#ff9966"}
          distance={15}
          decay={2}
        />
        
        {/* Basitleştirilmiş Atmosferik Efektler */}
        {!isBattlePhase && (
          <group position={[15, 15, -10]}>
            <mesh>
              <sphereGeometry args={[2, 16, 16]} />
              <meshStandardMaterial 
                color="#ffffff" 
                transparent 
                opacity={0.5} 
                roughness={0.9}
              />
            </mesh>
          </group>
        )}
        
        {/* Basitleştirilmiş Parçacık Efektleri */}
        {/* Genel parlak parçacıklar - Sayısı azaltıldı */}
        <Sparkles
          count={20}
          scale={10}
          size={0.4}
          speed={0.3}
          opacity={0.2}
          position={[0, 5, 0]}
          noise={1}
        />
        
        {/* Kamera Kontrolü */}
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={15}
          maxPolarAngle={Math.PI / 2 - 0.1}
        />

        {/* Keyboard kontrollerimiz için Context */}
        <KeyboardControls
          map={[
            { name: "KeyW", keys: ["ArrowUp", "KeyW"] },
            { name: "KeyS", keys: ["ArrowDown", "KeyS"] },
            { name: "KeyA", keys: ["ArrowLeft", "KeyA"] },
            { name: "KeyD", keys: ["ArrowRight", "KeyD"] }
          ]}
        >
          <PenguinAvatar />
        </KeyboardControls>
        
        {/* Oyun alanı */}
        <Battlefield />
        
        {/* Basitleştirilmiş Post-processing Efektleri */}
        <EffectComposer>
          {/* Bloom efekti - Sadece en temel ayarlarla */}
          <Bloom
            intensity={0.2}
            luminanceThreshold={0.8}
          />
        </EffectComposer>
        
        {/* Gelişmiş sis efekti - Fazlara göre değişir */}
        <fog 
          attach="fog" 
          args={[
            isBattlePhase ? "#1a3040" : "#2a4860", 
            isBattlePhase ? 20 : 25, 
            isBattlePhase ? 40 : 50
          ]} 
        />
      </Canvas>
    </div>
  );
};

export default GameBoard3D;