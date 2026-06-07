import { describe, it, expect } from 'vitest';
import { rgbToHsv, hsvDistance, matchesColor, hsvToRgb, extractColorFromRegion, bfsClusters } from '../colorUtils';
import type { HSV } from '../types';

// ─── rgbToHsv ────────────────────────────────────────────────────────────────

describe('rgbToHsv', () => {
  it('純粋な赤 (255,0,0) → H=0, S=100, V=100', () => {
    expect(rgbToHsv(255, 0, 0)).toEqual({ h: 0, s: 100, v: 100 });
  });

  it('純粋な緑 (0,255,0) → H=120, S=100, V=100', () => {
    expect(rgbToHsv(0, 255, 0)).toEqual({ h: 120, s: 100, v: 100 });
  });

  it('純粋な青 (0,0,255) → H=240, S=100, V=100', () => {
    expect(rgbToHsv(0, 0, 255)).toEqual({ h: 240, s: 100, v: 100 });
  });

  it('白 (255,255,255) → S=0, V=100', () => {
    const result = rgbToHsv(255, 255, 255);
    expect(result.s).toBe(0);
    expect(result.v).toBe(100);
  });

  it('黒 (0,0,0) → S=0, V=0', () => {
    expect(rgbToHsv(0, 0, 0)).toEqual({ h: 0, s: 0, v: 0 });
  });

  it('グレー (128,128,128) → S=0', () => {
    const result = rgbToHsv(128, 128, 128);
    expect(result.s).toBe(0);
    expect(result.v).toBeGreaterThan(0);
  });

  it('黄色 (255,255,0) → H=60', () => {
    const result = rgbToHsv(255, 255, 0);
    expect(result.h).toBe(60);
    expect(result.s).toBe(100);
  });

  it('シアン (0,255,255) → H=180', () => {
    const result = rgbToHsv(0, 255, 255);
    expect(result.h).toBe(180);
  });

  it('マゼンタ (255,0,255) → H=300', () => {
    const result = rgbToHsv(255, 0, 255);
    expect(result.h).toBe(300);
  });

  it('H は常に 0〜360 の範囲', () => {
    const samples = [
      [200, 50, 30], [30, 200, 50], [50, 30, 200],
      [10, 100, 200], [200, 100, 10],
    ] as const;
    for (const [r, g, b] of samples) {
      const { h } = rgbToHsv(r, g, b);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThanOrEqual(360);
    }
  });

  it('S, V は常に 0〜100 の範囲', () => {
    const { s, v } = rgbToHsv(123, 45, 200);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(100);
  });
});

// ─── hsvDistance ─────────────────────────────────────────────────────────────

describe('hsvDistance', () => {
  it('同じ色は全差分 0', () => {
    const a: HSV = { h: 120, s: 80, v: 90 };
    expect(hsvDistance(a, a)).toEqual({ hDiff: 0, sDiff: 0, vDiff: 0 });
  });

  it('色相の円形計算: 350° と 10° の差は 20°', () => {
    const a: HSV = { h: 350, s: 80, v: 80 };
    const b: HSV = { h: 10, s: 80, v: 80 };
    expect(hsvDistance(a, b).hDiff).toBe(20);
  });

  it('色相の円形計算: 0° と 180° の差は 180°', () => {
    const a: HSV = { h: 0, s: 80, v: 80 };
    const b: HSV = { h: 180, s: 80, v: 80 };
    expect(hsvDistance(a, b).hDiff).toBe(180);
  });

  it('色相の最大差は 180° を超えない', () => {
    for (let h1 = 0; h1 < 360; h1 += 30) {
      for (let h2 = 0; h2 < 360; h2 += 30) {
        const diff = hsvDistance({ h: h1, s: 50, v: 50 }, { h: h2, s: 50, v: 50 }).hDiff;
        expect(diff).toBeLessThanOrEqual(180);
      }
    }
  });
});

// ─── matchesColor ─────────────────────────────────────────────────────────────

