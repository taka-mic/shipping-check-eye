import type { ColorMaster, ScanSettings } from './types';
import { DEFAULT_SCAN_SETTINGS } from './types';

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

const SETTINGS_KEY = 'shipping_check_settings';

export function loadSettings(): ScanSettings {
  try {
    return { ...DEFAULT_SCAN_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') };
  } catch {
    return { ...DEFAULT_SCAN_SETTINGS };
  }
}

export function saveSettings(s: ScanSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}
