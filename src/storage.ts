import type { ColorMaster } from './types';

const KEY = 'shipping_check_masters';

export function loadMasters(): ColorMaster[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function saveMasters(masters: ColorMaster[]): void {
  localStorage.setItem(KEY, JSON.stringify(masters));
}

export function addMaster(master: ColorMaster): ColorMaster[] {
  const list = loadMasters();
  list.push(master);
  saveMasters(list);
  return list;
}

export function deleteMaster(id: string): ColorMaster[] {
  const list = loadMasters().filter(m => m.id !== id);
  saveMasters(list);
  return list;
}
