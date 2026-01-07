import React, { useEffect, useState } from "react";
// Removed broken import
export interface OptionData {
  value: string;
  label: string;
}

export const SCRIPT_ID = localStorage.getItem('VITE_GOOGLE_SCRIPT_ID');
export const SCRIPT_URL = `https://script.google.com/macros/s/${SCRIPT_ID}/exec`;


// export function jsonpRequest<T>(
//   sheet: string,
//   params: Record<string, string> = {}
// ): Promise<T[]> {
//   return new Promise((resolve, reject) => {
//     if (typeof document === "undefined") {
//       reject("Not running in a browser environment");
//       return;
//     }

//     const callbackName = `jsonp_cb_${Date.now()}_${Math.floor(
//       Math.random() * 1000
//     )}`;
//     (window as any)[callbackName] = (response: any) => {
//       try {
//         // console.log(`✅ JSONP Response [${sheet}]`, response);
//         resolve(Array.isArray(response) ? response : response.data || []);
//       } catch (err) {
//         reject(err);
//       } finally {
//         delete (window as any)[callbackName];
//         if (script.parentNode) script.parentNode.removeChild(script);
//       }
//     };

//     const query = new URLSearchParams({
//       sheet,
//       callback: callbackName,
//       ...params,
//     }).toString();

//     const script = document.createElement("script");
//     script.src = `${SCRIPT_URL}?${query}`;
//     script.async = true;
//     script.onerror = () => {
//       delete (window as any)[callbackName];
//       reject(new Error(`JSONP request failed for ${sheet}`));
//     };

//     document.body.appendChild(script);
//   });
// }
// Queue for serializing JSONP requests
interface RequestItem {
  sheet: string;
  params: Record<string, string>;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  retryCount?: number;
}

const requestQueue: RequestItem[] = [];
let isProcessingQueue = false;
const JSONP_TIMEOUT = 30000; // 30 seconds timeout
const MAX_RETRIES = 2; // Maximum retry attempts
const RETRY_DELAY = 2000; // 2 seconds delay between retries

