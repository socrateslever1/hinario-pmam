/**
 * Sistema de Memória Global (Rastro)
 * Salva e recupera a última atividade do usuário no site.
 */

export type LastAccessedType = 'hymn' | 'study' | 'drill' | 'mission';

export interface LastAccessedItem {
  type: LastAccessedType;
  id: string | number;
  title: string;
  subtitle?: string;
  url: string;
  timestamp: number;
}

const STORAGE_KEY = 'pmam_last_accessed';

export function saveLastAccessed(item: Omit<LastAccessedItem, 'timestamp'>) {
  if (typeof window === 'undefined') return;
  
  const newItem: LastAccessedItem = {
    ...item,
    timestamp: Date.now()
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newItem));
}

export function getLastAccessed(): LastAccessedItem | null {
  if (typeof window === 'undefined') return null;
  
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return null;
  
  try {
    return JSON.parse(saved) as LastAccessedItem;
  } catch {
    return null;
  }
}

export function clearLastAccessed() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
