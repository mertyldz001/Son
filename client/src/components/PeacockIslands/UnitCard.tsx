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
}

const UnitCard: React.FC<UnitCardProps> = ({
  unit,
  isDragging,
  onDragStart,
  onDragEnd,
  isDeployed
}) => {
  // Birim tipine göre görsel ve stil ayarları
  const getUnitColor = () => {
    return unit.type === 'warrior' 
      ? 'border-blue-500 bg-gradient-to-br from-blue-900/70 to-blue-950/90' 
      : 'border-amber-500 bg-gradient-to-br from-amber-900/70 to-amber-950/90';
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
      
      {/* Birim Özellikleri */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 z-10">
        <div className="grid grid-cols-3 gap-1 text-white">
          <div className="flex flex-col items-center bg-black/30 rounded p-1">
            <span className="text-xs text-gray-300">CAN</span>
            <span className="text-md font-bold">{unit.health}</span>
          </div>
          <div className="flex flex-col items-center bg-black/30 rounded p-1">
            <span className="text-xs text-gray-300">GÜÇ</span>
            <span className="text-md font-bold">{unit.attackPower}</span>
          </div>
          <div className="flex flex-col items-center bg-black/30 rounded p-1">
            <span className="text-xs text-gray-300">HIZ</span>
            <span className="text-md font-bold">{Math.floor(unit.attackSpeed * 10)}</span>
          </div>
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