const processQueue = () => {
  if (requestQueue.length === 0) {
    isProcessingQueue = false;
    return;
  }

  isProcessingQueue = true;
  const requestItem = requestQueue[0];
  const { sheet, params, resolve, reject } = requestItem;
  const retryCount = requestItem.retryCount || 0;
  // Generate unique callback name for each request (ensure valid JS identifier)
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  const callbackName = `storix_${timestamp}_${random}`;
  let timeoutId: NodeJS.Timeout | null = null;
  let script: HTMLScriptElement | null = null;
  let isResolved = false;

  // Enhanced error details for mobile debugging
  const getErrorDetails = (errorType: string, additionalInfo?: string) => {
    const scriptId = localStorage.getItem('VITE_GOOGLE_SCRIPT_ID');
    const userAgent = navigator.userAgent;
    const isOnline = navigator.onLine;
    const url = script ? script.src : 'N/A';
    
    return {
      errorType,
      sheet,
      params: JSON.stringify(params),
      scriptId: scriptId ? `${scriptId.substring(0, 8)}...` : 'MISSING',
      url,
      userAgent: userAgent.substring(0, 100), // Truncate for storage
      isOnline,
      timestamp: new Date().toISOString(),
      additionalInfo,
    };
  };

  // Define request-specific callback handler
  // IMPORTANT: Set this up BEFORE creating/loading the script to avoid race conditions
  (window as any)[callbackName] = (response: any) => {
    // Only handle if this is for our current request
    if (isResolved) return; // Prevent double resolution
    isResolved = true;
    
    try {
      let data = response;
      
      // Check if response contains an error
      if (data && typeof data === 'object' && data.error) {
        const errorDetails = getErrorDetails('SERVER_ERROR', data.error);
        const error = new Error(`Server error for ${sheet}: ${data.error}. Details: ${JSON.stringify(errorDetails)}`);
        cleanup();
        reject(error);
        requestQueue.shift();
        processQueue();
        return;
      }

      // Handle wrapped format: { data: [...] } if applicable, though typically backend returns direct obj or array
      // The new backend seems to return obj directly or { results: ... } for batch

      if (timeoutId) clearTimeout(timeoutId);
      cleanup();
      resolve(data);
      // Process next item
      requestQueue.shift();
      processQueue();
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
      const errorDetails = getErrorDetails('PARSE_ERROR', err instanceof Error ? err.message : String(err));
      const error = new Error(`Failed to parse response for ${sheet}. Details: ${JSON.stringify(errorDetails)}`);
      cleanup();
      reject(error);
      // Process next item
      requestQueue.shift();
      processQueue();
    }
  };
  
  // Verify callback is set up before proceeding
  if (typeof (window as any)[callbackName] !== 'function') {
    const errorDetails = getErrorDetails('CALLBACK_SETUP_ERROR', 'Failed to set up callback function');
    const error = new Error(`Failed to set up JSONP callback for ${sheet}. Details: ${JSON.stringify(errorDetails)}`);
    reject(error);
    requestQueue.shift();
    processQueue();
    return;
  }

  const cleanup = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    // Clean up the unique callback function
    try {
      delete (window as any)[callbackName];
    } catch (e) {
      // Ignore cleanup errors
    }
    if (script && script.parentNode) {
      script.parentNode.removeChild(script);
    }
    script = null;
  };

  const query = new URLSearchParams({
    sheet,
    callback: callbackName, // Pass dynamic callback name to backend
    ...params,
  }).toString();

  script = document.createElement("script");
  const scriptId = localStorage.getItem('VITE_GOOGLE_SCRIPT_ID');

  if (!scriptId) {
    const errorDetails = getErrorDetails('MISSING_SCRIPT_ID');
    const error = new Error(`VITE_GOOGLE_SCRIPT_ID is missing in localStorage. Details: ${JSON.stringify(errorDetails)}`);
    reject(error);
    // cleanup and move next
    requestQueue.shift();
    processQueue();
    return;
  }

  // Check network status
  if (!navigator.onLine) {
    const errorDetails = getErrorDetails('OFFLINE');
    const error = new Error(`Device is offline. Cannot fetch ${sheet}. Details: ${JSON.stringify(errorDetails)}`);
    reject(error);
    requestQueue.shift();
    processQueue();
    return;
  }

  const scriptUrl = `https://script.google.com/macros/s/${scriptId}/exec`;
  const fullUrl = `${scriptUrl}?${query}`;

  // Double-check callback is ready before loading script
  if (typeof (window as any)[callbackName] !== 'function') {
    const errorDetails = getErrorDetails('CALLBACK_NOT_READY', 'Callback function not available before script load');
    const error = new Error(`JSONP callback not ready for ${sheet}. Details: ${JSON.stringify(errorDetails)}`);
    cleanup();
    reject(error);
    requestQueue.shift();
    processQueue();
    return;
  }

  // Set up timeout - this handles cases where script loads but callback never executes
  timeoutId = setTimeout(() => {
    if (isResolved) return;
    isResolved = true;
    
    // Check if script loaded but callback wasn't called
    const scriptLoaded = script && (script.readyState === 'complete' || script.readyState === 'loaded');
    const timeoutReason = scriptLoaded 
      ? 'Script loaded but callback was not executed. This may indicate: 1) Backend returned invalid JSONP, 2) Callback name mismatch, 3) CSP blocking script execution'
      : `Request timed out after ${JSONP_TIMEOUT}ms. This may indicate: 1) Slow network connection, 2) Server overload, 3) Script execution timeout`;
    
    // Retry logic for timeout
    if (retryCount < MAX_RETRIES) {
      cleanup();
      // Wait before retrying
      setTimeout(() => {
        requestItem.retryCount = retryCount + 1;
        // Re-add to queue for retry
        requestQueue.unshift(requestItem);
        isProcessingQueue = false;
        processQueue();
      }, RETRY_DELAY);
      return;
    }
    
    const errorDetails = getErrorDetails('TIMEOUT', timeoutReason);
    const error = new Error(`Request timeout for ${sheet} after ${JSONP_TIMEOUT}ms (${retryCount + 1} attempts). URL: ${fullUrl}. ${timeoutReason}. Details: ${JSON.stringify(errorDetails)}`);
    cleanup();
    reject(error);
    // Process next item
    requestQueue.shift();
    processQueue();
  }, JSONP_TIMEOUT);

  // Set script properties before setting src to ensure proper loading
  script.async = true;
  script.charset = 'utf-8';
  
  // Set up error handler before setting src
  script.onerror = async () => {
    if (isResolved) return;
    
    // Try to fetch the URL directly to see what error we get (for debugging)
    let diagnosticInfo = 'Script tag failed to load';
    try {
      // Use fetch to check what the server actually returns (this will fail due to CORS, but we can see the error)
      const fetchResponse = await fetch(fullUrl, { method: 'GET', mode: 'no-cors' }).catch((fetchErr: any) => {
        // Expected to fail due to CORS, but this helps us understand the issue
        return null;
      });
      
      if (fetchResponse) {
        const text = await fetchResponse.text();
        diagnosticInfo = `Server returned: ${text.substring(0, 200)}`;
      }
    } catch (diagErr) {
      // Ignore diagnostic errors
    }
    
    isResolved = true;
    if (timeoutId) clearTimeout(timeoutId);
    
    // Retry logic for mobile network issues
    if (retryCount < MAX_RETRIES) {
      cleanup();
      // Wait before retrying
      setTimeout(() => {
        requestItem.retryCount = retryCount + 1;
        // Re-add to queue for retry
        requestQueue.unshift(requestItem);
        isProcessingQueue = false;
        processQueue();
      }, RETRY_DELAY);
      return;
    }
    
    const errorDetails = getErrorDetails('SCRIPT_LOAD_ERROR', `${diagnosticInfo} after ${retryCount + 1} attempts. Possible causes: 1) Backend script not deployed or has errors, 2) CORS/CSP restrictions, 3) Network blocking, 4) Invalid Script ID, 5) Backend returning invalid JavaScript/JSONP`);
    const error = new Error(`JSONP script failed to load for ${sheet} after ${retryCount + 1} attempts. URL: ${fullUrl}. ${diagnosticInfo}. This may be due to: 1) Backend script not deployed with latest changes, 2) Backend script has errors, 3) CORS/CSP restrictions, 4) Network blocking, 5) Invalid Script ID. Please verify the backend script is deployed and working. Details: ${JSON.stringify(errorDetails)}`);
    cleanup();
    reject(error);
    // Process next item
    requestQueue.shift();
    processQueue();
  };
  
  // Set src AFTER setting up error handler and ensuring callback is ready
  // This ensures the callback exists when the script executes
  script.src = fullUrl;
  
  // Add load handler to detect if script loads successfully
  script.onload = () => {
    // Script loaded successfully - callback should be called by the script
    // If callback isn't called within timeout, timeout handler will catch it
    // This is just for debugging - we don't resolve here, wait for callback
  };
  
  // Append to DOM - this triggers the script load
  document.body.appendChild(script);
};

