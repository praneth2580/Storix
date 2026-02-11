import React, { useEffect, useState } from "react";
import { googleSheetsApi } from "./services/googleSheetsApi";
import type { BatchOperation } from "./services/googleSheetsApi";

export interface OptionData {
  value: string;
  label: string;
}

// No longer using legacy Script ID / JSONP authentication.

/**
 * Request function using Google Sheets API.
 * Maintains the same interface as the old jsonpRequest for model compatibility.
 */
export async function jsonpRequest<T>(
  sheet: string,
  params: Record<string, string> = {}
): Promise<T> {
  if (typeof document === "undefined") {
    throw new Error("Not running in a browser environment");
  }

  const action = params.action || "get";
  const id = params.id;

  try {
    switch (action) {
      case "get":
        // Convert params to filters (excluding action, id, callback, etc.)
        const filters: Record<string, string | string[]> = {};
        Object.entries(params).forEach(([key, value]) => {
          if (!['action', 'id', 'callback', 'window', 'interval', 'sheet'].includes(key)) {
            // Support comma-separated values for multi-value filters
            if (value.includes(',')) {
              filters[key] = value.split(',').map(v => v.trim());
            } else {
              filters[key] = value;
            }
          }
        });

        if (id) {
          // Get single row by ID
          const row = await googleSheetsApi.getRowById(sheet, id);
          return (row ? [row] : []) as T;
        } else {
          // Get all rows with filters
          const rows = await googleSheetsApi.getSheetData(sheet, filters);
          return rows as T;
        }

      case "create":
        if (!params.data) {
          throw new Error("Missing data payload");
        }
        const createData = JSON.parse(params.data);
        const createResult = await googleSheetsApi.createRow(sheet, createData);
        return [{ ...createResult, ...createData }] as T;

      case "update":
        if (!id || !params.data) {
          throw new Error("Missing id or data");
        }
        const updateData = JSON.parse(params.data);
        await googleSheetsApi.updateRow(sheet, id, updateData);
        return [{ status: "updated", id, ...updateData }] as T;

      case "delete":
        if (!id) {
          throw new Error("Missing id");
        }
        await googleSheetsApi.deleteRow(sheet, id);
        return [{ status: "deleted", id }] as T;

      case "batch":
        if (!params.data) {
          throw new Error("Missing batch payload");
        }
        const batchData = JSON.parse(params.data);
        if (!batchData.operations || !Array.isArray(batchData.operations)) {
          throw new Error("Missing operations[]");
        }
        const batchResult = await googleSheetsApi.batchOperations(batchData.operations as BatchOperation[]);
        return [{ status: batchResult.status, results: batchResult.results }] as T;

      default:
        throw new Error(`Invalid action: ${action}`);
    }
  } catch (error) {
    throw error instanceof Error ? error : new Error(String(error));
  }
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
