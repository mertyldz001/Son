import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense } from "react";
import { FeatherModel, EggModel, PeacockWarriorModel, HumanSoldierModel } from "./3DModels";

// Kenar tüy modeli görüntüleyici
export function FeatherViewer({ color = "green", rotate = true, scale = 1, className = "" }: { 
  color?: "green" | "blue" | "orange"; 
  rotate?: boolean;
  scale?: number;
  className?: string;
}) {
  return (
    <div className={`w-full h-full min-h-[100px] ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 40 }}
        shadows
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        
        <Suspense fallback={null}>
          <FeatherModel 
            color={color}
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            scale={scale}
          />
        </Suspense>
        
        {rotate && <OrbitControls autoRotate autoRotateSpeed={3} enableZoom={false} enablePan={false} />}
      </Canvas>
    </div>
  );
}

// Yumurta model görüntüleyici
export function EggViewer({ color = "green", rotate = true, scale = 1, isActive = false, className = "" }: { 
  color?: "green" | "blue" | "orange"; 
  rotate?: boolean;
  scale?: number;
  isActive?: boolean;
  className?: string;
}) {
  return (
    <div className={`w-full h-full min-h-[100px] ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 40 }}
        shadows
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        
        <Suspense fallback={null}>
          <EggModel 
            color={color}
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            scale={scale}
            isActive={isActive}
          />
        </Suspense>
        
        {rotate && <OrbitControls autoRotate autoRotateSpeed={2} enableZoom={false} enablePan={false} />}
      </Canvas>
    </div>
  );
}

// Tavus Kuşu Savaşçı model görüntüleyici
export function PeacockWarriorViewer({ type = "adult", rotate = true, scale = 1, className = "" }: { 
  type?: "chick" | "juvenile" | "adult" | "alpha"; 
  rotate?: boolean;
  scale?: number;
  className?: string;
}) {
  return (
    <div className={`w-full h-full min-h-[100px] ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 40 }}
        shadows
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        
        <Suspense fallback={null}>
          <PeacockWarriorModel 
            position={[0, -1, 0]}
            rotation={[0, 0, 0]}
            scale={scale}
            type={type}
          />
        </Suspense>
        
        {rotate && <OrbitControls autoRotate autoRotateSpeed={2} enableZoom={false} enablePan={false} />}
      </Canvas>
    </div>
  );
}

// İnsan Asker model görüntüleyici
export function HumanSoldierViewer({ rotate = true, scale = 1, className = "" }: { 
  rotate?: boolean;
  scale?: number;
  className?: string;
}) {
  return (
    <div className={`w-full h-full min-h-[100px] ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 40 }}
        shadows
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        
        <Suspense fallback={null}>
          <HumanSoldierModel 
            position={[0, -1, 0]}
            rotation={[0, 0, 0]}
            scale={scale}
          />
        </Suspense>
        
        {rotate && <OrbitControls autoRotate autoRotateSpeed={2} enableZoom={false} enablePan={false} />}
      </Canvas>
    </div>
  );
}