export function jsonpRequest<T>(
  sheet: string,
  params: Record<string, string> = {}
): Promise<T> {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      reject("Not running in a browser environment");
      return;
    }

    requestQueue.push({ sheet, params, resolve, reject });

    if (!isProcessingQueue) {
      processQueue();
    }
  });
}


export function parseAttributes(input: string): Record<string, string> {
  try {
    return JSON.parse(input);
  } catch {
    return Object.fromEntries(
      input.split(",")
        .map(p => p.split("="))
        .filter(([k, v]) => k && v)
        .map(([k, v]) => [k.trim(), v.trim()])
    );
  }
}

export const useGenericChange = <T extends object>(
  setFormData: React.Dispatch<React.SetStateAction<T>>
) => {
  return React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;

      setFormData(prev => ({
        ...prev,
        [name]: type === "number" ? Number(value) : value,
      }));
    },
    [setFormData]
  );
};

export const usePhoneChange = <T extends object>(
  setFormData: React.Dispatch<React.SetStateAction<T>>,
  maxLength: number = 10
) => {
  return React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;

      const digits = value.replace(/\D/g, "").slice(0, maxLength);

      setFormData(prev => ({
        ...prev,
        [name]: digits,
      }));
    },
    [setFormData, maxLength]
  );
};

export const useEmailChange = <T extends object>(
  setFormData: React.Dispatch<React.SetStateAction<T>>
) => {
  return React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;

      setFormData(prev => ({
        ...prev,
        [name]: value.toLowerCase(),
      }));
    },
    [setFormData]
  );
};

export const useJSONChange = <T extends object>(
  setFormData: React.Dispatch<React.SetStateAction<T>>
) => {
  return React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;

      setFormData(prev => ({
        ...prev,
        [name]: JSON.stringify(value),
      }));
    },
    [setFormData]
  );
};

export const formatOptions = (options: string[] | OptionData[]): OptionData[] => {
  if (!options || options.length === 0) return [];

  // If first element is an object → assume already OptionData[]
  if (typeof options[0] === "object" && options[0] !== null) {
    return options as OptionData[];
  }

  // If string[] → convert to OptionData[]
  return (options as string[]).map(str => ({
    value: str,
    label: str,
  }));
};

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;

    // Check localStorage first
    const stored = localStorage.getItem("dark-mode");
    if (stored !== null) return stored === "true";

    // Default to light mode if nothing stored
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;

    // Force dark or light mode regardless of system preference
    if (isDark) {
      root.classList.add("dark");
      root.style.colorScheme = "dark"; // <- force prefers-color-scheme
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light"; // <- force prefers-color-scheme
    }

    localStorage.setItem("dark-mode", String(isDark));
  }, [isDark]);

  return [isDark, setIsDark] as const;
}

export const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });

export const formatDateForUI = (
  unformattedDate: string,
  compact: boolean = false
): string => {
  const date = new Date(unformattedDate);

  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");

  // Convert to 12-hour format
  const ampm = hours >= 12 ? "PM" : "AM";
  const hour12 = (hours % 12 || 12).toString().padStart(2, "0");

  const timeFormatted = compact
    ? `${hours.toString().padStart(2, "0")}:${minutes}` // 24h format
    : `${hour12}:${minutes} ${ampm}`; // 12h format

  if (compact) {
    // Example: 24/01/2025 14:32
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${date.getFullYear()} ${timeFormatted}`;
  }

  // Example: 24 January 2025, 02:32 PM
  const day = date.getDate().toString().padStart(2, "0");
  const month = date.toLocaleString("en-US", { month: "long" });
  const year = date.getFullYear();

  return `${day} ${month} ${year} ${timeFormatted}`;
};

export const openNewTab = (endpoint: string) => {
  const base = window.location.origin + import.meta.env.BASE_URL;
  const url = `${base}#${endpoint}`;
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.click();
};
