import { useCallback, useMemo } from 'react';
import { FREQUENCIES, FREQUENCY_ORDER } from '../data/frequencies';
import { STORAGE_KEYS } from '../data/site';
import { useLocalStorage } from './useLocalStorage';

const EMPTY = [];

/** Scavenger-hunt state: which frequencies have been found, persisted. */
export function useDiscoveries() {
  const [stored, setStored, reset] = useLocalStorage(STORAGE_KEYS.discovered, EMPTY);

  // Ignore anything stale/unknown that might be sitting in storage.
  const discovered = useMemo(
    () => (Array.isArray(stored) ? stored.filter((id) => FREQUENCIES[id]) : []),
    [stored],
  );

  /** Returns true if this call newly discovered the frequency. */
  const discover = useCallback(
    (id) => {
      if (!FREQUENCIES[id]) return false;
      const isNew = !discovered.includes(id);
      setStored((prev) => {
        const list = Array.isArray(prev) ? prev.filter((x) => FREQUENCIES[x]) : [];
        return list.includes(id) ? list : [...list, id];
      });
      return isNew;
    },
    [discovered, setStored],
  );

  const isDiscovered = useCallback((id) => discovered.includes(id), [discovered]);
  const complete = FREQUENCY_ORDER.every((id) => discovered.includes(id));

  return { discovered, discover, isDiscovered, complete, count: discovered.length, reset };
}

/** Normalize ?frequency= / ?unlock= values (case, whitespace, common aliases). */
const ALIASES = {
  portrait: 'portraits', wall: 'portraits', pantheon: 'portraits',
  sofa: 'chair', couch: 'chair', throne: 'chair', frontroom: 'chair',
  coffeetable: 'table', magazines: 'table', jet: 'table', essence: 'table',
  record: 'turntable', vinyl: 'turntable', stereo: 'turntable', console: 'turntable',
  telephone: 'phone', rotary: 'phone',
};

export function resolveFrequencyParam(search = window.location.search) {
  const params = new URLSearchParams(search);
  const raw = (params.get('frequency') || params.get('unlock') || params.get('f') || '').trim().toLowerCase();
  if (!raw) return null;
  const key = raw.replace(/[^a-z]/g, '');
  if (FREQUENCIES[key]) return key;
  return ALIASES[key] || null;
}
