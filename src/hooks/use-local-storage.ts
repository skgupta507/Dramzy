import { useState } from "react";

export function useLocalStorage(
  key: string,
  initialValue: string,
): [string, (v: string) => void, () => void] {
  const [storedValue, setStoredValue] = useState<string>(() => {
    // Guard: window is not available during SSR
    if (typeof window === "undefined") return initialValue;
    try {
      return window.localStorage.getItem(key) ?? initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: string) => {
    try {
      setStoredValue(value);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // ignore
    }
  };

  const deleteKey = () => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
    } catch {
      // ignore
    }
  };

  return [storedValue, setValue, deleteKey];
}
