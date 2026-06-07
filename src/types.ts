export interface HSV {
  h: number; // 0-360
  s: number; // 0-100
  v: number; // 0-100
}

export interface ColorMaster {
  id: string;
  productName: string;
  rgb: { r: number; g: number; b: number };
  hsv: HSV;
  createdAt: number;
}

export interface ScanSettings {
  proximityThresholdRatio: number; // 0.10〜0.50
  minClusterCells: number;          // 1〜10
}

export const DEFAULT_SCAN_SETTINGS: ScanSettings = {
  proximityThresholdRatio: 0.35,
  minClusterCells: 3,
};

export interface DetectionResult {
  masterId: string;
  productName: string;
  count: number;
  color: string; // css color string for marker
  positions: { x: number; y: number }[];
  checked: boolean;
}
