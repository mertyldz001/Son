import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Unit } from '../../lib/game/peacockIslands/types';

interface DragDropProps {
  children: React.ReactNode;
  onDrop: (unit: Unit, hexCoords: {q: number, r: number, s: number}) => void;
  unit: Unit;
  onlyPlayerSide?: boolean;
}

const DragDrop: React.FC<DragDropProps> = ({ 
  children, 
  onDrop, 
  unit,
  onlyPlayerSide = true
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragRef = useRef<HTMLDivElement>(null);
  const cloneRef = useRef<HTMLDivElement>(null);

  // Başlangıç pozisyonunu kaydet
  const startPos = useRef({ x: 0, y: 0 });
  const mouseOffset = useRef({ x: 0, y: 0 });

  // Fare pozisyonunu takip et
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - mouseOffset.current.x,
          y: e.clientY - mouseOffset.current.y
        });
      }
    };

    // Fare düğmesi bırakıldığında
    const handleMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        const hexTarget = document.elementsFromPoint(e.clientX, e.clientY)
          .find(el => el.classList.contains('hex-tile'));
        
        if (hexTarget) {
          const q = parseInt(hexTarget.getAttribute('data-q') || '0');
          const r = parseInt(hexTarget.getAttribute('data-r') || '0');
          const s = parseInt(hexTarget.getAttribute('data-s') || '0');
          
          // Eğer sadece oyuncu tarafı belirtilmişse, r değerini kontrol et
          if (onlyPlayerSide) {
            // Alt üç sıra (3, 4, 5) oyuncuya ait
            if (r >= 3) {
              onDrop(unit, { q, r, s });
            }
          } else {
            onDrop(unit, { q, r, s });
          }
        }
        
        setIsDragging(false);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onDrop, unit, onlyPlayerSide]);

  // Sürükleme başladığında
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (dragRef.current) {
      const rect = dragRef.current.getBoundingClientRect();
      startPos.current = { x: rect.left, y: rect.top };
      
      // Fare ile elemanın merkezine olan offset'i hesapla
      mouseOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      
      setPosition({
        x: rect.left,
        y: rect.top
      });
      
      setIsDragging(true);
    }
  };

  // Sürükleme bittiğinde
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div ref={dragRef} className="relative cursor-grab">
      {isDragging && createPortal(
        <motion.div
          ref={cloneRef}
          className="fixed z-50 pointer-events-none"
          style={{
            left: 0,
            top: 0,
            transform: `translate(${position.x}px, ${position.y}px)`
          }}
        >
          {children}
        </motion.div>,
        document.body
      )}
      <div 
        style={{ visibility: isDragging ? 'hidden' : 'visible' }}
        onMouseDown={handleDragStart}
        onMouseUp={handleDragEnd}
      >
        {children}
      </div>
    </div>
  );
};

export default DragDrop;