describe('matchesColor', () => {
  it('完全一致はマッチする', () => {
    const hsv: HSV = { h: 200, s: 80, v: 70 };
    expect(matchesColor(hsv, hsv)).toBe(true);
  });

  it('しきい値内の微差はマッチする', () => {
    const master: HSV = { h: 200, s: 80, v: 70 };
    const pixel: HSV  = { h: 215, s: 90, v: 85 }; // hDiff=15, sDiff=10, vDiff=15
    expect(matchesColor(pixel, master)).toBe(true);
  });

  it('色相がしきい値を超えるとマッチしない', () => {
    const master: HSV = { h: 100, s: 80, v: 80 };
    const pixel: HSV  = { h: 130, s: 80, v: 80 }; // hDiff=30 > 25
    expect(matchesColor(pixel, master)).toBe(false);
  });

  it('彩度がしきい値を超えるとマッチしない', () => {
    const master: HSV = { h: 100, s: 50, v: 80 };
    const pixel: HSV  = { h: 100, s: 80, v: 80 }; // sDiff=30 > 25
    expect(matchesColor(pixel, master)).toBe(false);
  });

  it('明度がしきい値を超えるとマッチしない', () => {
    const master: HSV = { h: 100, s: 80, v: 50 };
    const pixel: HSV  = { h: 100, s: 80, v: 85 }; // vDiff=35 > 30
    expect(matchesColor(pixel, master)).toBe(false);
  });

  it('低彩度マスタは色相を無視してS/Vで判定', () => {
    const master: HSV = { h: 0,   s: 5,  v: 90 }; // 白系
    const pixel: HSV  = { h: 200, s: 10, v: 95 }; // 色相は全く違うが S/V は近い
    expect(matchesColor(pixel, master)).toBe(true);
  });

  it('低彩度マスタで明度差が大きければ不一致', () => {
    const master: HSV = { h: 0, s: 5, v: 20 }; // 暗い
    const pixel: HSV  = { h: 0, s: 5, v: 90 }; // 明るい: vDiff=70
    expect(matchesColor(pixel, master)).toBe(false);
  });

  it('赤系の色相折り返し: 355° と 5° はマッチする', () => {
    const master: HSV = { h: 355, s: 90, v: 80 };
    const pixel: HSV  = { h: 5,   s: 90, v: 80 }; // hDiff=10
    expect(matchesColor(pixel, master)).toBe(true);
  });

  it('異なる色 (赤 vs 青) はマッチしない', () => {
    const red:  HSV = { h: 0,   s: 90, v: 80 };
    const blue: HSV = { h: 240, s: 90, v: 80 };
    expect(matchesColor(red, blue)).toBe(false);
  });
});

// ─── hsvToRgb ────────────────────────────────────────────────────────────────

