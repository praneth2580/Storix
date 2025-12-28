import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index';
import { useEffect, useRef } from 'react';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Custom Polling Hook
export const useDataPolling = (action: any, intervalMs: number = 20000) => {
    const dispatch = useAppDispatch();
    // Use a ref to store the interval ID so we can clear it on cleanup
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Initial fetch
        dispatch(action());

        // Set up polling
        intervalRef.current = setInterval(() => {
            console.log(`[Polling] Dispatching action: ${action.typePrefix}`);
            dispatch(action());
        }, intervalMs);

        // Cleanup on unmount
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [dispatch, action, intervalMs]);
};
