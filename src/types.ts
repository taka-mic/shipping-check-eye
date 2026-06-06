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

export interface DetectionResult {
  masterId: string;
  productName: string;
  count: number;
  color: string; // css color string for marker
  positions: { x: number; y: number }[];
  checked: boolean;
}
