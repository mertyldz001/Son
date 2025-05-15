import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Minimize2, CircleUser, CircleUserRound, User, Users, Leaf, Egg, ShieldCheck } from 'lucide-react';

interface WindowPanelProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
  width?: string; 
  height?: string;
  initiallyMinimized?: boolean;
  titleIcon?: React.ReactNode;
  iconType?: 'island' | 'feather' | 'army' | 'egg' | 'default';
}

const WindowPanel: React.FC<WindowPanelProps> = ({
  title,
  children,
  className = '',
  onClose,
  width = '100%',
  height = 'auto',
  initiallyMinimized = false,
  titleIcon,
  iconType = 'default'
}) => {
  const [isMinimized, setIsMinimized] = useState(initiallyMinimized);

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // İkon seçimi
  const getIcon = () => {
    switch (iconType) {
      case 'island':
        return <CircleUserRound size={24} className="text-blue-300" />;
      case 'feather':
        return <Leaf size={24} className="text-green-300" />;
      case 'army':
        return <ShieldCheck size={24} className="text-red-300" />;
      case 'egg':
        return <Egg size={24} className="text-amber-300" />;
      default:
        return titleIcon || <User size={24} className="text-blue-300" />;
    }
  };

  // Minimized durumdaki renk
  const getMinimizedStyle = () => {
    switch (iconType) {
      case 'island':
        return 'from-blue-700/90 to-blue-800/80 border-blue-500/30';
      case 'feather':
        return 'from-green-700/90 to-green-800/80 border-green-500/30';
      case 'army':
        return 'from-red-700/90 to-red-800/80 border-red-500/30';
      case 'egg':
        return 'from-amber-700/90 to-amber-800/80 border-amber-500/30';
      default:
        return 'from-slate-800/90 to-slate-700/90 border-slate-600/30';
    }
  };

  return (
    <div className={`mb-4 ${className}`}>
      {isMinimized ? (
        // Küçültülmüş ikon versiyonu
        <motion.button
          onClick={toggleMinimize}
          className={`rounded-full w-12 h-12 bg-gradient-to-br ${getMinimizedStyle()} 
            border shadow-md hover:shadow-lg flex items-center justify-center
            transition-all duration-300 hover:scale-105`}
          whileHover={{ y: -2 }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          layoutId={`window-panel-${title}`}
        >
          {getIcon()}
        </motion.button>
      ) : (
        // Normal pencere versiyonu
        <motion.div
          className="w-full"
          layoutId={`window-panel-${title}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
        >
          <div className="bg-gradient-to-r from-blue-900/90 to-indigo-900/90 rounded-t-md border-b border-blue-500/20 backdrop-blur-md flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2">
              {/* Başlık ikonu */}
              <span className="text-white/90">{getIcon()}</span>
              
              {/* Başlık */}
              <h3 className="text-base font-medium text-blue-100/90">
                {title}
              </h3>
            </div>
            
            <div className="flex items-center gap-1">
              {/* Küçültme butonu */}
              <button 
                onClick={toggleMinimize}
                className="p-1 rounded-full hover:bg-white/10 transition-colors focus:outline-none"
                aria-label="Küçült"
              >
                <Minimize2 size={14} className="text-white/80" />
              </button>
              
              {/* Kapatma butonu varsa göster */}
              {onClose && (
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
          
          {/* Panel İçeriği */}
          <motion.div 
            className="px-4 py-3 overflow-auto bg-black/40 backdrop-blur-sm rounded-b-md border-x border-b border-slate-500/20"
            style={{ width, height }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default WindowPanel;