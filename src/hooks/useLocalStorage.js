import { useCallback, useEffect, useState } from 'react';

function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/** useState that mirrors to localStorage. Degrades to in-memory state when storage is blocked (e.g. some private modes). */
export function useLocalStorage(key, fallback) {
  const [value, setValue] = useState(() => read(key, fallback));

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable, keep in memory */
    }
  }, [key, value]);

  // Keep multiple tabs in sync
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === key) setValue(read(key, fallback));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const reset = useCallback(() => setValue(fallback), [fallback]);
  return [value, setValue, reset];
}
