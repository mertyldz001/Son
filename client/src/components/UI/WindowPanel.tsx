import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Minimize2 } from 'lucide-react';

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
    <div className={`mb-4 ${className}`}>
      <div 
        className={`flex items-center justify-between px-3 py-2 
          ${isMinimized 
            ? 'bg-gradient-to-r from-slate-800/90 to-slate-700/90 rounded-md border border-slate-600/30' 
            : 'bg-gradient-to-r from-blue-900/90 to-indigo-900/90 rounded-t-md border-b border-blue-500/20'
          } 
          backdrop-blur-md transition-all duration-300`}
      >
        <div className="flex items-center gap-2">
          {/* Başlık ikonu */}
          {titleIcon && (
            <span className="text-white/90">{titleIcon}</span>
          )}
          
          {/* Başlık */}
          <h3 className={`${isMinimized ? 'text-sm' : 'text-base'} font-medium text-blue-100/90 transition-all duration-300`}>
            {title}
          </h3>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Küçültme butonu */}
          <button 
            onClick={toggleMinimize}
            className={`p-1 rounded-full ${isMinimized ? 'hover:bg-blue-500/20' : 'hover:bg-white/10'} 
                      transition-colors focus:outline-none`}
            aria-label={isMinimized ? "Büyüt" : "Küçült"}
          >
            {isMinimized ? 
              <Maximize2 size={14} className="text-white/80" /> :
              <Minimize2 size={14} className="text-white/80" />
            }
          </button>
          
          {/* Kapatma butonu varsa göster */}
          {onClose && !isMinimized && (
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-red-500/30 transition-colors focus:outline-none"
              aria-label="Kapat"
            >
              <X size={14} className="text-white/80" />
            </button>
          )}
        </div>
      </div>
      
      {/* Panel İçeriği - Animasyonlu görünüm */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div 
            className={`px-4 py-3 overflow-auto bg-black/40 backdrop-blur-sm rounded-b-md border-x border-b border-slate-500/20`}
            style={{ height }}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WindowPanel;