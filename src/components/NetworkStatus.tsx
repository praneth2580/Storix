import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { useAppDispatch } from '../store/hooks';
import { addLog } from '../store/slices/logSlice';

export function NetworkStatus() {
  const dispatch = useAppDispatch();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineWarning, setShowOfflineWarning] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineWarning(false);
      dispatch(addLog({
        level: 'success',
        message: 'Connection restored',
        source: 'Network',
        details: 'Device is back online',
      }));
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineWarning(true);
      dispatch(addLog({
        level: 'error',
        message: 'Connection lost',
        source: 'Network',
        details: 'Device went offline. Data fetching will fail until connection is restored.',
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [dispatch]);

  if (!showOfflineWarning && isOnline) {
    return null;
  }

  return (
    <div
      className={`
        fixed top-0 left-0 right-0 z-[200] 
        ${isOnline ? 'bg-accent-green' : 'bg-accent-red'}
        text-white px-4 py-2 text-sm font-medium
        flex items-center justify-center gap-2
        shadow-lg
        ${showOfflineWarning ? 'animate-slide-down' : ''}
      `}
    >
      {isOnline ? (
        <>
          <Wifi size={16} />
          <span>Back online</span>
        </>
      ) : (
        <>
          <WifiOff size={16} />
          <span>No internet connection</span>
        </>
      )}
    </div>
  );
}

