import { useSyncExternalStore } from 'react';

let active = false;
const listeners = new Set<() => void>();

export const maintenance = {
  get: () => active,
  set(value: boolean) {
    if (value === active) return;
    active = value;
    listeners.forEach((l) => l());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }
};

export const useMaintenance = () => useSyncExternalStore(maintenance.subscribe, maintenance.get, maintenance.get);
