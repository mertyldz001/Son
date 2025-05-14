import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo, useMotionValue } from 'framer-motion';
import { ChevronUp, ChevronDown, X, Maximize2, Minimize2, Move } from 'lucide-react';

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
  width = '400px', // Varsayılan genişliği değiştirdim
  height = 'auto',
  initiallyMinimized = false,
  titleIcon
}) => {
  const [isMinimized, setIsMinimized] = useState(initiallyMinimized);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [windowSize, setWindowSize] = useState({ width, height });
  const [originalSize, setOriginalSize] = useState({ width, height });
  
  // Pencerenin sürüklenebilmesi için değişkenler
  const constraintsRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Boyut değiştiriciler için referanslar
  const resizeRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [startResize, setStartResize] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  useEffect(() => {
    // Eğer parent pencere boyutu değişirse, tam ekran modunda değilse orijinal boyuta dön
    if (!isFullScreen && !isMinimized) {
      setWindowSize(originalSize);
    }
  }, [isFullScreen, isMinimized, originalSize]);

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (isFullScreen) setIsFullScreen(false);
  };
  
  const toggleFullScreen = () => {
    if (!isFullScreen) {
      // Tam ekrana geçerken orijinal boyutu kaydet
      setOriginalSize({ width: windowSize.width, height: windowSize.height });
      setWindowSize({ width: '100%', height: '100%' });
    } else {
      // Tam ekrandan çıkarken orijinal boyuta dön
      setWindowSize(originalSize);
    }
    setIsFullScreen(!isFullScreen);
    // Tam ekrana geçerken küçültülmüş hali kapat
    if (isMinimized) setIsMinimized(false);
    // Pozisyonu sıfırla
    x.set(0);
    y.set(0);
  };

  // Mouse ile pencere boyutu değiştirme
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    
    // Başlangıç konumu ve boyutu kaydet
    if (panelRef.current) {
      setStartResize({
        x: e.clientX,
        y: e.clientY,
        width: parseInt(windowSize.width as string) || panelRef.current.offsetWidth,
        height: parseInt(windowSize.height as string) || panelRef.current.offsetHeight
      });
    }
    
    // Tarayıcıda geçici olarak mouse olaylarını dinle
    window.addEventListener('mousemove', handleResize);
    window.addEventListener('mouseup', handleResizeEnd);
  };
  
  const handleResize = (e: MouseEvent) => {
    if (!isResizing) return;
    
    // Mouse hareketi farkını hesapla
    const deltaX = e.clientX - startResize.x;
    const deltaY = e.clientY - startResize.y;
    
    // Yeni boyutları hesapla (minimum sınırı 200px)
    const newWidth = Math.max(300, startResize.width + deltaX);
    const newHeight = Math.max(200, startResize.height + deltaY);
    
    // Yeni boyutları uygula
    setWindowSize({
      width: `${newWidth}px`,
      height: `${newHeight}px`
    });
  };
  
  const handleResizeEnd = () => {
    setIsResizing(false);
    
    // Tarayıcıda geçici mouse olaylarını kaldır
    window.removeEventListener('mousemove', handleResize);
    window.removeEventListener('mouseup', handleResizeEnd);
  };
  
  // Sürükleme işlemi tamamlandığında pencereyi sınırlar içinde tut
  const handleDragEnd = (event: MouseEvent, info: PanInfo) => {
    if (isFullScreen) return;
    
    // Eğer pencerenin konumu çok uzaktaysa, ekran içinde kal
    if (Math.abs(info.point.x) > window.innerWidth || Math.abs(info.point.y) > window.innerHeight) {
      x.set(0);
      y.set(0);
    }
  };

  return (
    <motion.div 
      ref={constraintsRef}
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: isFullScreen ? 100 : 10 }}
    >
      <motion.div
        ref={panelRef}
        className={`${isMinimized ? '' : 'bg-black/40 backdrop-blur-sm'} 
                    rounded-md shadow-xl pointer-events-auto
                    ${isMinimized ? '' : 'border border-slate-500/20'} 
                    ${isFullScreen ? 'absolute inset-0' : 'relative'} 
                    ${className}`}
        style={{ 
          width: isFullScreen ? '100%' : (isMinimized ? 'auto' : windowSize.width),
          height: isFullScreen ? '100%' : (isMinimized ? 'auto' : windowSize.height),
          zIndex: isFullScreen ? 50 : 1,
          x,
          y
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        drag={!isFullScreen && !isMinimized}
        dragConstraints={constraintsRef}
        dragMomentum={false}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
      >
        {/* Panel Başlık Çubuğu - Modern TFT tarzı */}
        <div 
          className={`flex items-center justify-between px-3 py-2 
            ${isMinimized 
              ? 'bg-gradient-to-r from-slate-800/90 to-slate-700/90 rounded-md border border-slate-600/30' 
              : isFullScreen
                ? 'bg-gradient-to-r from-slate-900/90 to-slate-800/90 border-b border-blue-500/20'
                : 'bg-gradient-to-r from-blue-900/90 to-indigo-900/90 rounded-t-md border-b border-blue-500/20'
            } 
            backdrop-blur-md transition-all duration-300`}
        >
          <div className="flex items-center gap-2 cursor-move flex-grow" style={{ touchAction: 'none' }}>
            {/* Başlık ikonu */}
            {titleIcon && (
              <span className="text-white/90">{titleIcon}</span>
            )}
            
            {/* Sürükleme ikonu */}
            <span className="text-white/40 hidden sm:block">
              <Move size={14} />
            </span>
            
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
            
            {/* Tam ekran butonu */}
            {!isMinimized && (
              <button 
                onClick={toggleFullScreen}
                className="p-1 rounded-full hover:bg-white/10 transition-colors focus:outline-none"
                aria-label={isFullScreen ? "Normal ekran" : "Tam ekran"}
              >
                <Maximize2 size={14} className="text-white/80" />
              </button>
            )}
            
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
              className="px-4 py-3 overflow-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
              style={{ 
                height: isFullScreen ? 'calc(100% - 34px)' : (windowSize.height !== 'auto' ? `calc(${windowSize.height} - 34px)` : 'auto'),
                maxHeight: isFullScreen ? 'calc(100% - 34px)' : '70vh'
              }}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Boyut değiştirme tutamaçları - sadece tam ekran modunda değilse */}
        {!isMinimized && !isFullScreen && (
          <div 
            ref={resizeRef}
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
            onMouseDown={handleResizeStart}
          >
            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-b-[8px] border-b-blue-400/40 absolute bottom-0 right-0"></div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default WindowPanel;