import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, X, Maximize2, Minimize2 } from 'lucide-react';

interface WindowPanelProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
  width?: string;
  height?: string;
  initiallyMinimized?: boolean;
  titleIcon?: React.ReactNode;
}

const WindowPanel: React.FC<WindowPanelProps> = ({
  title,
  children,
  className = '',
  onClose,
  width = '100%',
  height = 'auto',
  initiallyMinimized = false,
  titleIcon
}) => {
  const [isMinimized, setIsMinimized] = useState(initiallyMinimized);

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <motion.div
      className={`${isMinimized ? '' : 'bg-black/30 backdrop-blur-sm'} rounded-md shadow-lg ${isMinimized ? '' : 'border border-white/10'} ${className}`}
      style={{ width }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      layout
    >
      {/* Panel Başlık Çubuğu - Normal veya küçültülmüş görünümü */}
      <div 
        className={`flex items-center justify-between px-4 py-2 
          ${isMinimized 
            ? 'bg-gradient-to-r from-gray-700/60 to-gray-800/60 rounded-md border border-slate-600/30' 
            : 'bg-gradient-to-r from-blue-900/60 to-indigo-900/60 rounded-t-md'} 
          cursor-move transition-all duration-300`}
      >
        <div className="flex items-center gap-2">
          {/* Başlık ikonu */}
          {titleIcon && (
            <span className="text-white/90">{titleIcon}</span>
          )}
          
          {/* Başlık */}
          <h3 className={`${isMinimized ? 'text-sm' : 'text-lg'} font-semibold text-white transition-all duration-300`}>
            {title}
          </h3>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Küçültme butonu */}
          <button 
            onClick={toggleMinimize}
            className={`p-1 rounded-full ${isMinimized ? 'hover:bg-blue-500/20' : 'hover:bg-white/10'} 
                      transition-all focus:outline-none`}
            aria-label={isMinimized ? "Büyüt" : "Küçült"}
          >
            {isMinimized ? 
              <Maximize2 size={isMinimized ? 14 : 16} className="text-white/90" /> :
              <Minimize2 size={16} className="text-white/90" />
            }
          </button>
          
          {/* Kapatma butonu varsa göster */}
          {onClose && !isMinimized && (
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-red-500/30 transition-all focus:outline-none"
              aria-label="Kapat"
            >
              <X size={16} className="text-white/90" />
            </button>
          )}
        </div>
      </div>
      
      {/* Panel İçeriği - Animasyonlu görünüm */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div 
            className="px-4 py-3 overflow-auto"
            style={{ height: isMinimized ? '0' : height }}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default WindowPanel;