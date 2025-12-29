import React, { useEffect, useState } from "react";
import type { OptionData } from "../components/Form";

export const SCRIPT_ID = localStorage.getItem('VITE_GOOGLE_SCRIPT_ID');
export const SCRIPT_URL = `https://script.google.com/macros/s/${SCRIPT_ID}/exec`;


// Global queue to serialize JSONP requests because backend uses a fixed callback name "storix"
let jsonpQueue: Promise<any> = Promise.resolve();

export function jsonp<T = any>(url: string): Promise<T> {
  // Chain the request to the end of the queue
  const request = jsonpQueue.then(() => {
    return new Promise<T>((resolve, reject) => {
      const callbackName = "storix";

      // Cleanup function to ensure we leave clean state and remove script
      const cleanup = () => {
        delete (window as any)[callbackName];
        if (script.parentNode) script.parentNode.removeChild(script);
      };

      (window as any)[callbackName] = (data: T) => {
        cleanup();
        resolve(data);
      };

      const script = document.createElement("script");
      script.src = `${url}&callback=${callbackName}`;
      script.onerror = (err) => {
        cleanup();
        reject(err);
      };

      document.body.appendChild(script);
    });
  });

  // Update queue to wait for this request (and ignore its error so checks keep processing)
  jsonpQueue = request.catch(() => { });

  return request;
}

export async function jsonpRequest<T>(sheet: string, params: Record<string, any> = {}): Promise<T> {
  const searchParams = new URLSearchParams();
  searchParams.append("sheet", sheet);

  Object.entries(params).forEach(([key, value]) => {
    searchParams.append(key, String(value));
  });

  const url = `${SCRIPT_URL}?${searchParams.toString()}`;
  return jsonp<T>(url);
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
