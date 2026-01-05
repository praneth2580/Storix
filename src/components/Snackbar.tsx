import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type SnackbarType = 'success' | 'error' | 'info' | 'warning';

export interface SnackbarMessage {
  id: string;
  message: string;
  type: SnackbarType;
  duration?: number;
}

interface SnackbarProps {
  message: SnackbarMessage;
  onClose: (id: string) => void;
  index: number;
  total: number;
}

export function Snackbar({ message, onClose, index, total }: SnackbarProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(message.id), 300); // Wait for animation
    }, message.duration || 4000);

    return () => clearTimeout(timer);
  }, [message, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(message.id), 300);
  };

  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colors = {
    success: 'bg-accent-green border-accent-green text-white',
    error: 'bg-accent-red border-accent-red text-white',
    warning: 'bg-yellow-500 border-yellow-500 text-white',
    info: 'bg-accent-blue border-accent-blue text-white',
  };

  const Icon = icons[message.type];
  
  // Calculate stacking offset - newer snackbars appear on top
  const stackOffset = (total - index - 1) * 70; // 70px spacing between snackbars
  const scale = index === total - 1 ? 1 : 0.95 - (total - index - 1) * 0.03; // Slight scale down for stacked items
  const opacity = index === total - 1 ? 1 : 0.9 - (total - index - 1) * 0.1; // Slight opacity reduction for stacked items

  return (
    <div
      className={`
        fixed right-4 z-[100] 
        min-w-[250px] sm:min-w-[300px] max-w-[calc(100vw-2rem)] sm:max-w-[400px]
        ${colors[message.type]}
        border rounded-lg shadow-xl
        flex items-center gap-2 sm:gap-3 p-2.5 sm:p-4
        transition-all duration-300 ease-out
        pointer-events-auto
      `}
      style={{
        bottom: `${16 + stackOffset}px`, // 16px base + stacking offset
        transform: `translateY(${isVisible ? 0 : 16}px) scale(${scale})`,
        opacity: isVisible ? opacity : 0,
        zIndex: 100 + index, // Higher index = higher z-index (newer on top)
      }}
    >
      <Icon size={18} className="flex-shrink-0 sm:w-5 sm:h-5" />
      <p className="flex-1 text-xs sm:text-sm font-medium leading-tight">{message.message}</p>
      <button
        onClick={handleClose}
        className="flex-shrink-0 hover:opacity-80 transition-opacity p-0.5"
      >
        <X size={16} className="sm:w-[18px] sm:h-[18px]" />
      </button>
    </div>
  );
}

interface SnackbarContainerProps {
  messages: SnackbarMessage[];
  onClose: (id: string) => void;
}

export function SnackbarContainer({ messages, onClose }: SnackbarContainerProps) {
  // Only show the most recent messages (limit is handled in slice, but double-check here)
  const visibleMessages = messages.slice(-3);
  
  return (
    <div className="fixed bottom-0 right-4 z-[100] pointer-events-none w-auto max-w-[calc(100vw-2rem)] sm:max-w-[400px]">
      {visibleMessages.map((msg, index) => (
        <Snackbar 
          key={msg.id} 
          message={msg} 
          onClose={onClose}
          index={index}
          total={visibleMessages.length}
        />
      ))}
    </div>
  );
}

