import type { HSV } from './types';

export function rgbToHsv(r: number, g: number, b: number): HSV {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const diff = max - min;

  let h = 0;
  if (diff !== 0) {
    if (max === rn) h = ((gn - bn) / diff) % 6;
    else if (max === gn) h = (bn - rn) / diff + 2;
    else h = (rn - gn) / diff + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  const s = max === 0 ? 0 : Math.round((diff / max) * 100);
  const v = Math.round(max * 100);

  return { h, s, v };
}

export function hsvDistance(a: HSV, b: HSV): { hDiff: number; sDiff: number; vDiff: number } {
  let hDiff = Math.abs(a.h - b.h);
  if (hDiff > 180) hDiff = 360 - hDiff; // circular hue
  return { hDiff, sDiff: Math.abs(a.s - b.s), vDiff: Math.abs(a.v - b.v) };
}

// Thresholds: hue ±25deg, saturation ±25, value ±30
const H_THRESH = 25;
const S_THRESH = 25;
const V_THRESH = 30;

export function matchesColor(pixel: HSV, master: HSV): boolean {
  // For low-saturation colors (white/gray/black), relax hue and rely on s/v
  if (master.s < 20 || pixel.s < 20) {
    return Math.abs(pixel.s - master.s) <= S_THRESH && Math.abs(pixel.v - master.v) <= V_THRESH;
  }
  const { hDiff, sDiff, vDiff } = hsvDistance(pixel, master);
  return hDiff <= H_THRESH && sDiff <= S_THRESH && vDiff <= V_THRESH;
}

export function extractColorFromRegion(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius = 8
): { r: number; g: number; b: number } {
  const x = Math.max(0, cx - radius);
  const y = Math.max(0, cy - radius);
  const w = radius * 2;
  const h = radius * 2;
  const data = ctx.getImageData(x, y, w, h).data;

  let rSum = 0, gSum = 0, bSum = 0, count = 0;
  for (let i = 0; i < data.length; i += 4) {
    rSum += data[i];
    gSum += data[i + 1];
    bSum += data[i + 2];
    count++;
  }
  return {
    r: Math.round(rSum / count),
    g: Math.round(gSum / count),
    b: Math.round(bSum / count),
  };
}

export function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const sv = s / 100, vv = v / 100;
  const c = vv * sv;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = vv - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

/**
 * BFS connected-component clustering on a grid of hit points.
 * Points are in pixel coordinates sampled at `step` intervals.
 * After BFS, nearby components (centroids within `mergeDist` px) are merged
 * to handle shadows/reflections that create small gaps inside one sticker.
 * Returns one centroid per product instance.
 */
export function bfsClusters(
  hits: { x: number; y: number }[],
  step: number,
  mergeDist = 180,
  minCells = 1,
): { x: number; y: number }[] {
  if (hits.length === 0) return [];

  // Build a Set keyed by grid cell coords for O(1) lookup
  // Extend neighborhood to 2 grid steps to bridge 1-cell gaps
  const cellSet = new Set<string>();
  const cellMap = new Map<string, { x: number; y: number }>();
  for (const h of hits) {
    const gx = Math.round(h.x / step);
    const gy = Math.round(h.y / step);
    const key = `${gx},${gy}`;
    cellSet.add(key);
    cellMap.set(key, h);
  }

  const visited = new Set<string>();
  const centroids: { x: number; y: number; size: number }[] = [];

  for (const key of cellSet) {
    if (visited.has(key)) continue;
    // BFS with 2-step neighborhood to bridge small gaps
    const queue = [key];
    visited.add(key);
    const component: { x: number; y: number }[] = [];
    while (queue.length > 0) {
      const cur = queue.shift()!;
      component.push(cellMap.get(cur)!);
      const [gx, gy] = cur.split(',').map(Number);
      for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -2; dy <= 2; dy++) {
          if (dx === 0 && dy === 0) continue;
          const nk = `${gx + dx},${gy + dy}`;
          if (cellSet.has(nk) && !visited.has(nk)) {
            visited.add(nk);
            queue.push(nk);
          }
        }
      }
    }
    // ノイズ除去：ヒット数が minCells 未満のクラスタは破棄
    if (component.length < minCells) continue;
    centroids.push({
      x: Math.round(component.reduce((s, c) => s + c.x, 0) / component.length),
      y: Math.round(component.reduce((s, c) => s + c.y, 0) / component.length),
      size: component.length,
    });
  }

  // Second pass: merge centroids that are still too close (gap bridging)
  const merged: boolean[] = new Array(centroids.length).fill(false);
  const result: { x: number; y: number }[] = [];
  for (let i = 0; i < centroids.length; i++) {
    if (merged[i]) continue;
    let cx = centroids[i].x * centroids[i].size;
    let cy = centroids[i].y * centroids[i].size;
    let totalSize = centroids[i].size;
    for (let j = i + 1; j < centroids.length; j++) {
      if (merged[j]) continue;
      const dx = centroids[i].x - centroids[j].x;
      const dy = centroids[i].y - centroids[j].y;
      if (Math.sqrt(dx * dx + dy * dy) < mergeDist) {
        cx += centroids[j].x * centroids[j].size;
        cy += centroids[j].y * centroids[j].size;
        totalSize += centroids[j].size;
        merged[j] = true;
      }
    }
    result.push({ x: Math.round(cx / totalSize), y: Math.round(cy / totalSize) });
  }
  return result;
}

// Marker colors that contrast well for overlays
export const MARKER_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b',
];
