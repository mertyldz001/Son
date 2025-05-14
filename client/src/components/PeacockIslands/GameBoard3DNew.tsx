import { useRef, useState, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  Text, 
  useTexture,
  Environment, 
  Sparkles,
  Float,
  MeshDistortMaterial,
  PresentationControls,
  PerspectiveCamera,
  OrthographicCamera
} from '@react-three/drei';

// Performans için efektler kaldırıldı
// import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { usePeacockIslandsStore } from '../../lib/stores/usePeacockIslandsStore';
import { PeacockWarriorModel, HumanSoldierModel } from './3DModels';
import { PenguinAvatar } from './PenguinAvatar';
import HexGrid from './HexGrid';
import { getDeployedUnitPositionsMap } from '../../lib/game/peacockIslands/unitSystem';

// Animasyonlu su yüzeyi bileşeni
const AnimatedWater = ({ position = [0, 0, 0], size = 20 }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [time, setTime] = useState(0);
  
  useFrame((_, delta) => {
    setTime(prev => prev + delta * 0.3);
    
    if (meshRef.current) {
      // Dalga efekti için yavaş dönüş
      meshRef.current.rotation.z = Math.sin(time * 0.05) * 0.05;
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
      <meshStandardMaterial 
        color="#4466aa" 
        metalness={0.2}
        roughness={0.1}
        transparent
        opacity={0.8}
      >
        <Float speed={2} floatIntensity={2} />
      </meshStandardMaterial>
    </mesh>
  );
};

// Oyuncu adası
const PlayerIsland = ({ position = [0, 0, 0] }) => {
  // Ada renkleri
  const islandColors = { 
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
      
      {/* Üst ada zemin katmanı */}
      <mesh 
        position={[0, 0, 0]} 
        receiveShadow
      >
        <cylinderGeometry args={[5, 5, 0.2, 8]} />
        <meshStandardMaterial 
          color={islandColors.terrain} 
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>
      
      {/* Ada kenarı süslemeler - daha düzenli dizilim */}
      <group>
        {Array.from({ length: decorationCount }).map((_, index) => {
          // Süsler için çevre etrafında açısal konumlar
          const angle = (index / decorationCount) * Math.PI * 2;
          // Adanın kenarında - yarıçapı 4.5 birim
          const posX = Math.sin(angle) * 4.5;
          const posZ = Math.cos(angle) * 4.5;
          
          // Her 3 süsten biri için dekorasyon tipini değiştir
          const decorationType = index % 3;
          
          return (
            <group 
              key={`decor_${index}`} 
              position={[posX, 0, posZ]}
              rotation={[0, Math.random() * Math.PI * 2, 0]}
            >
              {decorationType === 0 && (
                // Ağaç 
                <mesh position={[0, 0.5, 0]} castShadow>
                  {/* Gövde */}
                  <cylinderGeometry args={[0.1, 0.15, 0.8, 6]} />
                  <meshStandardMaterial color="#774433" roughness={0.9} />
                </mesh>
              )}
              
              {decorationType === 1 && (
                // Küçük yapı
                <>
                  <mesh position={[0, 0.25, 0]} castShadow>
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
    </group>
  );
};

// Düşman adası - oyuncu adasının farklı renkli versiyonu
const EnemyIsland = ({ position = [0, 0, 0] }) => {
  // Düşman ada renkleri - kırmızımsı tonlar
  const islandColors = { 
    base: "#995555", 
    terrain: "#8c4545", 
    buildings: "#8c6c65", 
    trees: "#653333",
    roofs: "#331111"
  };

  // Ada süsleme faktörü - kenarlar boyunca
  const decorationCount = 12;
    
  return (
    <group position={position}>
      {/* Deniz altı bazı */}
      <mesh 
        position={[0, -0.5, 0]} 
        receiveShadow
      >
        <cylinderGeometry args={[5.5, 6.5, 0.5, 8]} />
        <meshStandardMaterial 
          color="#553333" 
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
      
      {/* Üst ada zemin katmanı */}
      <mesh 
        position={[0, 0, 0]} 
        receiveShadow
      >
        <cylinderGeometry args={[5, 5, 0.2, 8]} />
        <meshStandardMaterial 
          color={islandColors.terrain} 
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>
      
      {/* Ada kenarı süslemeler */}
      <group>
        {Array.from({ length: decorationCount }).map((_, index) => {
          // Süsler için çevre etrafında açısal konumlar
          const angle = (index / decorationCount) * Math.PI * 2;
          // Adanın kenarında - yarıçapı 4.5 birim
          const posX = Math.sin(angle) * 4.5;
          const posZ = Math.cos(angle) * 4.5;
          
          // Her 3 süsten biri için dekorasyon tipini değiştir
          const decorationType = (index + 1) % 3; // Oyuncu adasından farklılaştır
          
          return (
            <group 
              key={`decor_${index}`} 
              position={[posX, 0, posZ]}
              rotation={[0, Math.random() * Math.PI * 2, 0]}
            >
              {decorationType === 0 && (
                // Ağaç 
                <mesh position={[0, 0.5, 0]} castShadow>
                  {/* Gövde */}
                  <cylinderGeometry args={[0.1, 0.15, 0.8, 6]} />
                  <meshStandardMaterial color="#442211" roughness={0.9} />
                </mesh>
              )}
              
              {decorationType === 1 && (
                // Küçük yapı
                <>
                  <mesh position={[0, 0.25, 0]} castShadow>
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
                  <meshStandardMaterial color="#554433" roughness={0.9} />
                </mesh>
              )}
            </group>
          );
        })}
      </group>
    </group>
  );
};

// Ana oyun alanı
const GameScene = () => {
  const { currentPhase, player } = usePeacockIslandsStore();
  const [zoom, setZoom] = useState(30);
  const [hoveredHex, setHoveredHex] = useState<{q: number, r: number, s: number} | null>(null);
  const [dragCursor, setDragCursor] = useState<{
    visible: boolean;
    type: "warrior" | "soldier" | null;
    unitId: string | null;
  }>({
    visible: false,
    type: null,
    unitId: null
  });
  
  // Kamera açısını doğru ayarla
  useEffect(() => {
    console.log("Kamera açısı düzeltildi");
  }, []);
  
  // Yerleştirilmiş birimleri al
  const deployedUnitPositions = useMemo(() => {
    return getDeployedUnitPositionsMap(player.island.units);
  }, [player.island.units]);
  
  // Kamera kontrolü için
  useEffect(() => {
    console.log("Kamera kontrolleri temizlendi");
    
    // Zoom kontrolü için klavye eventleri
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') {
        console.log("Yakınlaşma komutu alındı");
        if (zoom > 18) { // Minimum zoom (daha yakın)
          setZoom(z => {
            const newZoom = z - 2.5;
            console.log("Yeni zoom seviyesi:", newZoom);
            return newZoom;
          });
        }
      } else if (e.key === '-' || e.key === '_') {
        console.log("Uzaklaşma komutu alındı");
        if (zoom < 40) { // Maksimum zoom (daha uzak)
          setZoom(z => {
            const newZoom = z + 2.5;
            console.log("Yeni zoom seviyesi:", newZoom);
            return newZoom;
          });
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    console.log("⚙️ KAMERA KONTROL SİSTEMİ HAZIR:");
    console.log("✓ + tuşu: Yakınlaş");
    console.log("✓ - tuşu: Uzaklaş");
    console.log("Kamera kontrol fonksiyonu aktif edildi");
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [zoom]);
  
  // Unit sürükleme takibi için
  useEffect(() => {
    // Birim sürükleme başlangıcı
    const handleDragStart = (e: CustomEvent) => {
      if (e?.detail?.unit) {
        const unit = e.detail.unit;
        setDragCursor({
          visible: true,
          type: unit.type,
          unitId: unit.id
        });
        console.log('Birim sürükleme başladı:', unit.type, unit.id);
      }
    };
    
    // Birim sürükleme bitişi
    const handleDragEnd = () => {
      setDragCursor({
        visible: false,
        type: null,
        unitId: null
      });
      console.log('Birim sürükleme bitti');
    };
    
    // Hex tıklama olayını dinle
    const handleHexClick = (e: CustomEvent) => {
      // Sürükleme aktifse ve tıklanan hex konumu geçerliyse
      if (dragCursor.visible && dragCursor.unitId && e?.detail?.hexCoords) {
        const hexCoords = e.detail.hexCoords;
        const { isPlayerSide, isOccupied } = e.detail;
        
        // Sadece oyuncu tarafına ve boş hücrelere yerleştir
        if (isPlayerSide && !isOccupied) {
          console.log(`Birim ${dragCursor.unitId} yerleştirildi: q:${hexCoords.q}, r:${hexCoords.r}, s:${hexCoords.s}`);
          
          // Sürüklemeyi temizle
          setDragCursor({
            visible: false,
            type: null,
            unitId: null
          });
        }
      }
    };
    
    // Event dinleyicilerini ekle
    window.addEventListener('unit-drag-start', handleDragStart as EventListener);
    window.addEventListener('unit-drag-end', handleDragEnd as EventListener);
    window.addEventListener('hex-click', handleHexClick as EventListener);
    
    return () => {
      window.removeEventListener('unit-drag-start', handleDragStart as EventListener);
      window.removeEventListener('unit-drag-end', handleDragEnd as EventListener);
      window.removeEventListener('hex-click', handleHexClick as EventListener);
    };
  }, [dragCursor]);
  
  // Hex üzerine gelme eventi
  const handleHexHover = (coords: {q: number, r: number, s: number}) => {
    setHoveredHex(coords);
  };
  
  return (
    <>
      {/* TFT tarzı düz görünüm için kamera ayarı */}
      <PerspectiveCamera 
        position={[0, 14, 18]} 
        rotation={[-Math.PI/4, 0, 0]} 
        fov={35}
        near={0.1} 
        far={100}
        makeDefault
      />
      
      {/* Işıklandırma - eski hali */}
      <ambientLight intensity={0.3} />
      <directionalLight 
        position={[5, 12, 8]} 
        intensity={1.5} 
        castShadow 
        shadow-mapSize={[2048, 2048]} 
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      
      {/* Arka plan rengi - sabit düz renk */}
      <color attach="background" args={['#1a1a2e']} />
      
      {/* Hexagonal Savaş Alanı - Ortada */}
      <group position={[0, 0.1, 0]} scale={1}>
        <HexGrid 
          size={0.7} 
          gridWidth={7} 
          gridHeight={6} 
          unitPositions={deployedUnitPositions}
          onTileHover={handleHexHover}
        />
        
        {/* Sürüklenen birimin görsel önizlemesi - eğer varsa ve cursor hex üzerindeyse */}
        {dragCursor.visible && hoveredHex && (
          <group position={[
            0.7 * 2 * (hoveredHex.q - 3.5 + 0.5), // Merkezi hizalama için düzeltme
            0.5, // y pozisyonu (yerden yükseklik)
            hoveredHex.r * 0.7 * 2 // hex boyutuna göre z pozisyonu - yeni boyuta göre ayarlandı
          ]}>
            {dragCursor.type === 'warrior' ? (
              <PeacockWarriorModel 
                position={[0, 0, 0]} 
                rotation={[0, Math.PI, 0]} 
                scale={0.3} 
                type="adult" 
              />
            ) : (
              <HumanSoldierModel 
                position={[0, 0, 0]} 
                rotation={[0, Math.PI, 0]} 
                scale={0.3} 
              />
            )}
          </group>
        )}
      </group>
      
      {/* Oyuncu karakteri */}
      <PenguinAvatar />
      
      {/* Görsel efektler performans için kaldırıldı */}
    </>
  );
};

// Ana canvas bileşeni
const GameBoard3D = () => {
  const { currentPhase } = usePeacockIslandsStore();
  const isBattlePhase = currentPhase === "battle";
  
  // Sabit kamera pozisyonu - daha basit
  const cameraPosition: [number, number, number] = [0, 15, 15]; // Ortadan sade bakış açısı
  const backgroundColor = isBattlePhase ? "#1a3545" : "#2a4860";
  
  return (
    <div className="absolute inset-0 z-0 flex items-center justify-center">
      {/* TFT tarzı yeşil zemin eklendi */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-green-800 to-green-600 opacity-30 z-0"></div>
      <Canvas
        shadows
        className="w-full max-w-4xl h-full max-h-[85vh] mx-auto my-auto"
        camera={{
          position: [cameraPosition[0], cameraPosition[1], cameraPosition[2]],
          fov: 40,
          near: 0.1,
          far: 1000
        }}
        gl={{
          antialias: true,
          powerPreference: "default"
        }}
      >
        <color attach="background" args={[backgroundColor]} />
        
        {/* Ana sahne */}
        <Suspense fallback={null}>
          <GameScene />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default GameBoard3D;