import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index';
import { useEffect, useRef } from 'react';
import { addSnackbar } from './slices/snackbarSlice';
import { addLog } from './slices/logSlice';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Custom Polling Hook with logging and notifications
export const useDataPolling = (action: any, intervalMs: number = 20000, source?: string) => {
    const dispatch = useAppDispatch();
    // Use a ref to store the interval ID so we can clear it on cleanup
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const previousCountRef = useRef<number | null>(null);

    useEffect(() => {
        // Initial fetch
        const initialPromise = dispatch(action());
        
        // Handle initial fetch result
        if (initialPromise && typeof initialPromise.then === 'function') {
            initialPromise
                .then((result: any) => {
                    if (result?.type?.includes('fulfilled')) {
                        const actionName = action.typePrefix || source || 'Data';
                        const count = result?.payload?.length || result?.payload?.items?.length || 0;
                        previousCountRef.current = count;
                        
                        dispatch(addLog({
                            level: 'success',
                            message: `${actionName} loaded successfully`,
                            source: source || actionName,
                            details: `Loaded ${count} items`,
                        }));
                    }
                })
                .catch((error: any) => {
                    const actionName = action.typePrefix || source || 'Data';
                    const errorMessage = error?.message || error?.toString() || 'Unknown error';
                    
                    // Show snackbar notification
                    dispatch(addSnackbar({
                        message: `Failed to load ${actionName}: ${errorMessage}`,
                        type: 'error',
                        duration: 6000,
                    }));
                    
                    // Log error
                    dispatch(addLog({
                        level: 'error',
                        message: `Failed to load ${actionName}`,
                        source: source || actionName,
                        details: errorMessage,
                    }));
                });
        }

        // Set up polling
        intervalRef.current = setInterval(() => {
            const pollPromise = dispatch(action());
            
            if (pollPromise && typeof pollPromise.then === 'function') {
                pollPromise
                    .then((result: any) => {
                        if (result?.type?.includes('fulfilled')) {
                            const actionName = action.typePrefix || source || 'Data';
                            const count = result?.payload?.length || result?.payload?.items?.length || 0;
                            const prevCount = previousCountRef.current;
                            
                            if (prevCount !== null && count !== prevCount) {
                                // Data changed
                        dispatch(addSnackbar({
                            message: `${actionName} updated (${count} items)`,
                            type: 'success',
                            duration: 3000,
                        }));
                                
                                dispatch(addLog({
                                    level: 'success',
                                    message: `${actionName} updated`,
                                    source: source || actionName,
                                    details: `Count changed from ${prevCount} to ${count}`,
                                }));
                            }
                            
                            previousCountRef.current = count;
                        }
                    })
                    .catch((error: any) => {
                        const actionName = action.typePrefix || source || 'Data';
                        const errorMessage = error?.message || error?.toString() || 'Unknown error';
                        
                        // Show snackbar notification
                        dispatch(addSnackbar({
                            message: `Failed to update ${actionName}: ${errorMessage}`,
                            type: 'error',
                            duration: 6000,
                        }));
                        
                        // Log error
                        dispatch(addLog({
                            level: 'error',
                            message: `Failed to update ${actionName}`,
                            source: source || actionName,
                            details: errorMessage,
                        }));
                    });
            }
        }, intervalMs);

        // Cleanup on unmount
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [dispatch, action, intervalMs, source]);
};
