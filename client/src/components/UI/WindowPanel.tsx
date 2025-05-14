import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, X } from 'lucide-react';

interface WindowPanelProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
  width?: string;
  height?: string;
  initiallyMinimized?: boolean;
}

const WindowPanel: React.FC<WindowPanelProps> = ({
  title,
  children,
  className = '',
  onClose,
  width = '100%',
  height = 'auto',
  initiallyMinimized = false
}) => {
  const [isMinimized, setIsMinimized] = useState(initiallyMinimized);

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <motion.div
      className={`bg-black/30 backdrop-blur-sm rounded-md shadow-lg border border-white/10 ${className}`}
      style={{ width }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Panel Başlık Çubuğu */}
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-blue-900/60 to-indigo-900/60 rounded-t-md cursor-move">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <div className="flex items-center gap-2">
          {/* Küçültme butonu */}
          <button 
            onClick={toggleMinimize}
            className="p-1 rounded-full hover:bg-white/10 transition-all focus:outline-none"
            aria-label={isMinimized ? "Büyüt" : "Küçült"}
          >
            {isMinimized ? 
              <ChevronDown size={16} className="text-white" /> :
              <ChevronUp size={16} className="text-white" />
            }
          </button>
          
          {/* Kapatma butonu varsa göster */}
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-red-500/30 transition-all focus:outline-none"
              aria-label="Kapat"
            >
              <X size={16} className="text-white" />
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