describe('hsvToRgb', () => {
  it('H=0, S=100, V=100 → 赤 (255,0,0)', () => {
    expect(hsvToRgb(0, 100, 100)).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('H=120, S=100, V=100 → 緑 (0,255,0)', () => {
    expect(hsvToRgb(120, 100, 100)).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('H=240, S=100, V=100 → 青 (0,0,255)', () => {
    expect(hsvToRgb(240, 100, 100)).toEqual({ r: 0, g: 0, b: 255 });
  });

  it('S=0, V=100 → 白 (255,255,255)', () => {
    expect(hsvToRgb(0, 0, 100)).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('V=0 → 黒 (0,0,0)', () => {
    expect(hsvToRgb(0, 0, 0)).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('rgbToHsv との往復変換が一致する（代表色）', () => {
    const testColors = [
      { r: 255, g: 0,   b: 0   },
      { r: 0,   g: 200, b: 100 },
      { r: 100, g: 50,  b: 200 },
      { r: 255, g: 165, b: 0   },
    ];
    for (const original of testColors) {
      const { h, s, v } = rgbToHsv(original.r, original.g, original.b);
      const back = hsvToRgb(h, s, v);
      // 丸め誤差 ±2 を許容
      expect(Math.abs(back.r - original.r)).toBeLessThanOrEqual(2);
      expect(Math.abs(back.g - original.g)).toBeLessThanOrEqual(2);
      expect(Math.abs(back.b - original.b)).toBeLessThanOrEqual(2);
    }
  });
});

// ─── extractColorFromRegion ──────────────────────────────────────────────────

describe('extractColorFromRegion', () => {
  const makeCtx = (r: number, g: number, b: number, w = 100, h = 100) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, 0, w, h);
    return ctx;
  };

  it('単色キャンバス中央の色が正しく抽出される', () => {
    const ctx = makeCtx(200, 100, 50);
    const result = extractColorFromRegion(ctx, 50, 50, 10);
    expect(result.r).toBe(200);
    expect(result.g).toBe(100);
    expect(result.b).toBe(50);
  });

  it('端（cx=0, cy=0）でもクラッシュせず値を返す', () => {
    const ctx = makeCtx(0, 255, 0);
    expect(() => extractColorFromRegion(ctx, 0, 0, 8)).not.toThrow();
    const result = extractColorFromRegion(ctx, 0, 0, 8);
    expect(result.g).toBe(255);
  });

  it('デフォルト radius=8 で動作する', () => {
    const ctx = makeCtx(128, 128, 128);
    const result = extractColorFromRegion(ctx, 50, 50);
    expect(result).toEqual({ r: 128, g: 128, b: 128 });
  });
});

// ─── bfsClusters ─────────────────────────────────────────────────────────────

describe('bfsClusters', () => {
  it('空配列を渡すと空配列を返す', () => {
    expect(bfsClusters([], 10)).toEqual([]);
  });

  it('1点だけのとき1クラスタを返す', () => {
    const result = bfsClusters([{ x: 10, y: 10 }], 10);
    expect(result.length).toBe(1);
  });

  it('隣接する点は1クラスタにまとめられる（つながった領域 → 1製品）', () => {
    // step=10 のグリッド上で隣接する3点
    const hits = [
      { x: 10, y: 10 },
      { x: 20, y: 10 },
      { x: 30, y: 10 },
    ];
    const result = bfsClusters(hits, 10);
    expect(result.length).toBe(1);
    expect(result[0].x).toBe(20); // 平均
    expect(result[0].y).toBe(10);
  });

  it('離れた点は別クラスタになる（2つの製品）', () => {
    const hits = [
      { x: 10, y: 10 },
      { x: 20, y: 10 },
      { x: 200, y: 200 }, // 遠い
      { x: 210, y: 200 },
    ];
    const result = bfsClusters(hits, 10);
    expect(result.length).toBe(2);
  });

  it('大きな連続領域が1クラスタにまとめられる（旧アルゴリズムのバグ再現防止）', () => {
    // 10×10グリッドの連続したヒット（100点）
    const hits: { x: number; y: number }[] = [];
    for (let gx = 0; gx < 10; gx++) {
      for (let gy = 0; gy < 10; gy++) {
        hits.push({ x: gx * 10, y: gy * 10 });
      }
    }
    const result = bfsClusters(hits, 10);
    expect(result.length).toBe(1);
  });

  it('2つの離れた塊はそれぞれ1クラスタ（mergeDist超の間隔）', () => {
    const hits: { x: number; y: number }[] = [];
    // 塊1: (0,0)〜(20,20) → 重心 (10,10)
    for (let gx = 0; gx <= 2; gx++) for (let gy = 0; gy <= 2; gy++) hits.push({ x: gx * 10, y: gy * 10 });
    // 塊2: (250,0)〜(270,20) → 重心 (260,10)、距離250px > デフォルトmergeDist=180
    for (let gx = 25; gx <= 27; gx++) for (let gy = 0; gy <= 2; gy++) hits.push({ x: gx * 10, y: gy * 10 });
    const result = bfsClusters(hits, 10);
    expect(result.length).toBe(2);
  });

  it('minCells未満の小クラスタはノイズとして除外される', () => {
    const hits = [
      { x: 10, y: 10 }, // 1点のみの小クラスタ（ノイズ）
      { x: 200, y: 200 }, { x: 210, y: 200 }, { x: 220, y: 200 }, // 3点の本物クラスタ
    ];
    const result = bfsClusters(hits, 10, 180, 3);
    expect(result.length).toBe(1); // 小クラスタは除外
  });

  it('影で中央が欠けた1枚シールは1クラスタになる（ポストマージ）', () => {
    // 左半分: x=0〜40、右半分: x=60〜100（x=50付近が影で欠けている）
    const hits: { x: number; y: number }[] = [];
    for (let gx = 0; gx <= 4; gx++) hits.push({ x: gx * 10, y: 50 });
    for (let gx = 6; gx <= 10; gx++) hits.push({ x: gx * 10, y: 50 });
    const result = bfsClusters(hits, 10);
    expect(result.length).toBe(1);
  });

  it('明らかに別々の2製品（距離200px超）は2クラスタのまま', () => {
    // 製品間は最低2cm以上の間隔があるため、200px超は確実に別製品
    const hits = [
      { x: 10, y: 10 }, { x: 20, y: 10 },
      { x: 230, y: 10 }, { x: 240, y: 10 },
    ];
    const result = bfsClusters(hits, 10);
    expect(result.length).toBe(2);
  });
});
