import { useRef, useState, useCallback } from 'react';
import { Upload, ScanSearch, RefreshCw, RotateCcw, PackageCheck, PackageX } from 'lucide-react';
import { rgbToHsv, matchesColor, MARKER_COLORS } from '../colorUtils';
import type { ColorMaster, DetectionResult } from '../types';

interface Props {
  masters: ColorMaster[];
  results: DetectionResult[];
  onResults: (r: DetectionResult[]) => void;
}

const SCAN_STEP = 10;
const CLUSTER_DIST = 30;

export default function ShippingCheck({ masters, results, onResults }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [scanning, setScanning] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const runScan = useCallback(async (canvas: HTMLCanvasElement, overlay: HTMLCanvasElement) => {
    setScanning(true);
    await new Promise(r => setTimeout(r, 10));

    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const rawHits: Map<string, { x: number; y: number }[]> = new Map(
      masters.map(m => [m.id, []])
    );

    for (let y = 0; y < canvas.height; y += SCAN_STEP) {
      for (let x = 0; x < canvas.width; x += SCAN_STEP) {
        const idx = (y * canvas.width + x) * 4;
        const hsv = rgbToHsv(data[idx], data[idx + 1], data[idx + 2]);
        for (const master of masters) {
          if (matchesColor(hsv, master.hsv)) {
            rawHits.get(master.id)!.push({ x, y });
          }
        }
      }
    }

    const detections: DetectionResult[] = [];
    masters.forEach((master, i) => {
      const hits = rawHits.get(master.id)!;
      const clusters: { x: number; y: number }[] = [];
      for (const hit of hits) {
        let merged = false;
        for (const c of clusters) {
          const dx = hit.x - c.x, dy = hit.y - c.y;
          if (Math.sqrt(dx * dx + dy * dy) < CLUSTER_DIST) {
            c.x = Math.round((c.x + hit.x) / 2);
            c.y = Math.round((c.y + hit.y) / 2);
            merged = true;
            break;
          }
        }
        if (!merged) clusters.push({ ...hit });
      }
      if (clusters.length > 0) {
        detections.push({
          masterId: master.id,
          productName: master.productName,
          count: clusters.length,
          color: MARKER_COLORS[i % MARKER_COLORS.length],
          positions: clusters,
          checked: false,
        });
      }
    });

    const octx = overlay.getContext('2d')!;
    octx.clearRect(0, 0, overlay.width, overlay.height);
    detections.forEach(det => {
      octx.strokeStyle = det.color;
      octx.fillStyle = det.color;
      octx.lineWidth = 2;
      octx.font = 'bold 11px sans-serif';
      det.positions.forEach(pos => {
        const r = 18;
        octx.beginPath();
        octx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
        octx.globalAlpha = 0.35;
        octx.fill();
        octx.globalAlpha = 1;
        octx.stroke();
        octx.fillStyle = '#fff';
        octx.strokeStyle = '#000';
        octx.lineWidth = 3;
        const label = det.productName.slice(0, 4);
        octx.strokeText(label, pos.x - octx.measureText(label).width / 2, pos.y + 4);
        octx.fillText(label, pos.x - octx.measureText(label).width / 2, pos.y + 4);
        octx.strokeStyle = det.color;
        octx.lineWidth = 2;
        octx.fillStyle = det.color;
      });
    });

    onResults(detections);
    setScanning(false);
  }, [masters, onResults]);

  const loadImage = (file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const canvas = canvasRef.current!;
      const maxW = Math.min(700, window.innerWidth - 32);
      const scale = Math.min(maxW / img.naturalWidth, 500 / img.naturalHeight, 1);
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      const overlay = overlayRef.current!;
      overlay.width = canvas.width;
      overlay.height = canvas.height;
      setImageLoaded(true);
      onResults([]);
      // 自動スキャン
      if (masters.length > 0) runScan(canvas, overlay);
    };
    img.src = url;
  };

  const rescan = () => {
    if (canvasRef.current && overlayRef.current) runScan(canvasRef.current, overlayRef.current);
  };

  const reset = () => {
    setImageLoaded(false);
    onResults([]);
    imgRef.current = null;
    overlayRef.current?.getContext('2d')?.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
  };

  return (
    <div className="space-y-4">
      {/* Upload / image area */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <ScanSearch size={20} className="text-purple-500" />
            出荷チェック画像
          </h2>
          {imageLoaded && (
            <div className="flex gap-2">
              {scanning
                ? <span className="flex items-center gap-1 text-xs text-purple-600"><RefreshCw size={14} className="animate-spin" />スキャン中</span>
                : <button onClick={rescan} className="flex items-center gap-1 text-xs text-purple-600 border border-purple-300 rounded-lg px-2 py-1 hover:bg-purple-50">
                    <RefreshCw size={14} />再スキャン
                  </button>
              }
              <button onClick={reset} className="flex items-center gap-1 text-xs text-gray-500 border border-gray-300 rounded-lg px-2 py-1 hover:bg-gray-50">
                <RotateCcw size={14} />やり直し
              </button>
            </div>
          )}
        </div>

        {!imageLoaded ? (
          <div
            className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center cursor-pointer hover:bg-purple-50 transition-colors"
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) loadImage(f); }}
          >
            <Upload size={36} className="mx-auto text-purple-400 mb-2" />
            <p className="text-sm font-medium text-gray-700">タップして撮影 / 画像を選択</p>
            <p className="text-xs text-gray-400 mt-1">製品を並べた写真を選ぶと自動で色を検出します</p>
            {masters.length === 0 && (
              <p className="text-xs text-red-400 mt-2 font-medium">先にマスタ登録タブで製品の色を登録してください</p>
            )}
          </div>
        ) : (
          <div className="relative overflow-auto">
            <div className="relative inline-block w-full">
              <canvas ref={canvasRef} className="rounded border border-gray-200 block max-w-full w-full" />
              <canvas ref={overlayRef} className="absolute top-0 left-0 rounded pointer-events-none max-w-full w-full" />
              {scanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded">
                  <div className="flex items-center gap-2 bg-white border border-purple-200 shadow rounded-full px-4 py-2 text-sm text-purple-700 font-medium">
                    <RefreshCw size={16} className="animate-spin" />スキャン中...
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) loadImage(f); e.target.value = ''; }} />
      </div>

      {/* Results list — shown immediately after scan */}
      {imageLoaded && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <PackageCheck size={18} className="text-purple-500" />
            <h2 className="font-semibold text-gray-800">検出された製品</h2>
            {results.length > 0 && (
              <span className="ml-auto text-xs bg-purple-100 text-purple-700 font-medium px-2 py-0.5 rounded-full">
                {results.length}種類 / 計{results.reduce((s, r) => s + r.count, 0)}個
              </span>
            )}
          </div>

          {scanning ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">スキャン中...</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <PackageX size={28} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">
                {masters.length === 0 ? 'マスタを登録してください' : '検出できた製品がありません'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {results.map(det => (
                <div key={det.masterId} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: det.color }} />
                  <span className="flex-1 font-medium text-gray-800 text-sm">{det.productName}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold" style={{ color: det.color }}>{det.count}</span>
                    <span className="text-sm text-gray-500">個</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
