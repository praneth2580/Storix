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
  const callbackName = "storix"; // Fixed callback name from backend
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

  // Define the global callback - ensure it's set up before script loads
  if (!(window as any)[callbackName]) {
    (window as any)[callbackName] = (response: any) => {
      // This will be handled by the request-specific handler below
    };
  }
  
  // Store the original callback to restore later if needed
  const originalCallback = (window as any)[callbackName];
  
  // Define request-specific callback handler
  (window as any)[callbackName] = (response: any) => {
    // Only handle if this is for our current request
    if (isResolved) return; // Prevent double resolution
    isResolved = true;
    
    try {
      let data = response;
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

  const cleanup = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    // We don't delete window.storix because it's fixed, but we could nullify it if we wanted safety
    // (window as any)[callbackName] = undefined; 
    if (script && script.parentNode) {
      script.parentNode.removeChild(script);
    }
    script = null;
  };

  const query = new URLSearchParams({
    sheet,
    ...params, // No 'callback' param needed as it's fixed in backend, but backend might ignore it
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

  // Set up timeout
  timeoutId = setTimeout(() => {
    if (isResolved) return;
    isResolved = true;
    
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
    
    const errorDetails = getErrorDetails('TIMEOUT', `Request timed out after ${JSONP_TIMEOUT}ms (${retryCount + 1} attempts)`);
    const error = new Error(`Request timeout for ${sheet} after ${JSONP_TIMEOUT}ms (${retryCount + 1} attempts). URL: ${fullUrl}. This may indicate: 1) Slow network connection, 2) Server overload, 3) Script execution timeout. Details: ${JSON.stringify(errorDetails)}`);
    cleanup();
    reject(error);
    // Process next item
    requestQueue.shift();
    processQueue();
  }, JSONP_TIMEOUT);

  script.src = fullUrl;
  script.async = true;
  script.onerror = () => {
    if (isResolved) return;
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
    
    const errorDetails = getErrorDetails('SCRIPT_LOAD_ERROR', `Script tag failed to load after ${retryCount + 1} attempts`);
    const error = new Error(`JSONP script failed to load for ${sheet} after ${retryCount + 1} attempts. URL: ${fullUrl}. This may be due to: 1) CORS/CSP restrictions, 2) Network blocking, 3) Invalid Script ID, 4) Script deployment issues. Details: ${JSON.stringify(errorDetails)}`);
    cleanup();
    reject(error);
    // Process next item
    requestQueue.shift();
    processQueue();
  };

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
