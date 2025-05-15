import React from 'react';
import { motion } from 'framer-motion';
import { Unit } from '../../lib/game/peacockIslands/types';
import { PeacockWarriorViewer, HumanSoldierViewer } from './ModelViewer';

interface UnitCardProps {
  unit: Unit;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDeployed: boolean;
  slotIndex?: number;
}

const UnitCard: React.FC<UnitCardProps> = ({
  unit,
  isDragging,
  onDragStart,
  onDragEnd,
  isDeployed,
  slotIndex
}) => {
  // Birim tipine göre görsel ve stil ayarları
  const getUnitColor = () => {
    return unit.type === 'warrior' 
      ? 'border-blue-500 bg-gradient-to-br from-blue-900/70 to-blue-950/90 glow-blue-900' 
      : 'border-amber-500 bg-gradient-to-br from-amber-900/70 to-amber-950/90 glow-amber-900';
  };

  const getUnitName = () => {
    return unit.type === 'warrior' ? 'Tavus Askeri' : 'İnsan Askeri';
  };

  return (
    <motion.div
      className={`unit-card relative w-32 h-48 rounded-lg overflow-hidden cursor-grab border-2 transition-all duration-200 shadow-lg ${getUnitColor()} ${isDragging ? 'shadow-xl border-white z-50' : ''} ${isDeployed ? 'opacity-50 pointer-events-none' : ''}`}
      animate={{
        scale: isDragging ? 1.05 : 1,
        boxShadow: isDragging ? '0 10px 20px rgba(0,0,0,0.3)' : '0 4px 8px rgba(0,0,0,0.1)',
        y: isDragging ? -20 : 0,
      }}
      transition={{
        duration: 0.15
      }}
      onMouseDown={!isDeployed ? onDragStart : undefined}
      onMouseUp={!isDeployed ? onDragEnd : undefined}
      style={{
        touchAction: 'none',
      }}
    >
      {/* Kart Başlığı */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-2 z-10">
        <h4 className="text-white text-sm font-bold">{getUnitName()}</h4>
      </div>
      
      {/* Numara */}
      {slotIndex !== undefined && (
        <div className="absolute top-2 right-2 bg-amber-600 text-white w-6 h-6 flex items-center justify-center rounded-full z-20 font-bold text-sm">
          {slotIndex + 1}
        </div>
      )}
      
      {/* Arka plan resmi */}
      <div className="absolute inset-0 bg-slate-800 opacity-50">
        <div className="w-full h-full bg-[url('/textures/card_bg.jpg')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
      </div>
      
      {/* 3D Model Gösterimi */}
      <div className="absolute inset-0 flex items-center justify-center">
        {unit.type === 'warrior' ? (
          <div className="w-full h-full pointer-events-none scale-125">
            <PeacockWarriorViewer rotate={true} scale={1.5} />
          </div>
        ) : (
          <div className="w-full h-full pointer-events-none scale-125">
            <HumanSoldierViewer rotate={true} scale={1.5} />
          </div>
        )}
      </div>
      
      {/* Altın değeri */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center items-center">
        <div className="px-3 py-1 bg-amber-900/70 rounded-full border border-amber-500/50 flex items-center gap-1">
          <span className="material-icons text-amber-400 text-sm">attach_money</span>
          <span className="text-white font-bold">2</span>
        </div>
      </div>
      
      {/* Yerleştirildi göstergesi */}
      {isDeployed && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
          <span className="text-white font-bold bg-green-900/80 px-3 py-1 rounded-full text-sm">
            SAHADA
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default UnitCard;